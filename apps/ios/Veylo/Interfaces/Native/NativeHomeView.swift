import SwiftUI

struct NativeHomeView: View {
    @Environment(NativeAppModel.self) private var model
    @State private var dashboard: NativeDashboard?
    @State private var destination: String?
    var body: some View {
        PageScroll {
            BrandHeader()
            ScreenHeading(
                title: "Hi, \(model.account?.profile.name ?? "Learner")",
                subtitle: "A little progress, every day.")
            if let dashboard {
                HStack {
                    Text("🔥").font(.system(size: 24))
                    Text("\(dashboard.streak.current) day streak").font(VeyloStyle.font(15, weight: .heavy))
                    Spacer()
                }.padding(16).background(Color(hex: 0xFFFACA), in: Capsule()).reveal()
                VStack(alignment: .leading, spacing: 18) {
                    ScreenHeading(
                        title: "Your plan for today", subtitle: "\(dashboard.completed) of \(dashboard.total) completed"
                    )
                    ProgressView(value: Double(dashboard.completed), total: Double(max(1, dashboard.total)))
                        .accessibilityValue("\(dashboard.completed) of \(dashboard.total) completed")
                    ForEach(dashboard.tasks) { item in
                        ActionRow(
                            title: item.task.title,
                            subtitle: "\(item.task.skill.capitalized) · \(item.task.durationSeconds / 60) min",
                            symbol: item.task.displaySkill.symbol, color: item.task.displaySkill.accent,
                            surface: item.task.displaySkill.surface
                        ) {
                            model.perform {
                                destination = try await NativeStartAttempt.start(item: item, remote: model.remote)
                            }
                        }
                    }
                    if dashboard.tasks.isEmpty { Text("New exercises will appear here when content is available.") }
                }.panel(VeyloStyle.panel).reveal(delay: 0.08)
                NavigationLink(value: NativeRoute.vocabulary) {
                    Label("Build your vocabulary", systemImage: "character.book.closed").frame(
                        maxWidth: .infinity, alignment: .leading
                    ).padding(20)
                }.veyloGlass().buttonStyle(PressStyle())
            } else {
                ProgressView("Loading your plan…")
            }
        }
        .task(id: model.learningRevision) { await load() }.refreshable { await load() }
        .navigationDestination(item: $destination) { NativePracticeView(id: $0) }
    }
    private func load() async {
        do { dashboard = try await model.remote.get("dashboard", as: NativeDashboard.self) } catch {
            model.error = error.localizedDescription
        }
    }
}

enum NativeStartAttempt {
    @MainActor static func start(item: NativeCatalog.Item, remote: any NativeRemote) async throws -> String {
        if item.status == "started", let id = item.lastAttemptId { return id }
        return try await create(taskID: item.task.id, remote: remote)
    }
    @MainActor static func create(taskID: String, mode: String = "practice", remote: any NativeRemote) async throws
        -> String
    {
        struct Request: Encodable {
            var taskId: String
            var mode: String
        }
        let attempt = try await remote.send(
            "attempts", method: "POST", body: Request(taskId: taskID, mode: mode), as: NativeAttempt.self)
        return attempt.id
    }
}
