import SwiftUI

struct NativeArcadeView: View {
    @Environment(NativeAppModel.self) private var model
    @State private var gameID = UUID().uuidString
    @State private var destination: String?
    var body: some View {
        PageScroll {
            BrandHeader()
            ScreenHeading(title: "A little play. Real practice.", subtitle: "Keep your words moving.")
            VStack(alignment: .leading, spacing: 20) {
                Image(systemName: "bolt.fill").font(.system(size: 40)).foregroundStyle(VeyloStyle.arcadeInk)
                ScreenHeading(title: "Word Sprint", subtitle: "10 rounds · 3 hearts · IELTS vocabulary")
                NativeBusyButton(title: "Start Word Sprint") {
                    struct Request: Encodable { var id: String }
                    let sprint = try await model.remote.send(
                        "word-sprints", method: "POST", body: Request(id: gameID), as: NativeSprint.self)
                    destination = sprint.id
                }
            }.panel(VeyloStyle.arcade)
            NavigationLink(value: NativeRoute.vocabulary) { Label("Practise your vocabulary", systemImage: "book") }
        }.navigationDestination(item: $destination) { NativeSprintView(id: $0) }
            .onChange(of: destination) { old, new in if old != nil && new == nil { gameID = UUID().uuidString } }
    }
}

struct NativeSprintView: View {
    var id: String
    @Environment(NativeAppModel.self) private var model
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var sprint: NativeSprint?
    @State private var feedback = false
    @State private var replayID: String?
    @State private var nextID = UUID().uuidString
    @State private var answer = ""
    var body: some View {
        PageScroll {
            if let sprint {
                HStack {
                    Text("\(sprint.score) points").font(VeyloStyle.font(22, weight: .heavy)).contentTransition(
                        .numericText())
                    Spacer()
                    Text(String(repeating: "❤️", count: max(0, sprint.lives)))
                        .accessibilityLabel("\(sprint.lives) hearts remaining")
                }
                ProgressView(value: Double(sprint.index), total: Double(sprint.total))
                if feedback, let answer = sprint.lastAnswer {
                    VStack(alignment: .leading, spacing: 16) {
                        Text(answer.correct ? "Nice work!" : "Keep going").font(VeyloStyle.font(28, weight: .heavy))
                        Text(answer.term).font(VeyloStyle.font(24, weight: .bold))
                        Text(answer.expected)
                        Text(answer.example)
                        PrimaryButton(title: sprint.finished ? "See score" : "Next round") {
                            withAnimation(reduceMotion ? Motion.reduced : Motion.selection) {
                                feedback = false
                                self.answer = ""
                            }
                        }
                    }.panel(answer.correct ? VeyloStyle.arcade : Skill.writing.surface).transition(.opacity)
                } else if sprint.finished {
                    NativeEmptyState(
                        title: "Sprint complete", detail: "\(sprint.score) points. Every round builds familiarity.")
                    NativeBusyButton(title: "Play again") {
                        struct Request: Encodable { var id: String }
                        let next = try await model.remote.send(
                            "word-sprints", method: "POST", body: Request(id: nextID), as: NativeSprint.self)
                        replayID = next.id
                    }
                } else if let question = sprint.question {
                    ScreenHeading(
                        title: "Round \(sprint.index + 1)",
                        subtitle: question.type == "gap" ? "Complete the sentence" : "Choose the matching word")
                    Text(question.prompt).font(VeyloStyle.font(26, weight: .heavy)).panel(VeyloStyle.arcade)
                    if question.options.isEmpty {
                        TextField("Your answer", text: $answer).textFieldStyle(.roundedBorder)
                            .textInputAutocapitalization(.never).autocorrectionDisabled().accessibilityIdentifier(
                                "Sprint answer")
                        NativeBusyButton(
                            title: "Check answer",
                            enabled: !answer.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
                        ) {
                            try await submit(question.id, answer: answer)
                        }
                    }
                    ForEach(question.options, id: \.self) { option in
                        SelectionCard(
                            title: option, selected: false, color: VeyloStyle.arcadeInk, surface: VeyloStyle.arcade
                        ) {
                            model.perform {
                                try await submit(question.id, answer: option)
                            }
                        }.disabled(model.busy).accessibilityIdentifier("sprint-option-\(option)")
                    }
                }
            } else {
                ProgressView("Opening Word Sprint…")
            }
        }
        .preference(key: NativeDockHiddenKey.self, value: true)
        .navigationDestination(item: $replayID) { NativeSprintView(id: $0) }
        .task {
            do { sprint = try await model.remote.get("word-sprints/\(id)", as: NativeSprint.self) } catch {
                model.error = error.localizedDescription
            }
        }
    }

    private func submit(_ question: String, answer: String) async throws {
        struct Request: Encodable {
            var questionId: String
            var answer: String
        }
        let next = try await model.remote.send(
            "word-sprints/\(id)", method: "POST",
            body: Request(questionId: question, answer: answer), as: NativeSprint.self)
        withAnimation(reduceMotion ? Motion.reduced : Motion.selection) {
            sprint = next
            feedback = true
        }
        if next.finished { model.learningRevision += 1 }
    }
}
