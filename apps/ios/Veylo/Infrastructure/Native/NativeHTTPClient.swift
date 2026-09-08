import Foundation
import OSLog
import VeyloAPI

@MainActor
final class NativeHTTPClient: NativeRemote {
    private let identity: SupabaseIdentity
    private let base: URL
    private let session: URLSession

    init(configuration: NativeConfiguration, identity: SupabaseIdentity) {
        self.identity = identity
        base = configuration.apiURL
        let options = URLSessionConfiguration.ephemeral
        options.timeoutIntervalForRequest = 100
        options.timeoutIntervalForResource = 180
        session = URLSession(configuration: options)
    }

    func bootstrap() async throws -> NativeBootstrap {
        try await get("bootstrap", as: NativeBootstrap.self)
    }

    private func generated<T: Decodable>(_ path: String, method: String, body: Data?, as type: T.Type) async throws -> T
    {
        let options = URLSessionConfiguration.ephemeral
        options.timeoutIntervalForRequest = 120
        options.timeoutIntervalForResource = 180
        options.httpAdditionalHeaders = [
            "Authorization": "Bearer " + (try await identity.client.auth.session.accessToken)
        ]
        let generatedSession = URLSession(configuration: options)
        defer { generatedSession.finishTasksAndInvalidate() }
        let client = Client(
            serverURL: base, transport: URLSessionTransport(configuration: .init(session: generatedSession)))
        do {
            let data = try await NativeGeneratedAPI.call(client: client, method: method, path: path, body: body)
            return try JSONDecoder().decode(type, from: data)
        } catch let failure as NativeFailure { throw failure } catch is CancellationError {
            throw CancellationError()
        } catch let failure as ClientError {
            if let network = failure.underlyingError as? URLError { throw network }
            Logger(subsystem: "app.veylo", category: "network").error(
                "API response mismatch in \(failure.operationID, privacy: .public)")
            throw NativeFailure(
                code: "RESPONSE_CONTRACT",
                message: "Veylo could not read this server response. Please try again or update the app.")
        } catch is DecodingError {
            throw NativeFailure(
                code: "RESPONSE_CONTRACT",
                message: "Veylo could not read this server response. Please try again or update the app.")
        }
    }

    func get<T: Decodable>(_ path: String, as type: T.Type) async throws -> T {
        try await generated(path, method: "GET", body: nil, as: type)
    }

    func send<T: Decodable, Body: Encodable>(_ path: String, method: String = "POST", body: Body, as type: T.Type)
        async throws -> T
    {
        try await generated(path, method: method, body: JSONEncoder().encode(body), as: type)
    }

    private func request(_ path: String, method: String, data: Data?) async throws -> URLRequest {
        guard let url = URL(string: "ios/" + path, relativeTo: base.appendingPathComponent(""))?.absoluteURL,
            url.host == base.host
        else { throw NativeFailure(code: "INVALID_URL", message: "Invalid request.") }
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.httpBody = data
        request.setValue(
            "Bearer " + (try await identity.client.auth.session.accessToken), forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        return request
    }

    private func validate(_ response: URLResponse, data: Data) throws {
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            struct Envelope: Decodable {
                struct Detail: Decodable {
                    var code: String
                    var message: String
                }
                var error: Detail
            }
            if let failure = try? JSONDecoder().decode(Envelope.self, from: data) {
                throw NativeFailure(code: failure.error.code, message: failure.error.message)
            }
            throw NativeFailure(code: "NETWORK", message: "The server could not complete this request.")
        }
    }

    func chat(_ path: String, body: NativeChatRequest, receive: @escaping @MainActor (NativeChatEvent) -> Void)
        async throws
    {
        let request = try await request(path, method: "POST", data: JSONEncoder().encode(body))
        let (bytes, response) = try await session.bytes(for: request)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            var data = Data()
            for try await byte in bytes {
                data.append(byte)
                if data.count >= 10000 { break }
            }
            try validate(response, data: data)
            return
        }
        var completed = false
        for try await line in bytes.lines {
            try Task.checkCancellation()
            guard !line.isEmpty else { continue }
            let event = try JSONDecoder().decode(NativeChatEvent.self, from: Data(line.utf8))
            receive(event)
            if event.type == "done" { completed = true }
        }
        if !completed {
            throw NativeFailure(
                code: "INTERRUPTED", message: "The reply was interrupted. You can retry it from history.")
        }
    }

    func upload(_ data: Data, path: String, token: String) async throws {
        try await identity.client.storage.from("speaking").uploadToSignedURL(
            path, token: token, data: data,
            options: .init(contentType: "audio/wav"))
    }
}
