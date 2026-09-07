import Accessibility
import SwiftUI

struct HomeView: View {
    @Environment(AppModel.self) private var model
    @Environment(AppRouter.self) private var router
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    private var badgesLayout: AnyLayout {
        dynamicTypeSize.isAccessibilitySize
            ? AnyLayout(VStackLayout(spacing: 10)) : AnyLayout(HStackLayout(spacing: 10))
    }
    private var planSkills: [Skill] {
        model.snapshot.profile.answers.focus
            + Skill.allCases.filter { !model.snapshot.profile.answers.focus.contains($0) }
    }
    private var remainingSkills: [Skill] {
        planSkills.filter { !model.snapshot.completedTasks.contains("\($0.rawValue.lowercased())-8") }
    }
    private var completed: Int {
        4 - remainingSkills.count + (model.snapshot.completedTasks.contains("vocabulary-review") ? 1 : 0)
    }

    var body: some View {
        PageScroll {
            BrandHeader()
            ScreenHeading(
                title: "Hi, \(model.name)",
                subtitle: "Let's get closer to band \(model.target.formatted(.number.precision(.fractionLength(1))))."
            ).reveal()
            badgesLayout {
                Button {
                    router.sheet = .goal
                } label: {
                    Label(
                        "Target \(model.target.formatted(.number.precision(.fractionLength(1))))", systemImage: "scope"
                    )
                    .font(VeyloStyle.font(12, weight: .bold)).padding(.vertical, 9).frame(maxWidth: .infinity)
                    .background(VeyloStyle.lavender, in: Capsule())
                }.buttonStyle(PressStyle())
                StreakBadge(streak: model.snapshot.streak)
            }.reveal(delay: 0.05)
            VStack(alignment: .leading, spacing: 18) {
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 10) {
                        Caption(text: "TODAY'S PLAN", color: VeyloStyle.violet)
                        Text(
                            model.snapshot.profile.answers.barrier == .anxiety
                                ? "Build confidence,\none step at a time." : "A little progress,\nevery day."
                        )
                        .font(VeyloStyle.font(24, weight: .heavy))
                    }
                    Spacer(minLength: 0)
                    Mascot(size: 64)
                }
                Text(
                    completed == 5
                        ? "Your daily plan is complete. Nicely done."
                        : "\(completed) of 5 completed · \(max(5, (5 - completed) * 5)) min left"
                )
                .font(VeyloStyle.font(14)).foregroundStyle(VeyloStyle.muted)
                HStack(spacing: 6) {
                    ForEach(0..<5) { index in
                        Capsule().fill(index < completed ? VeyloStyle.accent : VeyloStyle.lavender).frame(height: 5)
                    }
                }.animation(reduceMotion ? Motion.reduced : Motion.selection, value: completed)
                    .accessibilityLabel("Daily plan").accessibilityValue("\(completed) of 5 completed")
                PrimaryButton(
                    title: completed == 0 ? "Start practice" : completed == 5 ? "Keep practising" : "Continue practice",
                    symbol: "arrow.right"
                ) {
                    if remainingSkills.isEmpty && completed < 5 {
                        router.path.append(.vocabulary)
                    } else {
                        router.path.append(.practice(model.startPractice(remainingSkills.first ?? planSkills[0])))
                    }
                }
            }.panel(Skill.listening.surface).reveal(delay: 0.1)
            VStack(spacing: 14) {
                HStack {
                    SectionHeading(title: "Up next")
                    Button("View all") { router.sheet = .dailyPlan }
                        .font(VeyloStyle.font(13, weight: .bold)).frame(minWidth: 60, minHeight: 44)
                }
                ForEach(Array((remainingSkills.isEmpty ? planSkills : remainingSkills).prefix(2))) { skill in
                    ActionRow(
                        title: skill == .listening
                            ? "Listening notes"
                            : skill == .speaking ? "Speaking cue card" : "\(skill.rawValue) practice",
                        subtitle: "5 min · Focus practice", symbol: skill.symbol,
                        color: skill.accent, surface: skill.surface, trailing: "play"
                    ) {
                        router.path.append(.practice(model.startPractice(skill)))
                    }
                }
            }.reveal(delay: 0.16)
            if completed == 0 {
                Text("Your first session starts your story. Your results will appear here as you practise.")
                    .font(VeyloStyle.font(13)).foregroundStyle(VeyloStyle.muted).reveal(delay: 0.2)
            }
        }.onChange(of: completed) { _, value in
            AccessibilityNotification.Announcement("Daily plan: \(value) of 5 completed").post()
        }
    }
}

struct StreakBadge: View {
    var streak: Int
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var celebrating = false

    var body: some View {
        HStack(spacing: 6) {
            Image(systemName: "flame.fill").font(.system(size: 21, weight: .bold))
                .foregroundStyle(
                    LinearGradient(
                        colors: [Color(hex: 0xFF4F32), Color(hex: 0xFF9828), Color(hex: 0xFFD43B)], startPoint: .top,
                        endPoint: .bottom)
                )
                .frame(width: 20, height: 24)
                .scaleEffect(celebrating && !reduceMotion ? 1.2 : 1)
            Text(streak == 0 ? "Your first spark" : "\(streak) day streak").font(VeyloStyle.font(12, weight: .bold))
        }.frame(maxWidth: .infinity).padding(.vertical, 5)
            .background(Color(hex: 0xFFFFBE), in: Capsule())
            .accessibilityElement(children: .combine)
            .task(id: streak) {
                guard streak > 0 else { return }
                withAnimation(reduceMotion ? Motion.reduced : Motion.press) { celebrating = true }
                try? await Task.sleep(for: .milliseconds(250))
                withAnimation(reduceMotion ? Motion.reduced : Motion.press) { celebrating = false }
            }
    }
}
