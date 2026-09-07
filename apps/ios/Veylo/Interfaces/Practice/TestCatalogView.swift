import SwiftUI

struct TestCatalogView: View {
    @Environment(AppModel.self) private var model
    @Environment(AppRouter.self) private var router
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var skill: Skill = .reading

    var body: some View {
        PageScroll {
            BrandHeader()
            ScreenHeading(title: "IELTS practice", subtitle: "Pick a skill. Build your confidence.").reveal()
            Button {
                router.sheet = .fullExam
            } label: {
                VStack(spacing: 12) {
                    HStack(spacing: 3) { ForEach(Skill.allCases) { Capsule().fill($0.accent).frame(height: 4) } }
                    HStack(spacing: 12) {
                        Image(systemName: "list.clipboard").font(.system(size: 24))
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Full mock exam").font(VeyloStyle.font(18, weight: .heavy))
                            Text("All 4 skills · 2 hr 45 min").font(VeyloStyle.font(13)).foregroundStyle(
                                VeyloStyle.muted)
                        }
                        Spacer()
                        Image(systemName: "arrow.right")
                    }
                }.panel(VeyloStyle.panel)
            }.buttonStyle(PressStyle()).accessibilityIdentifier("Full mock exam").reveal(delay: 0.04)
            SkillSelector(selection: $skill)
            HStack {
                SectionHeading(title: skill == .reading ? "Academic Reading" : "\(skill.rawValue) practice")
                Text("Demo tests").font(VeyloStyle.font(12)).foregroundStyle(VeyloStyle.muted)
            }
            VStack(alignment: .leading, spacing: 12) {
                Text("\(skill.rawValue) Test 8").font(VeyloStyle.font(20, weight: .heavy))
                Text(
                    model.snapshot.sessions["\(skill.rawValue)-8"] == nil
                        ? "A focused practice session" : "Your answers and draft are saved"
                )
                .font(VeyloStyle.font(13)).foregroundStyle(VeyloStyle.muted)
                PrimaryButton(
                    title: model.snapshot.sessions["\(skill.rawValue)-8"] == nil ? "Start test" : "Continue test",
                    symbol: "play", color: skill.ink
                ) {
                    router.path.append(.practice(model.startPractice(skill)))
                }
            }.panel(skill.surface)
            VStack(spacing: 10) {
                ActionRow(
                    title: "Random test", subtitle: "Try something new", symbol: "shuffle", color: skill.accent,
                    surface: skill.surface
                ) {
                    router.path.append(.practice(model.startPractice(skill, number: Int.random(in: 9...14))))
                }
                ForEach(9...14, id: \.self) { number in
                    ActionRow(
                        title: "\(skill.rawValue) Test \(number)",
                        subtitle: "\(skill == .reading ? "Academic" : "IELTS") · Demo practice", symbol: skill.symbol,
                        color: skill.accent, surface: skill.surface, trailing: "play"
                    ) {
                        router.path.append(.practice(model.startPractice(skill, number: number)))
                    }
                }
            }.id(skill).transition(.opacity)
        }.animation(reduceMotion ? Motion.reduced : Motion.selection, value: skill)
    }
}

struct SkillSelector: View {
    @Binding var selection: Skill
    var body: some View {
        ViewThatFits(in: .horizontal) {
            HStack(spacing: 6) { buttons }
            ScrollView(.horizontal) { HStack(spacing: 6) { buttons } }.scrollIndicators(.hidden)
        }
    }

    private var buttons: some View {
        ForEach(Skill.allCases) { skill in
            Button {
                selection = skill
            } label: {
                Text(skill.rawValue).font(VeyloStyle.font(11, weight: .heavy))
                    .foregroundStyle(skill.ink).padding(.horizontal, 12).frame(minHeight: 44).frame(maxWidth: .infinity)
                    .background(skill.surface, in: RoundedRectangle(cornerRadius: 12))
                    .overlay(
                        RoundedRectangle(cornerRadius: 12).stroke(
                            selection == skill ? skill.accent : .clear, lineWidth: 1.5))
            }.buttonStyle(PressStyle()).accessibilityIdentifier("skill-\(skill.rawValue)")
                .accessibilityAddTraits(selection == skill ? .isSelected : [])
        }
    }
}
