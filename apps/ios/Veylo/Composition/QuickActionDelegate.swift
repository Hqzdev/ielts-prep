import SwiftUI
import UIKit

@MainActor
@Observable
final class QuickActionInbox {
    static let shared = QuickActionInbox()
    private(set) var pending: HomeQuickAction?

    @discardableResult
    func receive(type: String) -> Bool {
        guard let action = HomeQuickAction(shortcutType: type) else { return false }
        pending = action
        return true
    }

    func take(ready: Bool) -> HomeQuickAction? {
        guard ready else { return nil }
        defer { pending = nil }
        return pending
    }
}

final class QuickActionDelegate: NSObject, UIApplicationDelegate {
    func application(
        _ application: UIApplication, configurationForConnecting session: UISceneSession,
        options: UIScene.ConnectionOptions
    ) -> UISceneConfiguration {
        let configuration = UISceneConfiguration(name: nil, sessionRole: session.role)
        configuration.delegateClass = QuickActionSceneDelegate.self
        return configuration
    }
}

final class QuickActionSceneDelegate: NSObject, UIWindowSceneDelegate {
    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options: UIScene.ConnectionOptions) {
        if let shortcut = options.shortcutItem { QuickActionInbox.shared.receive(type: shortcut.type) }
    }

    func windowScene(
        _ windowScene: UIWindowScene, performActionFor shortcutItem: UIApplicationShortcutItem,
        completionHandler: @escaping (Bool) -> Void
    ) {
        completionHandler(QuickActionInbox.shared.receive(type: shortcutItem.type))
    }
}
