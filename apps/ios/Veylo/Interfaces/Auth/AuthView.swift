import SwiftUI

enum AuthPage: Hashable {
    case register, reset
}

struct AuthView: View {
    @Environment(AppModel.self) private var model
    @State private var path: [AuthPage] = []

    var body: some View {
        NavigationStack(path: $path) {
            AuthForm(page: nil, open: { path.append($0) })
                .navigationDestination(for: AuthPage.self) { page in AuthForm(page: page, open: { path.append($0) }) }
        }
    }
}

struct AuthForm: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    var page: AuthPage?
    var open: (AuthPage) -> Void
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss
    @State private var name = ""
    @State private var email = ""
    @State private var password = ""
    @State private var resetSent = false
    @FocusState private var focused: Bool

    private var validEmail: Bool {
        let parts = email.trimmingCharacters(in: .whitespaces).split(separator: "@")
        return parts.count == 2 && parts[1].contains(".")
    }
    private var valid: Bool {
        validEmail && (page == .reset || password.count >= 8)
            && (page != .register || !name.trimmingCharacters(in: .whitespaces).isEmpty)
    }

    var body: some View {
        PageScroll {
            BrandHeader()
            VStack(spacing: 12) {
                Mascot(size: page == .register ? 96 : 116).reveal()
                Text(
                    page == .register
                        ? "A little practice.\nA brighter future."
                        : page == .reset ? "Let's get you back in." : "Welcome back"
                )
                .font(VeyloStyle.font(30, weight: .heavy)).multilineTextAlignment(.center)
                Text(
                    page == .register
                        ? "Create your account. Make progress your own."
                        : page == .reset
                            ? "Enter your email to preview password recovery." : "A little practice. A big difference."
                )
                .font(VeyloStyle.font(15)).foregroundStyle(VeyloStyle.muted).multilineTextAlignment(.center)
            }.frame(maxWidth: .infinity).padding(.top, 8).reveal()

            if resetSent {
                VStack(alignment: .leading, spacing: 12) {
                    Label("Recovery preview", systemImage: "envelope.badge").font(VeyloStyle.font(20, weight: .heavy))
                    Text(
                        "This is a local demo. No email was sent to \(email). Email recovery will be connected with your account later."
                    )
                    PrimaryButton(title: "Back to sign in") { dismiss() }
                }.panel(Skill.listening.surface).reveal()
            } else {
                VStack(spacing: 16) {
                    if page == .register {
                        LabeledInput(label: "Name", placeholder: "Your name", symbol: "person", text: $name)
                    }
                    LabeledInput(label: "Email", placeholder: "you@example.com", symbol: "envelope", text: $email)
                    if page != .reset {
                        LabeledInput(
                            label: "Password", placeholder: "At least 8 characters", symbol: "lock", text: $password,
                            secure: true)
                    }
                    if page == nil {
                        Button("Forgot password?") { open(.reset) }
                            .font(VeyloStyle.font(13, weight: .bold)).frame(
                                maxWidth: .infinity, minHeight: 44, alignment: .trailing)
                    }
                    PrimaryButton(
                        title: page == .register ? "Create account" : page == .reset ? "Send reset link" : "Sign in",
                        enabled: valid
                    ) { submit() }
                    if page != .reset {
                        Text("or").font(VeyloStyle.font(13)).foregroundStyle(VeyloStyle.muted)
                        Button {
                            focused = false
                            if page == .register {
                                model.register(name: "Yaroslav", email: "yaroslav@example.com")
                            } else {
                                model.signIn(email: "yaroslav@example.com")
                            }
                        } label: {
                            HStack(spacing: 12) {
                                Image("Google").resizable().scaledToFit().frame(width: 21, height: 21)
                                Text("Continue with Google").font(VeyloStyle.font(16, weight: .bold))
                            }.frame(maxWidth: .infinity, minHeight: 54).veyloGlass()
                        }.buttonStyle(PressStyle()).accessibilityIdentifier("Continue with Google")
                    }
                }.focused($focused).reveal(delay: 0.08)
            }
            VStack(spacing: 4) {
                if page == nil {
                    Button("New to Veylo?  Create an account") { open(.register) }
                        .accessibilityIdentifier("Create an account")
                } else if page == .register {
                    Button("Already have an account?  Sign in") { dismiss() }
                }
                Text("Interactive demo · no real account required")
                    .font(VeyloStyle.font(11)).foregroundStyle(VeyloStyle.muted).padding(.top, 4)
            }.font(VeyloStyle.font(14, weight: .bold)).frame(maxWidth: .infinity, minHeight: 44)
        }
        .toolbarBackground(VeyloStyle.paper, for: .navigationBar)
        .toolbar(page == nil ? .hidden : .visible, for: .navigationBar)
        .navigationBarTitleDisplayMode(.inline)
    }

    private func submit() {
        focused = false
        if page == .reset {
            withAnimation(reduceMotion ? Motion.reduced : Motion.navigation) { resetSent = true }
        } else if page == .register {
            model.register(name: name, email: email.trimmingCharacters(in: .whitespaces))
        } else {
            model.signIn(email: email.trimmingCharacters(in: .whitespaces))
        }
        password = ""
    }
}
