import SwiftUI

struct ChatView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var input = ""
    @State private var selectedSkill: Skill = .writing
    @State private var pendingID: Int?
    @FocusState private var inputFocused: Bool

    var body: some View {
        ScrollViewReader { reader in
            PageScroll {
                ScreenHeading(title: "What are we practising?", subtitle: "Choose a task. Vey keeps the exam context.")
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                    ForEach([Skill.writing, .speaking, .reading, .listening]) { skill in
                        Button {
                            selectedSkill = skill
                            send(prompt(for: skill))
                        } label: {
                            VStack(alignment: .leading, spacing: 8) {
                                Label(skill.rawValue.uppercased(), systemImage: skill.symbol).font(
                                    VeyloStyle.font(10, weight: .heavy))
                                Text(prompt(for: skill)).font(VeyloStyle.font(14, weight: .heavy))
                            }.frame(maxWidth: .infinity, minHeight: 46, alignment: .leading).padding(14)
                                .background(skill.surface, in: RoundedRectangle(cornerRadius: 16))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 16).stroke(
                                        selectedSkill == skill ? skill.accent : .clear, lineWidth: 1)
                                )
                                .foregroundStyle(skill.ink)
                        }.buttonStyle(PressStyle()).disabled(pendingID != nil).accessibilityIdentifier(
                            prompt(for: skill))
                    }
                }
                VStack(alignment: .leading, spacing: 10) {
                    Caption(
                        text: "\(prompt(for: selectedSkill).uppercased()) · PRACTICE CONTEXT",
                        color: selectedSkill.accent)
                    Text(
                        selectedSkill == .writing
                            ? "Public transport or more roads?"
                            : selectedSkill == .speaking
                                ? "A place where you like to relax"
                                : selectedSkill == .reading
                                    ? "The city beneath the trees" : "A booking at the sports centre"
                    )
                    .font(VeyloStyle.font(18, weight: .heavy))
                    Text(
                        selectedSkill == .writing
                            ? "“Cities should invest more in public transport because it gives people a cheaper way to travel.”"
                            : "One task at a time. Keep the question in view as you practise."
                    )
                    .font(VeyloStyle.font(14))
                }.panel(selectedSkill.surface).foregroundStyle(selectedSkill.ink)
                if model.snapshot.messages.isEmpty {
                    VStack(alignment: .leading, spacing: 14) {
                        HStack {
                            Mascot(size: 26)
                            Text("Vey · building your introduction").font(VeyloStyle.font(13, weight: .heavy))
                        }
                        coachingLine("Position", detail: "Clear — you support public transport.")
                        coachingLine("Reason", detail: "Present — cheaper travel.")
                        coachingLine("Next step", detail: "Explain how you'll develop this argument.")
                    }.reveal()
                }
                ForEach(model.snapshot.messages) { message in
                    VStack(alignment: .leading, spacing: 8) {
                        if !message.isLearner {
                            HStack {
                                Mascot(size: 25)
                                Caption(text: "VEY · DEMO COACH")
                            }
                        }
                        Text(message.text).font(VeyloStyle.font(15)).lineSpacing(4).textSelection(.enabled)
                    }
                    .panel(message.isLearner ? (message.skill ?? .writing).surface : .white)
                    .padding(.leading, message.isLearner ? 28 : 0).padding(.trailing, message.isLearner ? 0 : 16)
                    .id(message.id).transition(reduceMotion ? .opacity : .opacity.combined(with: .move(edge: .bottom)))
                }
                if pendingID != nil {
                    HStack {
                        Mascot(size: 28)
                        Text("Vey is preparing an example…").font(VeyloStyle.font(13))
                        ProgressView().controlSize(.small)
                    }.id("pending")
                }
                Color.clear.frame(height: 1).id("bottom")
            }
            .safeAreaInset(edge: .bottom) {
                StickyFooter {
                    HStack(spacing: 12) {
                        TextField("Try the next sentence…", text: $input, axis: .vertical)
                            .font(VeyloStyle.font(15)).lineLimit(1...4).focused($inputFocused).accessibilityIdentifier(
                                "Chat message")
                        Button {
                            send(input)
                        } label: {
                            Image(systemName: "arrow.up").font(.system(size: 18, weight: .bold)).foregroundStyle(
                                selectedSkill.accent
                            ).frame(width: 44, height: 44)
                        }.disabled(input.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || pendingID != nil)
                            .accessibilityLabel("Send message")
                    }.padding(.leading, 16).padding(.trailing, 5).veyloGlass()
                    Text("Demo replies · \(prompt(for: selectedSkill)) stays attached to this conversation.")
                        .font(VeyloStyle.font(10)).foregroundStyle(VeyloStyle.muted)
                }
            }
            .onChange(of: model.snapshot.messages.count) { _, _ in
                withAnimation(reduceMotion ? Motion.reduced : Motion.navigation) {
                    reader.scrollTo("bottom", anchor: .bottom)
                }
            }
        }
        .navigationTitle("Vey · IELTS coach").navigationBarTitleDisplayMode(.inline).toolbar(
            .visible, for: .navigationBar
        )
        .onAppear {
            if let last = model.snapshot.messages.last {
                selectedSkill = last.skill ?? .writing
                if last.isLearner { pendingID = last.id }
            }
        }
        .task(id: pendingID) {
            guard let pendingID, let message = model.snapshot.messages.first(where: { $0.id == pendingID }) else {
                return
            }
            do {
                try await Task.sleep(for: .milliseconds(450))
                try Task.checkCancellation()
                let response = model.content.response(to: message.text, skill: message.skill ?? .writing)
                withAnimation(reduceMotion ? Motion.reduced : Motion.navigation) {
                    model.update {
                        $0.messages.append(
                            ChatMessage(id: pendingID + 1, text: response, isLearner: false, skill: message.skill))
                    }
                    self.pendingID = nil
                }
            } catch {}
        }
    }

    private func prompt(for skill: Skill) -> String {
        switch skill {
        case .writing: "Task 2 intro"
        case .speaking: "Part 2 cue card"
        case .reading: "Find evidence"
        case .listening: "Note completion"
        }
    }
    private func send(_ text: String) {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty, pendingID == nil else { return }
        let id = (model.snapshot.messages.last?.id ?? 0) + 1
        withAnimation(reduceMotion ? Motion.reduced : Motion.navigation) {
            model.update {
                $0.messages.append(ChatMessage(id: id, text: trimmed, isLearner: true, skill: selectedSkill))
            }
            pendingID = id
            input = ""
        }
    }
    private func coachingLine(_ title: String, detail: String) -> some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: title == "Next step" ? "arrow.right" : "checkmark").foregroundStyle(Skill.writing.accent)
            VStack(alignment: .leading, spacing: 4) {
                Text(title).font(VeyloStyle.font(13, weight: .heavy))
                Text(detail).font(VeyloStyle.font(13)).foregroundStyle(VeyloStyle.muted)
            }
        }
    }
}
