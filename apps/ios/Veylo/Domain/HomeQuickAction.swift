import Foundation

enum HomeQuickAction: String, CaseIterable, Identifiable {
    case resume, streak, chat, vocabulary
    var id: String { rawValue }
    var shortcutType: String { "app.veylo.quick.\(rawValue)" }
    init?(shortcutType: String) {
        guard let action = Self.allCases.first(where: { $0.shortcutType == shortcutType }) else { return nil }
        self = action
    }
}
