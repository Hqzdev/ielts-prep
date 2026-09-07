import Accessibility
import SwiftUI

struct ResultView: View {
    let result: PracticeResult
    @Environment(AppModel.self) private var model
    @Environment(AppRouter.self) private var router
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var revealed = false
    @State private var allFeedback = false
    private var session: PracticeSession? { model.snapshot.sessions[result.sourceSessionID] }
    private var savedResponse: String { result.savedResponse ?? session?.essay ?? "" }

    var body: some View {
        PageScroll {
            VStack(spacing: 0) {
                Label(
                    result.skill == .writing
                        ? "TASK 2 · OPINION ESSAY" : "IELTS \(result.skill.rawValue.uppercased()) · PRACTICE",
                    systemImage: result.skill.symbol
                )
                .font(VeyloStyle.font(11, weight: .heavy)).foregroundStyle(result.skill.accent)
                Text(result.band.formatted(.number.precision(.fractionLength(1))))
                    .font(VeyloStyle.font(220, weight: .black)).minimumScaleFactor(0.55).lineLimit(1)
                    .frame(maxWidth: .infinity, minHeight: 320)
                    .foregroundStyle(result.skill.ink)
                    .scaleEffect(revealed || reduceMotion ? 1 : 0.9)
                    .opacity(revealed ? 1 : 0)
                    .accessibilityLabel("Demo \(result.skill.rawValue) band \(result.band)")
                Text("Estimated IELTS \(result.skill.rawValue) band").font(VeyloStyle.font(14, weight: .bold))
                Text("Sample feedback · not an assessment of your work")
                    .font(VeyloStyle.font(12)).foregroundStyle(VeyloStyle.muted).padding(.top, 6)
            }.frame(maxWidth: .infinity)
            VStack(spacing: 12) {
                SectionHeading(title: "What shaped your score")
                ForEach(model.content.criteria(for: result.skill), id: \.0) { name, score in
                    VStack(spacing: 10) {
                        HStack {
                            Text(name).font(VeyloStyle.font(14, weight: .semibold))
                            Spacer()
                            Text(score.formatted(.number.precision(.fractionLength(1)))).font(
                                VeyloStyle.font(16, weight: .heavy)
                            ).foregroundStyle(result.skill.accent)
                        }.frame(minHeight: 38)
                        Divider().overlay(VeyloStyle.line)
                    }
                }
            }.reveal(delay: 0.25)
            VStack(alignment: .leading, spacing: 12) {
                Caption(
                    text: result.skill == .writing ? "NEXT FOCUS · TASK RESPONSE" : "YOUR NEXT STEP",
                    color: result.skill.ink)
                Text(focusTitle).font(VeyloStyle.font(24, weight: .heavy))
                Text(focusExample).font(VeyloStyle.font(15, weight: .bold))
                Text(focusExplanation).font(VeyloStyle.font(14)).foregroundStyle(VeyloStyle.muted)
                PrimaryButton(
                    title: result.skill == .writing ? "Revise this paragraph" : "Practise this skill",
                    symbol: "arrow.right", color: result.skill.ink
                ) { retry() }
            }.panel(result.skill.surface).reveal(delay: 0.4)
            Button(allFeedback ? "Hide detailed feedback" : "See all feedback") {
                withAnimation(reduceMotion ? Motion.reduced : Motion.navigation) { allFeedback.toggle() }
            }.font(VeyloStyle.font(14, weight: .bold)).frame(maxWidth: .infinity, minHeight: 44)
            if allFeedback {
                ForEach(model.content.criteria(for: result.skill), id: \.0) { criterion, _ in
                    VStack(alignment: .leading, spacing: 8) {
                        Text(criterion).font(VeyloStyle.font(18, weight: .heavy))
                        Text(model.content.feedback(for: result.skill, criterion: criterion))
                            .font(VeyloStyle.font(14)).foregroundStyle(VeyloStyle.muted)
                    }.panel(result.skill.surface).transition(.opacity)
                }
                if !savedResponse.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        SectionHeading(title: "Your saved response")
                        Text(savedResponse).font(VeyloStyle.font(15)).textSelection(.enabled)
                    }.panel(.white)
                }
            }
            if result.isFullExam {
                PrimaryButton(
                    title: result.skill == .speaking ? "Finish full exam" : "Next exam section", symbol: "arrow.right"
                ) {
                    if let next = model.nextExamSession(after: result.sourceSessionID) {
                        router.path.append(.practice(next))
                    } else {
                        router.path.removeAll()
                    }
                }
            }
            Button("Back to practice") { router.path.removeAll() }
                .font(VeyloStyle.font(14, weight: .bold)).frame(maxWidth: .infinity, minHeight: 44)
            Text("Demo practice feedback · not an official IELTS result").font(VeyloStyle.font(11)).foregroundStyle(
                VeyloStyle.muted)
        }
        .navigationTitle("IELTS \(result.skill.rawValue)").navigationBarTitleDisplayMode(.inline)
        .toolbar(.visible, for: .navigationBar)
        .onAppear { withAnimation(reduceMotion ? Motion.reduced : Motion.reveal) { revealed = true } }
        .task {
            do {
                try await Task.sleep(for: .milliseconds(reduceMotion ? 150 : 900))
                AccessibilityNotification.Announcement(
                    "Demo \(result.skill.rawValue) band \(result.band). Sample feedback is ready."
                ).post()
            } catch {}
        }
    }

    private var focusTitle: String {
        switch result.skill {
        case .writing: "Make one idea convincing."
        case .reading: "Let the passage decide."
        case .listening: "Predict before you listen."
        case .speaking: "Make your story specific."
        }
    }
    private var focusExample: String {
        switch result.skill {
        case .writing: "“Public transport is good for everyone.”"
        case .reading: "“Their leaves cool the surrounding air.”"
        case .listening: "“Start time: 6:30.”"
        case .speaking: "“I go there after a busy week.”"
        }
    }
    private var focusExplanation: String {
        switch result.skill {
        case .writing:
            "The claim is clear, but it needs support. Explain who benefits, why, and give one concrete example."
        case .reading:
            "This sentence supports TRUE. For NOT GIVEN, check that the passage really leaves the information unanswered."
        case .listening: "Predict a time before listening. Then check the final answer for spelling and the word limit."
        case .speaking:
            "Add one sensory detail and explain how it makes you feel. A clear example makes your answer easier to follow."
        }
    }
    private func retry() {
        let previous = session
        let response = savedResponse
        let id = model.startPractice(result.skill, number: previous?.testNumber ?? 8, restart: true)
        if !response.isEmpty { model.editSession(id) { $0.essay = response } }
        router.path.append(.practice(id))
    }
}
