import SwiftUI

struct NativeSurveyView: View {
    @Environment(NativeAppModel.self) private var model
    @Environment(\.dismiss) private var dismiss
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var answers: NativeAnswers
    @State private var step: Int
    @State private var editing = false
    @State private var backwards = false
    @State private var selectedDate = Date().addingTimeInterval(86400 * 30)
    var initial: NativeOnboarding
    var reviewing = false

    init(initial: NativeOnboarding, reviewing: Bool = false) {
        self.initial = initial
        self.reviewing = reviewing
        _answers = State(initialValue: initial.answers)
        _step = State(initialValue: reviewing ? 5 : initial.step)
    }

    private let titles = [
        "Where are you starting from?", "What's your target band?", "When's your exam?",
        "Which part worries you most?", "What's holding you back?", "Make it yours",
    ]
    private let subtitles = [
        "Your last practice or official score.", "We'll build a plan around your goal.",
        "It's okay if you haven't booked yet.", "Choose one or two skills to focus on.",
        "We'll shape your plan around real life.", "A plan based on your answers. You can change these anytime.",
    ]

    var body: some View {
        PageScroll {
            BrandHeader()
            HStack {
                Button {
                    backwards = true
                    withAnimation(reduceMotion ? Motion.reduced : Motion.navigation) {
                        step = editing ? 5 : max(0, step - 1)
                        editing = false
                    }
                } label: {
                    Image(systemName: "chevron.left").frame(width: 40, height: 40)
                }
                .disabled((step == 0 && !editing) || model.busy).accessibilityLabel("Previous question")
                Spacer()
                Text(step < 5 ? "\(step + 1) of 5" : "Your study plan").font(VeyloStyle.font(13, weight: .bold))
            }
            ProgressView(value: Double(min(step + 1, 5)), total: 5)
                .animation(reduceMotion ? Motion.reduced : Motion.selection, value: step)
            VStack(alignment: .leading, spacing: 22) {
                ScreenHeading(title: titles[step], subtitle: subtitles[step])
                question
            }.id(step)
                .transition(
                    reduceMotion
                        ? .opacity
                        : .asymmetric(
                            insertion: .move(edge: backwards ? .leading : .trailing).combined(with: .opacity),
                            removal: .opacity))
        }
        .safeAreaInset(edge: .bottom) {
            StickyFooter {
                NativeBusyButton(
                    title: step == 5 ? (reviewing ? "Save changes" : "Let's begin") : editing ? "Save answer" : "Next",
                    enabled: answers.valid(step: step)
                ) {
                    let next = step == 5 ? 5 : editing ? 5 : step + 1
                    do { try await model.saveOnboarding(answers, step: next, complete: step == 5) } catch let failure
                        as NativeFailure where failure.code == "REVISION_CONFLICT"
                    {
                        try await model.refresh()
                        model.notice =
                            "Your answers changed on another device. Your selections are still here. Review them and save again."
                        return
                    }
                    if step == 5 {
                        if reviewing { dismiss() }
                        return
                    }
                    try await model.record(
                        event: "onboarding_answer_saved", step: step, entry: editing ? "review" : "forward")
                    backwards = false
                    withAnimation(reduceMotion ? Motion.reduced : Motion.navigation) {
                        step = next
                        editing = false
                    }
                }
            }
        }
        .task(id: step) {
            do {
                try await model.record(
                    event: step == 5 ? "onboarding_review_viewed" : "onboarding_step_viewed",
                    step: step,
                    entry: backwards
                        ? "back" : editing || reviewing ? "review" : initial.step == step ? "resume" : "forward")
            } catch { model.error = error.localizedDescription }
        }
        .task {
            if initial.revision == 0 {
                do { try await model.record(event: "onboarding_started", step: 0, entry: "forward") } catch {
                    model.error = error.localizedDescription
                }
            }
            if let date = answers.examDate.flatMap({ NativeDate.parseDay($0) }) { selectedDate = date }
        }
    }

    @ViewBuilder private var question: some View {
        switch step {
        case 0:
            ForEach(
                Array(
                    zip(
                        ["below_5_5", "5_5_6_0", "6_5_7_0", "7_5_plus", "unknown"],
                        ["Below 5.5", "5.5–6.0", "6.5–7.0", "7.5+", "Not sure yet"])), id: \.0
            ) { value, label in
                SelectionCard(title: label, selected: answers.startingLevel == value) { answers.startingLevel = value }
            }
        case 1:
            BandSelector(selection: $answers.targetBand)
            Text("Your target is a direction. Your results will help us adjust the pace.").font(VeyloStyle.font(14))
                .foregroundStyle(VeyloStyle.muted)
        case 2:
            SelectionCard(title: "Choose an exam date", selected: answers.examStatus == "scheduled") {
                answers.examStatus = "scheduled"
                answers.examDate = NativeDate.day(selectedDate)
            }
            if answers.examStatus == "scheduled" {
                DatePicker("Exam date", selection: $selectedDate, in: Date()..., displayedComponents: .date)
                    .datePickerStyle(.wheel).labelsHidden().frame(maxWidth: .infinity)
                    .onChange(of: selectedDate) { _, date in answers.examDate = NativeDate.day(date) }
            }
            SelectionCard(title: "Haven't booked yet", selected: answers.examStatus == "not_booked") {
                answers.examStatus = "not_booked"
                answers.examDate = nil
            }
        case 3:
            HStack {
                ForEach([Skill.reading, .writing]) { skill in
                    SelectionCard(
                        title: skill.rawValue, selected: answers.focus.contains(skill.rawValue.lowercased()),
                        color: skill.accent, surface: skill.surface
                    ) {
                        let value = skill.rawValue.lowercased()
                        if answers.focus.contains(value) {
                            answers.focus.removeAll { $0 == value }
                        } else if answers.focus.count < 2 {
                            answers.focus.append(value)
                        }
                    }
                }
            }
        case 4:
            ForEach(
                Array(
                    zip(
                        ["time", "direction", "anxiety", "previous_attempt", "other", "private"],
                        [
                            "Not enough time to study", "Don't know where to start", "Anxiety on test day",
                            "Tried before, didn't hit my score", "Other", "Prefer not to say",
                        ])), id: \.0
            ) { value, label in
                SelectionCard(title: label, selected: answers.barrier == value) { answers.barrier = value }
            }
        default:
            Mascot(size: 130).frame(maxWidth: .infinity)
            reviewRow(
                "Starting level", startingLevelLabel,
                index: 0)
            reviewRow(
                "Target band", answers.targetBand.map { String(format: "%.1f", $0) } ?? "Choose a target", index: 1)
            reviewRow("Exam date", answers.examDate ?? "Haven't booked yet", index: 2)
            reviewRow("Focus", answers.focus.map { $0.capitalized }.joined(separator: ", "), index: 3)
            reviewRow("Your plan", "Personalised around your main barrier", index: 4)
            Text(
                "Study time zone · "
                    + (reviewing
                        ? model.account?.profile.timezone ?? TimeZone.current.identifier : TimeZone.current.identifier)
            )
            .font(VeyloStyle.font(12)).foregroundStyle(VeyloStyle.muted)
        }
    }

    private var startingLevelLabel: String {
        switch answers.startingLevel {
        case "below_5_5": "Below 5.5"
        case "5_5_6_0": "5.5–6.0"
        case "6_5_7_0": "6.5–7.0"
        case "7_5_plus": "7.5+"
        default: "Not sure yet"
        }
    }

    private func reviewRow(_ title: String, _ subtitle: String, index: Int) -> some View {
        ActionRow(title: title, subtitle: subtitle, symbol: "pencil") {
            editing = true
            backwards = true
            withAnimation(reduceMotion ? Motion.reduced : Motion.navigation) { step = index }
        }
    }
}

enum NativeDate {
    static func day(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: date)
    }
    static func parseDay(_ value: String) -> Date? {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.date(from: value)
    }
    static func instant(_ value: String?) -> Date? {
        guard let value else { return nil }
        let parser = ISO8601DateFormatter()
        parser.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return parser.date(from: value) ?? ISO8601DateFormatter().date(from: value)
    }
}
