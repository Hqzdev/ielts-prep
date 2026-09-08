import Foundation

struct NativeConfiguration: Decodable {
    var apiURL: URL
    var supabaseURL: URL
    var publishableKey: String
    enum CodingKeys: String, CodingKey { case apiURL, supabaseURL, publishableKey }
    init(from decoder: Decoder) throws {
        let values = try decoder.container(keyedBy: CodingKeys.self)
        guard let api = URL(string: try values.decode(String.self, forKey: .apiURL)),
            let auth = URL(string: try values.decode(String.self, forKey: .supabaseURL))
        else {
            throw NativeFailure(code: "CONFIGURATION", message: "The server URLs are invalid.")
        }
        apiURL = api
        supabaseURL = auth
        publishableKey = try values.decode(String.self, forKey: .publishableKey)
    }
    static func load() throws -> NativeConfiguration {
        guard let url = Bundle.main.url(forResource: "BackendConfiguration", withExtension: "plist") else {
            throw NativeFailure(
                code: "CONFIGURATION",
                message: "This build has no server configuration. Add BackendConfiguration.plist and rebuild.")
        }
        let configuration = try PropertyListDecoder().decode(Self.self, from: Data(contentsOf: url))
        let urls = [configuration.apiURL, configuration.supabaseURL]
        #if DEBUG
            let valid = urls.allSatisfy {
                $0.scheme == "https" || ($0.scheme == "http" && ["localhost", "127.0.0.1"].contains($0.host ?? ""))
            }
        #else
            let valid = urls.allSatisfy { $0.scheme == "https" }
        #endif
        guard valid, !configuration.publishableKey.isEmpty else {
            throw NativeFailure(code: "CONFIGURATION", message: "The server configuration is invalid.")
        }
        return configuration
    }
}
