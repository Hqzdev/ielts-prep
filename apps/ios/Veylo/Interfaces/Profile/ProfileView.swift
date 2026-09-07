import SwiftUI

struct ProfileView: View {
    @Environment(AppModel.self) private var model
    @Environment(AppRouter.self) private var router
    @State private var confirmSignOut = false

    var body: some View {
        PageScroll {
            BrandHeader()
            ScreenHeading(title: "Your space", subtitle: "Goals, preferences, and a little you.")
            Button {
                router.sheet = .profile
            } label: {
                HStack(spacing: 16) {
                    Mascot(size: 64)
                    VStack(alignment: .leading, spacing: 5) {
                        Text(model.name).font(VeyloStyle.font(24, weight: .heavy))
                        Text(model.snapshot.profile.email).font(VeyloStyle.font(13)).foregroundStyle(VeyloStyle.muted)
                        Text("Target \(model.target.formatted(.number.precision(.fractionLength(1)))) · Demo account")
                            .font(VeyloStyle.font(12))
                    }
                    Spacer(minLength: 0)
                }.panel(Skill.listening.surface)
            }.buttonStyle(PressStyle()).accessibilityIdentifier("Edit profile").reveal()
            VStack(spacing: 8) {
                ActionRow(
                    title: "Study goal",
                    subtitle: "Band \(model.target.formatted(.number.precision(.fractionLength(1)))) · 10 min per day",
                    symbol: "scope"
                ) { router.sheet = .goal }
                ActionRow(
                    title: "Exam date", subtitle: model.snapshot.profile.answers.examPlan.displayValue,
                    symbol: "calendar"
                ) { router.sheet = .exam }
                ActionRow(
                    title: "Vocabulary", subtitle: "\(model.content.vocabulary.count) saved words",
                    symbol: "character.book.closed"
                ) { router.path.append(.vocabulary) }
                ActionRow(
                    title: "Notifications",
                    subtitle: model.snapshot.profile.dailyReminder
                        ? "Daily reminder at \(model.snapshot.profile.reminderHour):00" : "Reminders off",
                    symbol: "bell"
                ) { router.sheet = .notifications }
            }.reveal(delay: 0.05)
            VStack(spacing: 8) {
                ActionRow(title: "Help & support", subtitle: "We're here for you", symbol: "questionmark.circle") {
                    router.sheet = .help
                }
                ActionRow(title: "Privacy & account", subtitle: "Manage your data", symbol: "lock.shield") {
                    router.sheet = .privacy
                }
            }.reveal(delay: 0.1)
            Button("Sign out", role: .destructive) { confirmSignOut = true }
                .font(VeyloStyle.font(14, weight: .bold)).frame(maxWidth: .infinity, minHeight: 44).tint(
                    Skill.writing.accent)
            Text("Veylo · Interactive preview 1.0").font(VeyloStyle.font(11)).foregroundStyle(VeyloStyle.muted).frame(
                maxWidth: .infinity)
        }
        .confirmationDialog("Sign out of the demo?", isPresented: $confirmSignOut, titleVisibility: .visible) {
            Button("Sign out", role: .destructive) { model.update { $0.signedIn = false } }
            Button("Cancel", role: .cancel) { confirmSignOut = false }
        } message: {
            Text("Your local answers and drafts will stay on this device.")
        }
    }
}

struct ProfileSheet: View {
    let kind: AppSheet
    @Environment(AppModel.self) private var model
    @Environment(AppRouter.self) private var router
    @Environment(\.dismiss) private var dismiss
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var name = ""
    @State private var target: Double?
    @State private var exam: ExamPlan = .unanswered
    @State private var resetConfirmation = false
    @State private var helpSelection: String?

    var body: some View {
        NavigationStack {
            PageScroll {
                switch kind {
                case .profile:
                    ScreenHeading(title: "A little more you", subtitle: "Your local demo profile.")
                    Mascot(size: 96).frame(maxWidth: .infinity)
                    LabeledInput(label: "Name", placeholder: "Your name", symbol: "person", text: $name)
                    Text(model.snapshot.profile.email).font(VeyloStyle.font(15)).foregroundStyle(VeyloStyle.muted)
                    PrimaryButton(
                        title: "Save profile", symbol: "checkmark",
                        enabled: !name.trimmingCharacters(in: .whitespaces).isEmpty
                    ) {
                        model.update { $0.profile.name = name.trimmingCharacters(in: .whitespaces) }
                        dismiss()
                    }
                case .goal:
                    ScreenHeading(title: "A goal to grow towards", subtitle: "You can adjust your target as you learn.")
                    BandSelector(selection: $target)
                    PrimaryButton(title: "Save goal", symbol: "checkmark", enabled: target != nil) {
                        model.update { $0.profile.answers.targetBand = target }
                        dismiss()
                    }
                case .exam:
                    ScreenHeading(title: "When's your exam?", subtitle: "Keep your plan in step with your timeline.")
                    ExamDateEditor(selection: $exam)
                    PrimaryButton(title: "Save date", symbol: "checkmark", enabled: exam != .unanswered) {
                        model.update { $0.profile.answers.examPlan = exam }
                        dismiss()
                    }
                case .notifications:
                    ScreenHeading(title: "Your rhythm", subtitle: "Choose what a helpful reminder looks like.")
                    Toggle(
                        "Daily study reminder",
                        isOn: Binding(
                            get: { model.snapshot.profile.dailyReminder },
                            set: { value in model.update { $0.profile.dailyReminder = value } })
                    )
                    .tint(VeyloStyle.accent).panel(.white)
                    if model.snapshot.profile.dailyReminder {
                        Picker(
                            "Reminder time",
                            selection: Binding(
                                get: { model.snapshot.profile.reminderHour },
                                set: { value in model.update { $0.profile.reminderHour = value } })
                        ) {
                            ForEach(6...22, id: \.self) { Text("\($0):00").tag($0) }
                        }.pickerStyle(.wheel).frame(height: 170)
                    }
                    Toggle(
                        "Sound effects",
                        isOn: Binding(
                            get: { model.snapshot.profile.soundEffects },
                            set: { value in model.update { $0.profile.soundEffects = value } })
                    ).tint(VeyloStyle.accent)
                    Text(
                        "These preferences are saved locally. This preview does not schedule notifications or play sounds."
                    ).font(VeyloStyle.font(14)).foregroundStyle(VeyloStyle.muted)
                case .help:
                    ScreenHeading(title: "A little help", subtitle: "Get comfortable with your practice space.")
                    ForEach(
                        ["How does this demo work?", "How do I practise IELTS?", "Where are my answers saved?"],
                        id: \.self
                    ) { question in
                        Button {
                            withAnimation(reduceMotion ? Motion.reduced : Motion.selection) {
                                helpSelection = helpSelection == question ? nil : question
                            }
                        } label: {
                            HStack {
                                Text(question).font(VeyloStyle.font(16, weight: .bold))
                                Spacer()
                                Image(systemName: helpSelection == question ? "minus" : "plus")
                            }.panel(.white)
                        }.buttonStyle(PressStyle())
                        if helpSelection == question {
                            Text(helpAnswer(question)).font(VeyloStyle.font(15)).foregroundStyle(VeyloStyle.muted)
                        }
                    }
                case .privacy:
                    ScreenHeading(title: "Your data stays here", subtitle: "Privacy in this interactive preview.")
                    Text(
                        "Your profile choices, practice answers and drafts are stored only on this device. The app does not contact a server, record your microphone, create a real account or send analytics.\n\nDemo scores, AI replies and forecasts are examples. They do not assess your work."
                    )
                    .font(VeyloStyle.font(16)).lineSpacing(5)
                    Button("Reset all demo data", role: .destructive) { resetConfirmation = true }.frame(minHeight: 44)
                case .fullExam:
                    ScreenHeading(
                        title: "Your full IELTS rehearsal", subtitle: "Four skills. One connected practice journey.")
                    ForEach([Skill.listening, .reading, .writing, .speaking]) { skill in
                        Label(skill.rawValue, systemImage: skill.symbol).font(VeyloStyle.font(18, weight: .bold)).panel(
                            skill.surface
                        ).foregroundStyle(skill.ink)
                    }
                    Text(
                        "The real format takes about 2 hr 45 min. This preview uses short sample tasks; you can finish each section at any time."
                    ).font(VeyloStyle.font(14)).foregroundStyle(VeyloStyle.muted)
                    PrimaryButton(title: "Start full demo exam", symbol: "play") {
                        let id = model.startPractice(.listening, number: 1, fullExam: true, restart: true)
                        dismiss()
                        router.path.append(.practice(id))
                    }
                case .dailyPlan:
                    ScreenHeading(title: "Your plan for today", subtitle: "One small task at a time.")
                    ForEach(Skill.allCases) { skill in
                        ActionRow(
                            title: "\(skill.rawValue) practice",
                            subtitle: model.snapshot.completedTasks.contains("\(skill.rawValue.lowercased())-8")
                                ? "Completed · practise again" : "5 min · Focus practice", symbol: skill.symbol,
                            color: skill.accent, surface: skill.surface
                        ) {
                            let id = model.startPractice(skill)
                            dismiss()
                            router.path.append(.practice(id))
                        }
                    }
                    ActionRow(
                        title: "Vocabulary review", subtitle: "Keep your new words close",
                        symbol: "character.book.closed"
                    ) {
                        dismiss()
                        router.path.append(.vocabulary)
                    }
                case .conversations:
                    ScreenHeading(title: "Pick up the thread", subtitle: "Your local conversations with Vey.")
                    if model.snapshot.messages.isEmpty {
                        ContentUnavailableView(
                            "Your first conversation awaits", systemImage: "bubble.left",
                            description: Text("Choose an IELTS task and explore a sample coaching reply."))
                    } else {
                        Text(model.snapshot.messages.last?.text ?? "").font(VeyloStyle.font(14)).lineLimit(6).panel(
                            Skill.listening.surface)
                    }
                    PrimaryButton(
                        title: model.snapshot.messages.isEmpty ? "Start a conversation" : "Continue conversation"
                    ) {
                        dismiss()
                        router.path.append(.chat)
                    }
                }
            }
            .navigationTitle(title).navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .confirmationAction) { Button("Done") { dismiss() } } }
        }
        .onAppear {
            name = model.name
            target = model.target
            exam = model.snapshot.profile.answers.examPlan
        }
        .confirmationDialog("Delete local demo data?", isPresented: $resetConfirmation, titleVisibility: .visible) {
            Button("Reset demo", role: .destructive) {
                model.update { $0 = DemoSnapshot() }
                dismiss()
            }
            Button("Cancel", role: .cancel) { resetConfirmation = false }
        } message: {
            Text("This clears this preview's profile, drafts, answers and game scores on this device.")
        }
    }

    private var title: String {
        switch kind {
        case .profile: "Profile"
        case .goal: "Study goal"
        case .exam: "Exam date"
        case .notifications: "Notifications"
        case .help: "Help & support"
        case .privacy: "Privacy & account"
        case .fullExam: "Full mock exam"
        case .conversations: "Recent conversations"
        case .dailyPlan: "Today's plan"
        }
    }
    private func helpAnswer(_ question: String) -> String {
        if question.contains("demo") {
            return
                "Everything is local and interactive. Choose a practice task, answer it and explore a sample result. Use Google on the sign-in screen to enter the returning learner demo, or register to try onboarding."
        }
        if question.contains("saved") {
            return
                "Answers, your writing draft and onboarding choices are saved on this device. You can reset them under Privacy & account. Passwords and microphone recordings are never saved."
        }
        return
            "Open Tests, choose Reading, Listening, Writing or Speaking, and start a sample exercise. Vey AI offers task-specific prompts, while Vocabulary and Arcade give you short practice rounds."
    }
}
