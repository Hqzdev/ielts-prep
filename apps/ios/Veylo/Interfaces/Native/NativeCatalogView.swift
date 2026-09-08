import SwiftUI

struct NativeCatalogView: View {
    @Environment(NativeAppModel.self) private var model
    @State private var skill = "reading"
    @State private var page = 1
    @State private var items: [NativeCatalog.Item] = []
    @State private var total = 0
    @State private var destination: String?
    @State private var mode = "practice"
    var recordingOnly = false

    var body: some View {
        PageScroll {
            BrandHeader()
            ScreenHeading(
                title: recordingOnly ? "Recording lab" : "IELTS practice",
                subtitle: recordingOnly
                    ? "Microphone test · no AI assessment" : "Build confidence in Reading and Writing.")
            if !recordingOnly {
                Picker("Skill", selection: $skill) {
                    Text("Reading").tag("reading")
                    Text("Writing").tag("writing")
                }.pickerStyle(.segmented)
            }
            Picker("Practice mode", selection: $mode) {
                Text("Practice").tag("practice")
                Text("Timed").tag("strict")
            }.pickerStyle(.segmented)
            Text(
                mode == "strict"
                    ? "The timer keeps running when you leave. Hints are unavailable until submission."
                    : "Pause, save and come back when you're ready."
            )
            .font(VeyloStyle.font(13)).foregroundStyle(VeyloStyle.muted)
            NativeBusyButton(title: "Random exercise", enabled: total > 0) {
                let randomPage = Int.random(in: 1...max(1, (total + 19) / 20))
                let catalog = try await model.remote.get(
                    "tasks?skill=\(selectedSkill)&page=\(randomPage)", as: NativeCatalog.self)
                guard let item = catalog.items.randomElement() else { return }
                destination = try await NativeStartAttempt.create(
                    taskID: item.task.id, mode: mode, remote: model.remote)
            }
            ForEach(items) { item in
                ActionRow(
                    title: item.task.title,
                    subtitle:
                        "\(item.task.format.replacingOccurrences(of: "_", with: " ")) · \(item.task.durationSeconds / 60) min · \(item.status)",
                    symbol: item.task.displaySkill.symbol, color: item.task.displaySkill.accent,
                    surface: item.task.displaySkill.surface
                ) {
                    model.perform {
                        if item.status == "started", let id = item.lastAttemptId {
                            destination = id
                        } else {
                            destination = try await NativeStartAttempt.create(
                                taskID: item.task.id, mode: mode, remote: model.remote)
                        }
                    }
                }
            }
            if items.count < total {
                NativeBusyButton(title: "Load more") { try await load(page: page + 1) }
            }
            if total == 0 {
                NativeEmptyState(title: "Exercises are on their way", detail: "Pull down to check for new practice.")
            }
        }
        .task(id: selectedSkill) {
            do { try await load(page: 1) } catch { model.error = error.localizedDescription }
        }
        .refreshable { do { try await load(page: 1) } catch { model.error = error.localizedDescription } }
        .navigationDestination(item: $destination) { NativePracticeView(id: $0) }
    }
    private var selectedSkill: String { recordingOnly ? "speaking" : skill }
    private func load(page requestedPage: Int) async throws {
        let current = selectedSkill
        let result = try await model.remote.get("tasks?skill=\(current)&page=\(requestedPage)", as: NativeCatalog.self)
        guard current == selectedSkill else { return }
        items = requestedPage == 1 ? result.items : items + result.items
        total = result.total
        page = requestedPage
    }
}
