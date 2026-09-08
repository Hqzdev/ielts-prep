import SwiftUI

@main
struct VeyloApp: App {
    @UIApplicationDelegateAdaptor(QuickActionDelegate.self) private var quickActions
    @State private var native: NativeAppModel?
    @State private var demo: AppModel?
    private let configurationError: String?

    init() {
        let root = URL.applicationSupportDirectory.appendingPathComponent("Veylo", isDirectory: true)
        #if DEBUG
            let arguments = ProcessInfo.processInfo.arguments
            if arguments.contains("--uitesting") || arguments.contains("--demo-home") {
                let repository = LocalDemoRepository(directory: root.appendingPathComponent("UITests"))
                let service = DemoSessionService(repository: repository, content: DemoContent())
                if arguments.contains("--reset-demo") { service.update { $0 = DemoSnapshot() } }
                if arguments.contains("--demo-home") { service.signIn(email: "yaroslav@example.com", at: Date()) }
                _demo = State(initialValue: AppModel(service: service))
                configurationError = nil
                return
            }
        #endif
        do {
            let configuration = try NativeConfiguration.load()
            let identity = SupabaseIdentity(configuration: configuration)
            _native = State(
                initialValue: NativeAppModel(
                    identity: identity,
                    remote: NativeHTTPClient(configuration: configuration, identity: identity),
                    drafts: NativeFileDrafts(root: root.appendingPathComponent("Drafts")),
                    reminders: NativeLocalReminders(),
                    audio: NativeAudioFiles(root: root.appendingPathComponent("Recordings"))))
            configurationError = nil
        } catch {
            configurationError = error.localizedDescription
        }
    }

    var body: some Scene {
        WindowGroup {
            if let native {
                NativeRootView().modifier(NativeQuickActions()).environment(native)
            } else if let demo {
                AppRootView().environment(demo)
            } else {
                NativeEmptyState(
                    title: "Connect Veylo", detail: configurationError ?? "This build needs a server configuration."
                )
                .padding(24).preferredColorScheme(.light)
            }
        }
    }
}
