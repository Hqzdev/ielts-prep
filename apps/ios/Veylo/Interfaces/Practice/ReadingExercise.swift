import SwiftUI

struct ReadingExercise: View {
    var session: PracticeSession
    var elapsed: Int
    @Binding var showTimer: Bool
    var openPassage: () -> Void
    @Environment(AppModel.self) private var model

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            HStack {
                Text("Test \(session.testNumber) · \(session.answerCount) answers saved").font(VeyloStyle.font(12))
                    .foregroundStyle(VeyloStyle.muted)
                Spacer()
                PracticeTimer(seconds: 3600 - elapsed, visible: $showTimer)
            }
            VStack(alignment: .leading, spacing: 12) {
                Label("The city beneath the trees", systemImage: "book").font(VeyloStyle.font(18, weight: .heavy))
                Text("Urban trees do more than provide shade.").font(VeyloStyle.font(16))
                Button {
                    model.editSession(session.id) { $0.highlighted.toggle() }
                } label: {
                    Text("Their leaves cool the surrounding air.")
                        .font(VeyloStyle.font(16, weight: .semibold)).multilineTextAlignment(.leading)
                        .frame(maxWidth: .infinity, alignment: .leading).padding(10)
                        .background(
                            session.highlighted ? Color(hex: 0xCDE0FF) : .white.opacity(0.5),
                            in: RoundedRectangle(cornerRadius: 6))
                }.buttonStyle(PressStyle()).accessibilityLabel("Highlight evidence")
                HStack {
                    Text(session.highlighted ? "Your highlight" : "Tap the evidence to highlight").font(
                        VeyloStyle.font(11))
                    Spacer()
                    Button(action: openPassage) {
                        Label("Full passage", systemImage: "arrow.up.right").font(VeyloStyle.font(12, weight: .bold))
                    }.frame(minHeight: 44)
                }
            }.panel(Skill.reading.surface).foregroundStyle(Skill.reading.ink)
            VStack(alignment: .leading, spacing: 10) {
                Caption(text: "QUESTION \(session.question + 1) / 3 · DEMO EXCERPT", color: Skill.reading.accent)
                Text(model.content.readingQuestions[min(session.question, 2)]).font(VeyloStyle.font(24, weight: .heavy))
                Text("Does the statement agree with the passage?").font(VeyloStyle.font(13)).foregroundStyle(
                    VeyloStyle.muted)
            }.id(session.question)
            VStack(spacing: 10) {
                ForEach(["TRUE", "FALSE", "NOT GIVEN"], id: \.self) { answer in
                    SelectionCard(
                        title: answer, selected: session.answers[String(session.question)] == answer,
                        color: Skill.reading.accent, surface: Skill.reading.surface
                    ) {
                        model.editSession(session.id) { $0.answers[String(session.question)] = answer }
                    }
                }
            }
            HStack {
                Label("Your answers are saved", systemImage: "checkmark").font(VeyloStyle.font(11)).foregroundStyle(
                    VeyloStyle.muted)
                Spacer()
                Button {
                    model.editSession(session.id) {
                        if $0.flaggedQuestions.contains(session.question) {
                            $0.flaggedQuestions.remove(session.question)
                        } else {
                            $0.flaggedQuestions.insert(session.question)
                        }
                    }
                } label: {
                    Label(
                        session.flaggedQuestions.contains(session.question) ? "Marked" : "Mark for review",
                        systemImage: session.flaggedQuestions.contains(session.question) ? "flag.fill" : "flag"
                    )
                    .font(VeyloStyle.font(11, weight: .bold)).foregroundStyle(Skill.reading.accent)
                }.frame(minHeight: 44)
            }
        }
    }
}
