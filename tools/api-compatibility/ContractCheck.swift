import Foundation
import OpenAPIURLSession

struct DesignData: Decodable {
  let version: Int
  let properties: [String: String]
}

struct MotionData: Decodable {
  let version: Int
  let poses: [String: [String: Double]]
}

enum CompatibilityFailure: Error {
  case invalidContract
}

@main struct ContractCheck {
  static func main() throws {
    let client = Client(
      serverURL: URL(string: "http://127.0.0.1:3000/api/v1")!,
      transport: URLSessionTransport()
    )
    let decoder = JSONDecoder()
    let error = try decoder.decode(
      Components.Schemas.ApiError.self,
      from: Data(
        "{\"error\":{\"code\":\"REVISION_CONFLICT\",\"message\":\"Reload\",\"requestId\":\"check\"}}"
          .utf8)
    )
    let design = try decoder.decode(
      DesignData.self, from: Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[1])))
    let motion = try decoder.decode(
      MotionData.self, from: Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[2])))
    let quiz = try decoder.decode(
      Components.Schemas.CreateVocabularyQuizResponse.self,
      from: Data("{\"id\":\"quiz\",\"questions\":[],\"result\":null}".utf8)
    )
    guard error.error.code == "REVISION_CONFLICT",
      quiz.result == nil,
      design.properties["color-aubergine"] == "#3c315b",
      motion.poses["victory"] != nil
    else { throw CompatibilityFailure.invalidContract }
    _ = client
    print("Swift: generated API client compiled; errors, design tokens and motion data decoded.")
  }
}
