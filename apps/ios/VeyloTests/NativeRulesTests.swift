import XCTest

@testable import Veylo

@MainActor
final class NativeRulesTests: XCTestCase {
    func testIncompleteAnswersEncodeExplicitNullsForTheAPI() throws {
        let data = try JSONEncoder().encode(NativeAnswers())
        let values = try XCTUnwrap(JSONSerialization.jsonObject(with: data) as? [String: Any])
        XCTAssertTrue(values["startingLevel"] is NSNull)
        XCTAssertTrue(values["targetBand"] is NSNull)
        XCTAssertTrue(values["examDate"] is NSNull)
        XCTAssertTrue(values["barrier"] is NSNull)
        XCTAssertEqual(values["examStatus"] as? String, "unanswered")
    }

    func testUnknownAndPrivateAnswersAreValidWithoutInventingALevel() {
        let answers = NativeAnswers(
            startingLevel: "unknown", targetBand: 7, examStatus: "not_booked",
            examDate: nil, focus: ["reading"], barrier: "private")
        XCTAssertTrue(answers.valid(step: 5))
        XCTAssertEqual(answers.startingLevel, "unknown")
    }

    func testReadingAnswerSupportsBothExistingWebAndNativeDrafts() throws {
        let json = Data(#"{"text":"","reading":{"1":"TRUE","2":["A","C"]},"audioIds":[]}"#.utf8)
        let answer = try JSONDecoder().decode(NativeAnswer.self, from: json)
        XCTAssertEqual(answer.reading["1"]?.values, ["TRUE"])
        XCTAssertEqual(answer.reading["2"]?.values, ["A", "C"])
        XCTAssertEqual(try JSONDecoder().decode(NativeAnswer.self, from: JSONEncoder().encode(answer)), answer)
    }

    func testRecorderMetadataIsRemovedForTheServerWavContract() throws {
        let header: [UInt8] = [
            82, 73, 70, 70, 50, 0, 0, 0, 87, 65, 86, 69,
            74, 85, 78, 75, 2, 0, 0, 0, 0, 0,
            102, 109, 116, 32, 16, 0, 0, 0, 1, 0, 1, 0, 128, 62, 0, 0,
            0, 125, 0, 0, 2, 0, 16, 0, 100, 97, 116, 97, 4, 0, 0, 0, 0, 0, 255, 127,
        ]
        let result = try NativeWavCodec().canonical(Data(header))
        XCTAssertEqual(result.count, 48)
        XCTAssertEqual(String(decoding: result[36..<40], as: UTF8.self), "data")
        XCTAssertEqual(Array(result.suffix(4)), [0, 0, 255, 127])
        var invalid = header
        invalid[42] = 24
        XCTAssertThrowsError(try NativeWavCodec().canonical(Data(invalid)))
    }

    func testDraftsAreIsolatedByAccountAndCanBeCleared() throws {
        let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        defer { try? FileManager.default.removeItem(at: directory) }
        let store = NativeFileDrafts(root: directory)
        let draft = NativeDraft(answer: NativeAnswer(text: "A private response"), revision: 4)
        try store.save(draft, user: "learner-a", attempt: "attempt")
        XCTAssertNil(try store.load(user: "learner-b", attempt: "attempt"))
        XCTAssertEqual(try store.load(user: "learner-a", attempt: "attempt")?.revision, 4)
        try store.clear(user: "learner-a")
        XCTAssertNil(try store.load(user: "learner-a", attempt: "attempt"))
    }
}
