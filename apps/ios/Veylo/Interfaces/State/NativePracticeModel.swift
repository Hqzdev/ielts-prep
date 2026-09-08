import SwiftUI

@MainActor
@Observable
final class NativePracticeModel {
    let id: String
    private let remote: any NativeRemote
    private let drafts: any NativeDraftStorage
    private var saving: Task<Void, Error>?
    var result: NativeResult?
    var answer = NativeAnswer()
    var notes = NativeNotes()
    var conflict = false
    var saveError: String?
    var dirty = false
    var savedAt: Date?

    init(id: String, remote: any NativeRemote, drafts: any NativeDraftStorage) {
        self.id = id
        self.remote = remote
        self.drafts = drafts
    }

    func load() async throws {
        let latest = try await remote.get("attempts/\(id)", as: NativeResult.self)
        result = latest
        notes = try await remote.get("attempts/\(id)/notes", as: NativeNotes.self)
        answer = latest.attempt.answer
        if latest.attempt.editable, let draft = try drafts.load(user: latest.attempt.userId, attempt: id) {
            answer = draft.answer
            dirty = answer != latest.attempt.answer
            conflict = dirty && draft.revision != latest.attempt.revision
        }
    }

    func changed() {
        guard let attempt = result?.attempt, attempt.editable else { return }
        dirty = answer != attempt.answer
        do {
            try drafts.save(NativeDraft(answer: answer, revision: attempt.revision), user: attempt.userId, attempt: id)
        } catch {
            saveError = "Your latest edit could not be stored on this device. Keep this screen open and reconnect."
        }
    }

    func flush(action: String? = nil) async throws {
        if let saving { try await saving.value }
        guard let attempt = result?.attempt, attempt.editable else { return }
        guard !conflict else {
            throw NativeFailure(code: "REVISION_CONFLICT", message: "Choose which draft to keep before continuing.")
        }
        guard dirty || action != nil else { return }
        struct Save: Encodable {
            var revision: Int
            var answer: NativeAnswer
            var action: String?
        }
        let submitted = answer
        let task = Task { @MainActor in
            do {
                let updated = try await remote.send(
                    "attempts/\(id)", method: "PATCH",
                    body: Save(revision: attempt.revision, answer: submitted, action: action), as: NativeAttempt.self)
                result?.attempt = updated
                dirty = answer != updated.answer
                try drafts.save(
                    NativeDraft(answer: answer, revision: updated.revision), user: updated.userId, attempt: id)
                savedAt = Date()
                saveError = nil
            } catch let failure as NativeFailure
                where failure.code == "DEADLINE_EXPIRED" || failure.code == "ATTEMPT_LOCKED"
            {
                try await refreshResult()
                dirty = false
                saveError = nil
            } catch let failure as NativeFailure where failure.code == "REVISION_CONFLICT" {
                conflict = true
                throw failure
            }
        }
        saving = task
        do {
            try await task.value
            saving = nil
        } catch {
            saving = nil
            saveError = error.localizedDescription
            throw error
        }
    }

    func resolve(keepLocal: Bool) async throws {
        let latest = try await remote.get("attempts/\(id)", as: NativeResult.self)
        result = latest
        if !keepLocal || !latest.attempt.editable { answer = latest.attempt.answer }
        conflict = false
        dirty = answer != latest.attempt.answer
        changed()
        try await flush()
    }

    func saveNotes() async throws {
        do {
            notes = try await remote.send("attempts/\(id)/notes", method: "PATCH", body: notes, as: NativeNotes.self)
        } catch {
            notes = try await remote.get("attempts/\(id)/notes", as: NativeNotes.self)
            throw error
        }
    }

    func submit() async throws {
        try await flush()
        if dirty { try await flush() }
        guard result?.attempt.editable == true else { return }
        let _: NativeResult.Assessment = try await remote.send(
            "attempts/\(id)/submit", method: "POST", body: [String: String](), as: NativeResult.Assessment.self)
        try await refreshResult()
        if let user = result?.attempt.userId { try drafts.remove(user: user, attempt: id) }
    }

    func refreshResult() async throws { result = try await remote.get("attempts/\(id)/result", as: NativeResult.self) }

    func checkDeadline() async throws {
        guard let attempt = result?.attempt, attempt.editable, attempt.mode == "strict", remaining(at: .now) == 0 else {
            return
        }
        try await refreshResult()
        dirty = false
        saveError = nil
    }

    func remaining(at date: Date) -> Int {
        guard let attempt = result?.attempt else { return 0 }
        if let deadline = NativeDate.instant(attempt.deadlineAt) {
            return max(0, Int(deadline.timeIntervalSince(date)))
        }
        let active =
            attempt.status == "in_progress"
            ? NativeDate.instant(attempt.activeSince).map { max(0, Int(date.timeIntervalSince($0))) } ?? 0 : 0
        return max(0, attempt.taskSnapshot.durationSeconds - attempt.elapsedSeconds - active)
    }
}
