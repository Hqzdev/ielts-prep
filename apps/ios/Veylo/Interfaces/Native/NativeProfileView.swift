import SwiftUI

struct NativeProfileView: View {
    @Environment(NativeAppModel.self) private var model
    @State private var profile: NativeProfile?
    @State private var preferences: NativePreferences?
    @State private var goals = false
    @State private var delete = false
    @State private var confirmation = ""

    var body: some View {
        PageScroll {
            BrandHeader()
            if let profile {
                HStack(spacing: 16) {
                    Mascot(size: 72)
                    VStack(alignment: .leading, spacing: 4) {
                        Text(profile.name).font(VeyloStyle.font(26, weight: .heavy))
                        Text(profile.email).font(VeyloStyle.font(13))
                        Text("Target \(String(format: "%.1f", profile.targetBand))").font(
                            VeyloStyle.font(14, weight: .bold))
                    }
                }.panel(VeyloStyle.lavender)
                ScreenHeading(title: "Profile", subtitle: "A study plan that fits your life.")
                TextField("Name", text: Binding(get: { self.profile?.name ?? "" }, set: { self.profile?.name = $0 }))
                    .textFieldStyle(.roundedBorder)
                Stepper(
                    "Daily study · \(self.profile?.dailyMinutes ?? 10) min",
                    value: Binding(
                        get: { self.profile?.dailyMinutes ?? 10 }, set: { self.profile?.dailyMinutes = $0 }),
                    in: 10...180, step: 10)
                NativeBusyButton(
                    title: "Save profile",
                    enabled: !(self.profile?.name.trimmingCharacters(in: .whitespaces).isEmpty ?? true)
                ) {
                    guard var updated = self.profile else { return }
                    updated.timezone = TimeZone.current.identifier
                    let result = try await model.saveProfile(updated)
                    self.profile = result
                    model.notice = "Your profile is saved."
                }
                ActionRow(title: "Your goal and focus", subtitle: "Change your onboarding answers", symbol: "target") {
                    goals = true
                }
                NavigationLink(value: NativeRoute.vocabulary) { Label("Your vocabulary", systemImage: "book").panel() }
                if preferences != nil {
                    Text("Preferences").font(VeyloStyle.font(22, weight: .heavy))
                    Toggle(
                        "Daily reminder",
                        isOn: Binding(
                            get: { preferences?.dailyReminder ?? false }, set: { preferences?.dailyReminder = $0 }))
                    Stepper(
                        "Reminder time · \(preferences?.reminderHour ?? 18):00",
                        value: Binding(
                            get: { preferences?.reminderHour ?? 18 }, set: { preferences?.reminderHour = $0 }),
                        in: 0...23)
                    Toggle(
                        "Reminder sound",
                        isOn: Binding(
                            get: { preferences?.soundEffects ?? true }, set: { preferences?.soundEffects = $0 }))
                    NativeBusyButton(title: "Save preferences") {
                        guard let preferences else { return }
                        try await model.reminders.update(
                            preferences, barrier: model.account?.onboarding.answers.barrier)
                        let _: NativeAcknowledgement = try await model.remote.send(
                            "preferences", method: "PATCH", body: preferences, as: NativeAcknowledgement.self)
                        model.account?.onboarding.preferences = preferences
                        model.notice = "Your preferences are saved."
                    }
                }
                ActionRow(title: "About your practice results", symbol: "info.circle") {
                    model.notice =
                        "Veylo provides practice estimates, not official IELTS scores. Reading answers are checked against an answer key. Writing feedback, when enabled, uses AI and can contain errors."
                }
                ActionRow(title: "Your data", symbol: "lock.shield") {
                    model.notice =
                        "Your profile, answers and results are saved to your account. Writing and text chat are sent to GigaChat for feedback when enabled. Recording tests do not send audio to an AI. Deleting your account removes your account data."
                }
                #if DEBUG
                    if model.account?.capabilities.speakingRecording == true {
                        NavigationLink {
                            NativeCatalogView(recordingOnly: true)
                        } label: {
                            Label("Microphone recording lab", systemImage: "mic").panel(Skill.speaking.surface)
                        }
                    }
                #endif
                NativeBusyButton(title: "Sign out") { try await model.signOut() }
                Button("Delete account", role: .destructive) {
                    confirmation = ""
                    delete = true
                }
            }
        }
        .task {
            profile = model.account?.profile
            preferences = model.account?.onboarding.preferences
        }
        .sheet(isPresented: $goals, onDismiss: { profile = model.account?.profile }) {
            if let onboarding = model.account?.onboarding {
                NavigationStack {
                    NativeSurveyView(initial: onboarding, reviewing: true)
                        .toolbar { ToolbarItem(placement: .topBarTrailing) { Button("Cancel") { goals = false } } }
                }
            }
        }
        .sheet(isPresented: $delete) {
            NavigationStack {
                PageScroll {
                    ScreenHeading(
                        title: "Delete your account?",
                        subtitle:
                            "This permanently removes your profile, practice history and saved words. Type DELETE to continue."
                    )
                    TextField("DELETE", text: $confirmation).textInputAutocapitalization(.characters).textFieldStyle(
                        .roundedBorder)
                    NativeBusyButton(title: "Permanently delete account", enabled: confirmation == "DELETE") {
                        struct Request: Encodable { var confirmation = "DELETE" }
                        let _: NativeAcknowledgement = try await model.remote.send(
                            "profile", method: "DELETE", body: Request(), as: NativeAcknowledgement.self)
                        delete = false
                        try await model.signOut()
                    }
                }.toolbar { ToolbarItem(placement: .topBarTrailing) { Button("Cancel") { delete = false } } }
            }.presentationDetents([.medium])
        }
    }
}
