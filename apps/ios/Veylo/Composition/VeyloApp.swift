import SwiftUI

@main
struct VeyloApp: App {
    @State private var model: AppModel

    init() {
        let root = URL.applicationSupportDirectory.appendingPathComponent("Veylo", isDirectory: true)
        let arguments = ProcessInfo.processInfo.arguments
        let repository = LocalDemoRepository(
            directory: arguments.contains("--uitesting") ? root.appendingPathComponent("UITests") : root)
        let service = DemoSessionService(repository: repository, content: DemoContent())
        if arguments.contains("--reset-demo") { service.update { $0 = DemoSnapshot() } }
        if arguments.contains("--demo-home") { service.signIn(email: "yaroslav@example.com", at: Date()) }
        model = AppModel(service: service)
    }

    var body: some Scene {
        WindowGroup {
            AppRootView().environment(model)
        }
    }
}
