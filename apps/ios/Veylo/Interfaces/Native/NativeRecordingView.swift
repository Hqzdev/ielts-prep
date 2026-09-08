import SwiftUI

#if DEBUG
    struct NativeRecordingView: View {
        @Bindable var state: NativePracticeModel
        @Environment(NativeAppModel.self) private var model
        @Environment(\.scenePhase) private var phase
        @Environment(\.accessibilityReduceMotion) private var reduceMotion
        @State private var device: (any NativeAudioDevice)?
        @State private var recording = false
        @State private var hasLocal = false
        private var question: Int { state.answer.audioIds.count }
        @State private var ticket: Ticket?
        struct Ticket: Decodable {
            var id: String
            var path: String
            var token: String
        }

        var body: some View {
            VStack(alignment: .leading, spacing: 16) {
                Text("Speaking recording lab").font(VeyloStyle.font(23, weight: .heavy))
                Text("Record, listen back and save. No AI grading or transcription.").font(VeyloStyle.font(14))
                if let task = state.result?.attempt.taskSnapshot {
                    if task.speakingQuestions.indices.contains(question) {
                        Text("Question \(question + 1)").font(VeyloStyle.font(13, weight: .bold))
                    }
                    if task.speakingQuestions.indices.contains(question) {
                        Text(task.speakingQuestions[question]).font(VeyloStyle.font(20, weight: .bold))
                    }
                    ForEach(task.cuePoints, id: \.self) { Text("• " + $0) }
                }
                if state.result?.attempt.editable == true {
                    if recording {
                        TimelineView(.periodic(from: .now, by: 0.1)) { _ in
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Recording · \(Int(device?.duration ?? 0)) seconds").monospacedDigit()
                                if !reduceMotion { ProgressView(value: Double(device?.level ?? 0)) }
                            }
                        }
                        PrimaryButton(title: "Stop recording", symbol: "stop.fill") { stop() }
                    } else {
                        NativeBusyButton(
                            title: hasLocal ? "Record again" : "Start recording",
                            enabled: question < (state.result?.attempt.taskSnapshot.speakingQuestions.count ?? 0)
                        ) {
                            try await device?.start()
                            recording = device?.isRecording == true
                            hasLocal = false
                            ticket = nil
                        }
                        if hasLocal {
                            NativeBusyButton(title: "Play recording") { try await device?.play() }
                            NativeBusyButton(title: "Upload recording") {
                                guard let data = try device?.data() else { return }
                                struct Request: Encodable {
                                    var attemptId: String
                                    var questionIndex: Int
                                    var bytes: Int
                                }
                                if ticket == nil {
                                    ticket = try await model.remote.send(
                                        "audio/upload-ticket", method: "POST",
                                        body: Request(attemptId: state.id, questionIndex: question, bytes: data.count),
                                        as: Ticket.self)
                                }
                                do {
                                    let _: NativeAcknowledgement = try await model.remote.send(
                                        "audio/\(ticket!.id)/complete", method: "POST", body: [String: String](),
                                        as: NativeAcknowledgement.self)
                                } catch {
                                    try await model.remote.upload(data, path: ticket!.path, token: ticket!.token)
                                    let _: NativeAcknowledgement = try await model.remote.send(
                                        "audio/\(ticket!.id)/complete", method: "POST", body: [String: String](),
                                        as: NativeAcknowledgement.self)
                                }
                                if !state.answer.audioIds.contains(ticket!.id) {
                                    state.answer.audioIds.append(ticket!.id)
                                }
                                state.changed()
                                try await state.flush()
                                try device?.delete()
                                hasLocal = false
                                ticket = nil
                            }
                            NativeBusyButton(title: "Delete local recording") {
                                try device?.delete()
                                hasLocal = false
                                ticket = nil
                            }
                        }
                    }
                }
                ForEach(state.answer.audioIds, id: \.self) { id in
                    HStack {
                        NativeBusyButton(title: "Play saved audio") {
                            struct Playback: Decodable { var url: URL }
                            let result = try await model.remote.get("audio/\(id)", as: Playback.self)
                            try await device?.play(url: result.url)
                        }
                        if state.result?.attempt.editable != true || id == state.answer.audioIds.last {
                            NativeBusyButton(title: "Delete") {
                                let _: NativeAcknowledgement = try await model.remote.send(
                                    "audio/\(id)", method: "DELETE",
                                    body: [String: String](), as: NativeAcknowledgement.self)
                                state.answer.audioIds.removeAll { $0 == id }
                                if state.result?.attempt.editable == true {
                                    state.changed()
                                    try await state.flush()
                                }
                            }
                        }
                    }
                }
            }.panel(Skill.speaking.surface)
                .task {
                    if let attempt = state.result?.attempt {
                        device = model.audio.device(user: attempt.userId, attempt: state.id)
                        hasLocal = device?.hasRecording == true
                    }
                }
                .task(id: recording) {
                    guard recording else { return }
                    while !Task.isCancelled && recording {
                        do { try await Task.sleep(for: .milliseconds(200)) } catch { return }
                        if device?.isRecording != true { stop() }
                    }
                }
                .onChange(of: phase) { _, phase in if phase != .active { stop() } }
                .onDisappear { stop() }
        }
        private func stop() {
            device?.stop()
            recording = false
            hasLocal = device?.hasRecording == true
        }
    }
#endif
