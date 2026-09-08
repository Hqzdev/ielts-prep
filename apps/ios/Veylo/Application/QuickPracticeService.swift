import Foundation

enum QuickPracticeDestination: Equatable {
    case attempt(String)
    case progress
    case catalog
}

@MainActor
struct QuickPracticeService {
    let remote: any NativeRemote

    func open(_ action: HomeQuickAction) async throws -> QuickPracticeDestination {
        if action == .resume {
            let catalog = try await remote.get("tasks?status=started&sort=recent", as: ResumeCatalog.self)
            if let id = catalog.items.compactMap(\.lastAttemptId).first { return .attempt(id) }
        }
        let dashboard = try await remote.get("dashboard", as: Plan.self)
        if action == .streak && dashboard.streak.todayComplete { return .progress }
        let unfinished = dashboard.tasks.filter { $0.status != "completed" }
        let item =
            unfinished.first(where: { $0.status == "started" && $0.lastAttemptId != nil })
            ?? unfinished.min(by: { $0.task.durationSeconds < $1.task.durationSeconds })
        guard let item else { return .catalog }
        if item.status == "started", let id = item.lastAttemptId { return .attempt(id) }
        let attempt = try await remote.send(
            "attempts", method: "POST", body: Start(taskId: item.task.id), as: Started.self)
        return .attempt(attempt.id)
    }

    private struct ResumeCatalog: Decodable {
        var items: [Item]
        struct Item: Decodable { var lastAttemptId: String? }
    }
    private struct Plan: Decodable {
        var tasks: [Item]
        var streak: Streak
        struct Streak: Decodable { var todayComplete: Bool }
        struct Item: Decodable {
            var task: Task
            var status: String
            var lastAttemptId: String?
        }
        struct Task: Decodable {
            var id: String
            var durationSeconds: Int
        }
    }
    private struct Start: Encodable {
        var taskId: String
        var mode = "practice"
    }
    private struct Started: Decodable { var id: String }
}
