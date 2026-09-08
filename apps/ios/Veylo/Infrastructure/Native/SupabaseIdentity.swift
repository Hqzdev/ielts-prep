import Foundation
import VeyloAPI

@MainActor
final class SupabaseIdentity: NativeIdentity {
    let client: SupabaseClient
    private let redirect = URL(string: "veylo://auth/callback")!
    init(configuration: NativeConfiguration) {
        client = SupabaseClient(
            supabaseURL: configuration.supabaseURL, supabaseKey: configuration.publishableKey,
            options: .init(auth: .init(flowType: .pkce, emitLocalSessionAsInitialSession: true)))
    }
    func hasSession() async -> Bool { client.auth.currentSession != nil }
    func signIn(email: String, password: String) async throws {
        try await client.auth.signIn(email: email, password: password)
    }
    func register(name: String, email: String, password: String) async throws -> Bool {
        let response = try await client.auth.signUp(
            email: email, password: password,
            data: ["name": .string(name)], redirectTo: redirect)
        return response.session != nil
    }
    func google() async throws {
        try await client.auth.signInWithOAuth(provider: .google, redirectTo: redirect)
    }
    func reset(email: String) async throws {
        try await client.auth.resetPasswordForEmail(email, redirectTo: URL(string: "veylo://auth/recovery")!)
    }
    func changePassword(_ password: String) async throws {
        try await client.auth.update(user: .init(password: password))
    }
    func callback(_ url: URL) async throws -> Bool {
        guard url.scheme == "veylo", url.host == "auth", ["/callback", "/recovery"].contains(url.path) else {
            throw NativeFailure(code: "INVALID_CALLBACK", message: "This sign-in link is not valid.")
        }
        try await client.auth.session(from: url)
        return url.path == "/recovery"
    }
    func signOut() async throws { try await client.auth.signOut(scope: .local) }
}
