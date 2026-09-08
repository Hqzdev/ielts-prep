import XCTest

@testable import Veylo

@MainActor
final class QuickActionTests: XCTestCase {
    func testActionWaitsForAuthenticationAndIsConsumedOnce() {
        let inbox = QuickActionInbox()
        XCTAssertTrue(inbox.receive(type: HomeQuickAction.chat.shortcutType))
        XCTAssertNil(inbox.take(ready: false))
        XCTAssertEqual(inbox.take(ready: true), .chat)
        XCTAssertNil(inbox.take(ready: true))
    }

    func testUnknownActionDoesNotReplacePendingAction() {
        let inbox = QuickActionInbox()
        inbox.receive(type: HomeQuickAction.vocabulary.shortcutType)
        XCTAssertFalse(inbox.receive(type: "invalid"))
        XCTAssertEqual(inbox.take(ready: true), .vocabulary)
    }

    func testLatestSelectionWinsWhileWaitingForSignIn() {
        let inbox = QuickActionInbox()
        inbox.receive(type: HomeQuickAction.resume.shortcutType)
        inbox.receive(type: HomeQuickAction.streak.shortcutType)
        XCTAssertEqual(inbox.take(ready: true), .streak)
    }

    func testResumeUsesLatestUnfinishedAttemptWithoutCreatingAnother() async throws {
        let remote = QuickActionRemoteFixture(
            resume: #"{"items":[{"lastAttemptId":"recent"},{"lastAttemptId":"older"}]}"#)
        let destination = try await QuickPracticeService(remote: remote).open(.resume)
        XCTAssertEqual(destination, .attempt("recent"))
        XCTAssertEqual(remote.reads, ["tasks?status=started&sort=recent"])
        XCTAssertTrue(remote.writes.isEmpty)
    }

    func testEarnedStreakOpensProgressWithoutStartingPractice() async throws {
        let remote = QuickActionRemoteFixture(plan: #"{"tasks":[],"streak":{"todayComplete":true}}"#)
        let destination = try await QuickPracticeService(remote: remote).open(.streak)
        XCTAssertEqual(destination, .progress)
        XCTAssertTrue(remote.writes.isEmpty)
    }

    func testMissingResumeStartsShortestIncompleteDailyTask() async throws {
        let remote = QuickActionRemoteFixture(
            plan:
                #"{"tasks":[{"task":{"id":"done","durationSeconds":10},"status":"completed"},{"task":{"id":"long","durationSeconds":600},"status":"new"},{"task":{"id":"short","durationSeconds":120},"status":"new"}],"streak":{"todayComplete":false}}"#
        )
        let destination = try await QuickPracticeService(remote: remote).open(.resume)
        XCTAssertEqual(destination, .attempt("created"))
        XCTAssertEqual(remote.writes.count, 1)
        let body = try XCTUnwrap(JSONSerialization.jsonObject(with: remote.writes[0]) as? [String: String])
        XCTAssertEqual(body, ["taskId": "short", "mode": "practice"])
    }

    func testEmptyDailyPlanOpensCatalogWithoutInventingTask() async throws {
        let remote = QuickActionRemoteFixture()
        let destination = try await QuickPracticeService(remote: remote).open(.streak)
        XCTAssertEqual(destination, .catalog)
        XCTAssertTrue(remote.writes.isEmpty)
    }

    func testOfflineFailureIsSurfacedWithoutCreatingAttempt() async {
        let remote = QuickActionRemoteFixture(failReads: true)
        do {
            _ = try await QuickPracticeService(remote: remote).open(.resume)
            XCTFail("Expected the offline error")
        } catch {
            XCTAssertEqual((error as? URLError)?.code, .notConnectedToInternet)
        }
        XCTAssertTrue(remote.writes.isEmpty)
    }

    func testInstalledMenuHasExactlyTheSupportedActions() throws {
        let items = try XCTUnwrap(
            Bundle.main.object(forInfoDictionaryKey: "UIApplicationShortcutItems") as? [[String: Any]])
        let types = items.compactMap { $0["UIApplicationShortcutItemType"] as? String }
        XCTAssertEqual(types, HomeQuickAction.allCases.map(\.shortcutType))
        XCTAssertTrue(items.allSatisfy { ($0["UIApplicationShortcutItemSubtitle"] as? String)?.isEmpty == false })
    }
}

@MainActor
private final class QuickActionRemoteFixture: NativeRemote {
    var reads: [String] = []
    var writes: [Data] = []
    private let resume: String
    private let plan: String
    private let failReads: Bool

    init(
        resume: String = #"{"items":[]}"#,
        plan: String = #"{"tasks":[],"streak":{"todayComplete":false}}"#,
        failReads: Bool = false
    ) {
        self.resume = resume
        self.plan = plan
        self.failReads = failReads
    }

    func get<T: Decodable>(_ path: String, as type: T.Type) async throws -> T {
        reads.append(path)
        if failReads { throw URLError(.notConnectedToInternet) }
        let json: String
        switch path {
        case "tasks?status=started&sort=recent": json = resume
        case "dashboard": json = plan
        default: throw URLError(.unsupportedURL)
        }
        return try JSONDecoder().decode(type, from: Data(json.utf8))
    }

    func send<T: Decodable, Body: Encodable>(
        _ path: String, method: String, body: Body, as type: T.Type
    ) async throws -> T {
        XCTAssertEqual(path, "attempts")
        XCTAssertEqual(method, "POST")
        writes.append(try JSONEncoder().encode(body))
        return try JSONDecoder().decode(type, from: Data(#"{"id":"created"}"#.utf8))
    }

    func bootstrap() async throws -> NativeBootstrap { throw URLError(.unsupportedURL) }
    func chat(
        _ path: String, body: NativeChatRequest,
        receive: @escaping @MainActor (NativeChatEvent) -> Void
    ) async throws { throw URLError(.unsupportedURL) }
    func upload(_ data: Data, path: String, token: String) async throws { throw URLError(.unsupportedURL) }
}
