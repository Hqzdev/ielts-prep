import SwiftUI

@MainActor
@Observable
final class NativeAppModel {
    let identity: any NativeIdentity
    let remote: any NativeRemote
    let drafts: any NativeDraftStorage
    let reminders: any NativeReminders
    let audio: any NativeAudioLibrary
    var account: NativeBootstrap?
    var signedIn = false
    var loading = true
    var busy = false
    var learningRevision = 0
    var error: String?
    var notice: String?
    var recovery = false

    init(
        identity: any NativeIdentity, remote: any NativeRemote, drafts: any NativeDraftStorage,
        reminders: any NativeReminders, audio: any NativeAudioLibrary
    ) {
        self.identity = identity
        self.remote = remote
        self.drafts = drafts
        self.reminders = reminders
        self.audio = audio
    }

    func restore() async {
        loading = true
        signedIn = await identity.hasSession()
        if signedIn {
            do { try await refresh() } catch { self.error = error.localizedDescription }
        }
        loading = false
    }

    func refresh() async throws {
        account = try await remote.bootstrap()
        signedIn = true
    }

    func saveProfile(_ profile: NativeProfile) async throws -> NativeProfile {
        let _: NativeAcknowledgement = try await remote.send(
            "profile", method: "PATCH", body: profile, as: NativeAcknowledgement.self)
        let updated = try await remote.get("profile", as: NativeProfile.self)
        account?.profile = updated
        return updated
    }

    func perform(_ action: @escaping @MainActor @Sendable () async throws -> Void) {
        guard !busy else { return }
        busy = true
        Task {
            defer { busy = false }
            do { try await action() } catch is CancellationError {} catch { self.error = error.localizedDescription }
        }
    }

    func receive(_ url: URL) {
        perform {
            self.recovery = try await self.identity.callback(url)
            try await self.refresh()
        }
    }

    func signOut() async throws {
        let user = account?.profile.id
        defer {
            reminders.clear()
            account = nil
            signedIn = false
        }
        var cleanupError: Error?
        if let user {
            do { try drafts.clear(user: user) } catch { cleanupError = error }
            do { try audio.clear(user: user) } catch { cleanupError = error }
        }
        try await identity.signOut()
        if let cleanupError { throw cleanupError }
    }

    func record(event: String, step: Int, entry: String) async throws {
        struct Event: Encodable {
            var id = UUID().uuidString
            var event: String
            var step: Int
            var entry: String
            var version = 1
        }
        let _: NativeAcknowledgement = try await remote.send(
            "events", method: "POST",
            body: Event(event: event, step: step, entry: entry), as: NativeAcknowledgement.self)
    }

    func saveOnboarding(_ answers: NativeAnswers, step: Int, complete: Bool) async throws {
        guard let current = account?.onboarding else { return }
        struct Request: Encodable {
            var revision: Int
            var step: Int
            var answers: NativeAnswers
            var complete: Bool
        }
        let updated = try await remote.send(
            "onboarding", method: "PATCH",
            body: Request(revision: current.revision, step: step, answers: answers, complete: complete),
            as: NativeOnboarding.self)
        if complete {
            var refreshed = try await remote.bootstrap()
            if current.completedAt == nil && refreshed.profile.timezone != TimeZone.current.identifier {
                var profile = refreshed.profile
                profile.timezone = TimeZone.current.identifier
                refreshed.profile = try await saveProfile(profile)
            }
            account = refreshed
            learningRevision += 1
        } else {
            account?.onboarding = updated
        }
    }
}

enum NativeRoute: Hashable {
    case practice(String)
    case vocabulary
    case arcade
    case sprint(String)
    case ai
    case chat(String?, String?)
}

extension NativeTask {
    var displaySkill: Skill {
        switch skill {
        case "reading": .reading
        case "writing": .writing
        default: .speaking
        }
    }
}

struct NativeBusyButton: View {
    var title: String
    var enabled = true
    var action: @MainActor @Sendable () async throws -> Void
    @Environment(NativeAppModel.self) private var model
    var body: some View {
        PrimaryButton(title: title, enabled: enabled && !model.busy) { model.perform(action) }
    }
}

struct NativeEmptyState: View {
    var title: String
    var detail: String
    var body: some View {
        VStack(spacing: 14) {
            Mascot(size: 96)
            Text(title).font(VeyloStyle.font(22, weight: .heavy))
            Text(detail).font(VeyloStyle.font(15)).foregroundStyle(VeyloStyle.muted).multilineTextAlignment(.center)
        }.frame(maxWidth: .infinity).padding(.vertical, 28)
    }
}
