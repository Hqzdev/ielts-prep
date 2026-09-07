import SwiftUI

struct AIHomeView: View {
    @Environment(AppRouter.self) private var router
    @State private var personality = "Friendly"
    var body: some View {
        PageScroll {
            VStack(spacing: 16) {
                Mascot(size: 144).reveal()
                Text("Your IELTS practice\npartner").font(VeyloStyle.font(28, weight: .heavy)).multilineTextAlignment(
                    .center)
                Text("Rehearse an answer. Understand the feedback.").font(VeyloStyle.font(14)).foregroundStyle(
                    VeyloStyle.muted)
            }.frame(maxWidth: .infinity).padding(.vertical, 20)
            Picker("Vey personality", selection: $personality) {
                ForEach(["Friendly", "Examiner", "Coach"], id: \.self) { Text($0).tag($0) }
            }.pickerStyle(.segmented)
            VStack(alignment: .leading, spacing: 14) {
                Text(personality == "Examiner" ? "A rehearsal for the real thing." : "A cue card. A clear next step.")
                    .font(VeyloStyle.font(24, weight: .heavy))
                Text(
                    personality == "Examiner"
                        ? "Practise a speaking round with prompts held until your answer is finished."
                        : "Practise Speaking Parts 1–3 with prompts and feedback tied to the IELTS criteria."
                )
                .font(VeyloStyle.font(15)).foregroundStyle(VeyloStyle.muted)
                PrimaryButton(title: "Start talking", symbol: "mic", color: Skill.speaking.ink) {
                    router.path.append(.voice(personality))
                }
            }.panel(Skill.speaking.surface).foregroundStyle(Skill.speaking.ink).reveal(delay: 0.08)
            VStack(spacing: 10) {
                ActionRow(
                    title: "Chat with Vey", subtitle: "Ask a question or get task help", symbol: "bubble",
                    color: VeyloStyle.ink
                ) { router.path.append(.chat) }
                ActionRow(
                    title: "Recent conversations", subtitle: "Pick up where you left off",
                    symbol: "clock.arrow.circlepath"
                ) { router.sheet = .conversations }
            }.reveal(delay: 0.12)
            Text("Demo coach · scripted responses · no microphone access").font(VeyloStyle.font(11)).foregroundStyle(
                VeyloStyle.muted)
        }.navigationTitle("Vey AI").navigationBarTitleDisplayMode(.inline).toolbar(.visible, for: .navigationBar)
    }
}
