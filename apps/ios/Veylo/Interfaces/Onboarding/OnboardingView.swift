import SwiftUI

struct OnboardingView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var editingStep: Int?
    @State private var goingBack = false
    private var step: Int { editingStep ?? model.snapshot.onboardingStep }

    var body: some View {
        VStack(spacing: 0) {
            header
            if step == 5 {
                OnboardingReview { editingStep = $0 }
                    .transition(.opacity)
            } else {
                PageScroll {
                    SurveyQuestion(step: step)
                        .id(step)
                        .transition(
                            reduceMotion
                                ? .opacity
                                : .asymmetric(
                                    insertion: .move(edge: goingBack ? .leading : .trailing).combined(with: .opacity),
                                    removal: .opacity))
                }
            }
        }
        .background(VeyloStyle.paper)
        .safeAreaInset(edge: .bottom) {
            StickyFooter {
                PrimaryButton(
                    title: step == 5 ? "Start my plan" : editingStep != nil ? "Save answer" : "Next",
                    enabled: step == 5
                        ? model.snapshot.profile.answers.isComplete : model.snapshot.profile.answers.isValid(step: step)
                ) {
                    withAnimation(reduceMotion ? Motion.reduced : Motion.navigation) {
                        goingBack = false
                        if step == 5 {
                            model.completeOnboarding()
                        } else if editingStep != nil {
                            editingStep = nil
                        } else {
                            model.advanceOnboarding()
                        }
                    }
                }
            }
        }
        .animation(reduceMotion ? Motion.reduced : Motion.navigation, value: step)
    }

    private var header: some View {
        VStack(spacing: 10) {
            HStack(spacing: 8) {
                Button {
                    withAnimation(reduceMotion ? Motion.reduced : Motion.navigation) {
                        goingBack = true
                        if editingStep != nil {
                            editingStep = nil
                        } else if step > 0 {
                            model.update { $0.onboardingStep -= 1 }
                        } else {
                            model.update { $0.signedIn = false }
                        }
                    }
                } label: {
                    Image(systemName: "chevron.left").frame(width: 44, height: 44)
                }
                .accessibilityLabel("Back").accessibilityIdentifier("Onboarding back")
                Mascot(size: 28)
                Text("Veylo").font(VeyloStyle.font(22, weight: .heavy))
                Spacer()
                Text(step == 5 ? "REVIEW" : "\(step + 1) / 5").font(VeyloStyle.font(12, weight: .heavy))
                    .accessibilityIdentifier("Onboarding step")
            }
            if step < 5 {
                GeometryReader { geometry in
                    Capsule().fill(VeyloStyle.line)
                    Capsule().fill(VeyloStyle.accent).frame(width: geometry.size.width * Double(step + 1) / 5)
                }.frame(height: 3).accessibilityLabel("Onboarding progress").accessibilityValue("Step \(step + 1) of 5")
            }
        }.padding(.horizontal, 24).padding(.bottom, 16).frame(maxWidth: 560).frame(maxWidth: .infinity)
    }
}

struct SurveyQuestion: View {
    let step: Int
    @Environment(AppModel.self) private var model
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        VStack(alignment: .leading, spacing: 24) {
            switch step {
            case 0:
                ScreenHeading(title: "Where are you starting from?", subtitle: "Your last practice or official score.")
                VStack(spacing: 10) {
                    ForEach(StartingBand.allCases) { band in
                        SelectionCard(
                            title: band.rawValue, selected: model.snapshot.profile.answers.startingBand == band
                        ) {
                            model.update { $0.profile.answers.startingBand = band }
                        }
                    }
                }
                Text("Not sure? We'll find your starting point with practice.").font(VeyloStyle.font(12))
                    .foregroundStyle(VeyloStyle.muted)
            case 1:
                ScreenHeading(title: "What's your target band?", subtitle: "The score you're working towards.")
                BandSelector(selection: binding(\.targetBand))
                if model.snapshot.profile.answers.startingBand == .confident && model.target <= 7 {
                    Text("You're close. A focused plan can help you work on the gap.").font(VeyloStyle.font(14)).panel(
                        Skill.listening.surface)
                }
                Mascot(size: 100).frame(maxWidth: .infinity).padding(.top, 24)
                Text("A goal gives your practice direction. You can change it any time.").font(VeyloStyle.font(15))
                    .foregroundStyle(VeyloStyle.muted)
            case 2:
                ScreenHeading(title: "When's your exam?", subtitle: "We'll shape your plan around your timeline.")
                ExamDateEditor(selection: binding(\.examPlan))
            case 3:
                ScreenHeading(
                    title: "Which part worries you most?",
                    subtitle: "Choose one or two. We'll give them extra attention.")
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                    ForEach(Skill.allCases) { skill in
                        focusCard(skill)
                    }
                }.animation(
                    reduceMotion ? Motion.reduced : Motion.selection, value: model.snapshot.profile.answers.focus)
                Text("\(model.snapshot.profile.answers.focus.count) of 2 selected")
                    .font(VeyloStyle.font(13)).foregroundStyle(VeyloStyle.muted).accessibilityIdentifier("Focus count")
            default:
                ScreenHeading(
                    title: "What's holding you back?", subtitle: "Tell us what makes studying difficult for you.")
                VStack(spacing: 10) {
                    ForEach(StudyBarrier.allCases) { barrier in
                        SelectionCard(
                            title: barrier.rawValue, selected: model.snapshot.profile.answers.barrier == barrier
                        ) {
                            model.update { $0.profile.answers.barrier = barrier }
                        }
                    }
                }
            }
        }.frame(maxWidth: .infinity, alignment: .leading)
    }

    private func binding<Value>(_ keyPath: WritableKeyPath<OnboardingAnswers, Value>) -> Binding<Value> {
        Binding(
            get: { model.snapshot.profile.answers[keyPath: keyPath] },
            set: { value in model.update { $0.profile.answers[keyPath: keyPath] = value } })
    }

    private func focusCard(_ skill: Skill) -> some View {
        let selected = model.snapshot.profile.answers.focus.contains(skill)
        let disabled = !selected && model.snapshot.profile.answers.focus.count == 2
        return Button {
            model.update { $0.profile.answers.toggleFocus(skill) }
        } label: {
            VStack(alignment: .leading, spacing: 18) {
                HStack {
                    SkillBadge(skill: skill)
                    Spacer()
                    if selected { Image(systemName: "checkmark.circle.fill").foregroundStyle(skill.accent) }
                }
                Text(skill.rawValue).font(VeyloStyle.font(17, weight: .heavy)).foregroundStyle(skill.ink)
            }
            .frame(maxWidth: .infinity, alignment: .leading).padding(18)
            .background(skill.surface, in: RoundedRectangle(cornerRadius: 20))
            .overlay(RoundedRectangle(cornerRadius: 20).stroke(selected ? skill.accent : .clear, lineWidth: 1.5))
            .opacity(disabled ? 0.5 : 1)
        }.buttonStyle(PressStyle()).disabled(disabled)
            .accessibilityIdentifier("focus-\(skill.rawValue)").accessibilityAddTraits(selected ? .isSelected : [])
    }
}

struct ExamDateEditor: View {
    @Binding var selection: ExamPlan
    @State private var date = Calendar.current.date(byAdding: .month, value: 6, to: Date()) ?? Date()

    var body: some View {
        VStack(spacing: 16) {
            SelectionCard(title: "Choose an exam date", selected: isScheduled) { selection = .scheduled(date) }
            if selection != .notBooked {
                DatePicker(
                    "Exam date", selection: $date, in: Calendar.current.startOfDay(for: Date())...,
                    displayedComponents: .date
                )
                .datePickerStyle(.wheel).labelsHidden().frame(maxWidth: .infinity).clipped()
                .accessibilityIdentifier("Exam date picker")
                .onChange(of: date) { _, value in selection = .scheduled(value) }
            }
            SelectionCard(title: "Haven't booked yet", selected: selection == .notBooked) { selection = .notBooked }
            Text(
                selection == .notBooked
                    ? "That's okay. Build a steady habit first and add a date when you're ready."
                    : "You can adjust this later in your profile."
            )
            .font(VeyloStyle.font(14)).foregroundStyle(VeyloStyle.muted).frame(maxWidth: .infinity, alignment: .leading)
        }
        .onAppear {
            if case .scheduled(let selectedDate) = selection {
                date = max(selectedDate, Calendar.current.startOfDay(for: Date()))
            }
        }
    }

    private var isScheduled: Bool { if case .scheduled = selection { true } else { false } }
}

struct OnboardingReview: View {
    var edit: (Int) -> Void
    @Environment(AppModel.self) private var model

    var body: some View {
        PageScroll {
            ScreenHeading(title: "Make it yours.", subtitle: "Here's the plan shaped by your answers.")
            VStack(spacing: 0) {
                reviewRow(
                    "Starting point", value: model.snapshot.profile.answers.startingBand?.rawValue ?? "Not sure yet",
                    step: 0)
                reviewRow("Target band", value: model.target.formatted(.number.precision(.fractionLength(1))), step: 1)
                reviewRow("Exam date", value: model.snapshot.profile.answers.examPlan.displayValue, step: 2)
                reviewRow(
                    "Main barrier", value: model.snapshot.profile.answers.barrier?.rawValue ?? "Prefer not to say",
                    step: 4)
            }.padding(6).background(.white, in: RoundedRectangle(cornerRadius: 22))
                .overlay(RoundedRectangle(cornerRadius: 22).stroke(VeyloStyle.line))
            Button {
                edit(3)
            } label: {
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        Text("Your focus").font(VeyloStyle.font(13))
                        Spacer()
                        Image(systemName: "pencil")
                    }
                    HStack {
                        ForEach(model.snapshot.profile.answers.focus) { skill in
                            Label(skill.rawValue, systemImage: skill.symbol).font(VeyloStyle.font(13, weight: .bold))
                                .foregroundStyle(skill.ink).padding(10).frame(maxWidth: .infinity)
                                .background(skill.surface, in: RoundedRectangle(cornerRadius: 10))
                        }
                    }
                }.panel(.white)
            }.buttonStyle(PressStyle()).accessibilityIdentifier("Edit focus")
            VStack(alignment: .leading, spacing: 8) {
                Text(
                    model.snapshot.profile.answers.barrier == .anxiety
                        ? "Confidence, one step at a time." : "A little progress, every day."
                ).font(VeyloStyle.font(18, weight: .heavy))
                Text(
                    model.snapshot.profile.answers.barrier == .time
                        ? "Start with 10-minute sessions, with extra practice for your chosen skills."
                        : "Your first practice will help us understand your starting point and build your routine."
                )
                .font(VeyloStyle.font(14)).foregroundStyle(VeyloStyle.muted)
            }.panel(VeyloStyle.panel)
        }
    }

    private func reviewRow(_ title: String, value: String, step: Int) -> some View {
        Button {
            edit(step)
        } label: {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(title).font(VeyloStyle.font(12)).foregroundStyle(VeyloStyle.muted)
                    Text(value).font(VeyloStyle.font(15, weight: .bold)).multilineTextAlignment(.leading)
                }
                Spacer()
                Image(systemName: "pencil").foregroundStyle(VeyloStyle.violet)
            }.padding(14).frame(maxWidth: .infinity, alignment: .leading).contentShape(Rectangle())
        }.buttonStyle(PressStyle()).accessibilityIdentifier("Edit \(title)")
    }
}

extension ExamPlan {
    var displayValue: String {
        switch self {
        case .unanswered, .notBooked: "Not booked yet"
        case .scheduled(let date): date.formatted(.dateTime.day().month(.wide).year())
        }
    }
}
