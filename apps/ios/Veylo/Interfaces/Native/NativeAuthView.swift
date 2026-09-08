import SwiftUI

struct NativeAuthView: View {
    @Environment(NativeAppModel.self) private var model
    @State private var registering = false
    @State private var reset = false
    @State private var name = ""
    @State private var email = ""
    @State private var password = ""

    var body: some View {
        PageScroll {
            BrandHeader()
            Mascot(size: 140).frame(maxWidth: .infinity).padding(.top, 30)
            ScreenHeading(
                title: registering ? "Your next chapter" : "Welcome back",
                subtitle: "Build confidence, one practice at a time.")
            if registering { LabeledInput(label: "Name", placeholder: "Your name", symbol: "person", text: $name) }
            LabeledInput(label: "Email", placeholder: "you@example.com", symbol: "envelope", text: $email)
            LabeledInput(label: "Password", placeholder: "Your password", symbol: "lock", text: $password, secure: true)
            NativeBusyButton(
                title: registering ? "Create account" : "Sign in",
                enabled: email.contains("@") && password.count >= (registering ? 8 : 1)
                    && (!registering || !name.trimmingCharacters(in: .whitespaces).isEmpty)
            ) {
                let submittedPassword = password
                defer { password = "" }
                if registering {
                    let authenticated = try await model.identity.register(
                        name: name, email: email, password: submittedPassword)
                    if authenticated {
                        try await model.refresh()
                    } else {
                        model.notice = "Check your email to verify your account, then return here to sign in."
                    }
                } else {
                    try await model.identity.signIn(email: email, password: submittedPassword)
                    try await model.refresh()
                }
            }
            NativeBusyButton(title: "Continue with Google") {
                try await model.identity.google()
                try await model.refresh()
            }
            Button(registering ? "Already have an account? Sign in" : "New here? Create account") {
                registering.toggle()
                password = ""
            }
            Button("Forgot password?") { reset = true }
        }.sheet(isPresented: $reset) {
            NavigationStack {
                PageScroll {
                    ScreenHeading(
                        title: "Reset your password", subtitle: "We'll email you a link to choose a new password.")
                    LabeledInput(label: "Email", placeholder: "you@example.com", symbol: "envelope", text: $email)
                    NativeBusyButton(title: "Send reset link", enabled: email.contains("@")) {
                        try await model.identity.reset(email: email)
                        reset = false
                        model.notice = "If this account exists, a reset link is on its way."
                    }
                }.toolbar { ToolbarItem(placement: .topBarTrailing) { Button("Done") { reset = false } } }
            }.presentationDetents([.medium, .large])
        }
    }
}

struct NativePasswordView: View {
    @Environment(NativeAppModel.self) private var model
    @State private var password = ""
    var body: some View {
        PageScroll {
            BrandHeader()
            ScreenHeading(title: "Choose a new password", subtitle: "Use at least 8 characters.")
            LabeledInput(label: "Password", placeholder: "New password", symbol: "lock", text: $password, secure: true)
            NativeBusyButton(title: "Save password", enabled: password.count >= 8) {
                defer { password = "" }
                try await model.identity.changePassword(password)
                model.recovery = false
                try await model.refresh()
            }
        }
    }
}
