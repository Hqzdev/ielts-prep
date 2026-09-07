import SwiftUI

struct WritingExercise: View {
    var session: PracticeSession
    var elapsed: Int
    @Binding var showTimer: Bool
    @Environment(AppModel.self) private var model
    @State private var draft = ""

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            HStack {
                Caption(text: "OPINION ESSAY", color: Skill.writing.ink)
                Spacer()
                PracticeTimer(seconds: 2400 - elapsed, visible: $showTimer)
            }
            VStack(alignment: .leading, spacing: 12) {
                Text("Should cities prioritise public transport over building new roads?").font(
                    VeyloStyle.font(24, weight: .heavy))
                Text("To what extent do you agree or disagree? Give reasons and examples. Write at least 250 words.")
                    .font(VeyloStyle.font(15)).foregroundStyle(VeyloStyle.muted)
            }.panel(Skill.writing.surface).foregroundStyle(Skill.writing.ink)
            VStack(alignment: .leading, spacing: 10) {
                Caption(text: "YOUR RESPONSE", color: Skill.writing.ink)
                ZStack(alignment: .topLeading) {
                    if draft.isEmpty {
                        Text("Start with your main idea...").font(VeyloStyle.font(16)).foregroundStyle(VeyloStyle.muted)
                            .padding(.top, 8).padding(.leading, 5)
                            .allowsHitTesting(false)
                    }
                    TextEditor(text: $draft)
                        .font(VeyloStyle.font(16)).lineSpacing(5).scrollContentBackground(.hidden)
                        .frame(minHeight: 275).accessibilityIdentifier("Essay response")
                }
            }.panel(.white).overlay(RoundedRectangle(cornerRadius: 24).stroke(VeyloStyle.line))
            HStack {
                Text("\(draft.split(whereSeparator: { $0.isWhitespace }).count) words · minimum 250")
                Spacer()
                Label("Draft saved", systemImage: "checkmark")
            }.font(VeyloStyle.font(11)).foregroundStyle(VeyloStyle.muted)
        }
        .onAppear { draft = session.essay }
        .onChange(of: draft) { _, value in
            model.editSession(session.id) { $0.essay = value }
        }
    }
}
