import Foundation

@MainActor
protocol NativeIdentity {
    func hasSession() async -> Bool
    func signIn(email: String, password: String) async throws
    func register(name: String, email: String, password: String) async throws -> Bool
    func google() async throws
    func reset(email: String) async throws
    func changePassword(_ password: String) async throws
    func callback(_ url: URL) async throws -> Bool
    func signOut() async throws
}

@MainActor
protocol NativeRemote {
    func bootstrap() async throws -> NativeBootstrap
    func get<T: Decodable>(_ path: String, as type: T.Type) async throws -> T
    func send<T: Decodable, Body: Encodable>(_ path: String, method: String, body: Body, as type: T.Type) async throws
        -> T
    func chat(_ path: String, body: NativeChatRequest, receive: @escaping @MainActor (NativeChatEvent) -> Void)
        async throws
    func upload(_ data: Data, path: String, token: String) async throws
}

struct NativeChatRequest: Encodable {
    var content: String?
    var threadId: String?
    var attemptId: String?
    var retryAssistantId: String?
    var personality: String
    var explicit = false
}

@MainActor
protocol NativeDraftStorage {
    func load(user: String, attempt: String) throws -> NativeDraft?
    func save(_ draft: NativeDraft, user: String, attempt: String) throws
    func remove(user: String, attempt: String) throws
    func clear(user: String) throws
}

struct NativeDraft: Codable {
    var answer: NativeAnswer
    var revision: Int
}

@MainActor
protocol NativeReminders {
    func update(_ preferences: NativePreferences, barrier: String?) async throws
    func clear()
}
