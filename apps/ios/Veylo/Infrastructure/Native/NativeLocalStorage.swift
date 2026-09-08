import Foundation
import UserNotifications

@MainActor
final class NativeFileDrafts: NativeDraftStorage {
    private let root: URL
    init(root: URL) { self.root = root }
    private func file(user: String, attempt: String) -> URL {
        root.appendingPathComponent(user).appendingPathComponent(attempt + ".json")
    }
    func load(user: String, attempt: String) throws -> NativeDraft? {
        let url = file(user: user, attempt: attempt)
        guard FileManager.default.fileExists(atPath: url.path) else { return nil }
        return try JSONDecoder().decode(NativeDraft.self, from: Data(contentsOf: url))
    }
    func save(_ draft: NativeDraft, user: String, attempt: String) throws {
        let url = file(user: user, attempt: attempt)
        try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
        try JSONEncoder().encode(draft).write(to: url, options: [.atomic, .completeFileProtection])
        var resource = URLResourceValues()
        resource.isExcludedFromBackup = true
        var directory = url.deletingLastPathComponent()
        try directory.setResourceValues(resource)
    }
    func remove(user: String, attempt: String) throws {
        let url = file(user: user, attempt: attempt)
        if FileManager.default.fileExists(atPath: url.path) { try FileManager.default.removeItem(at: url) }
    }
    func clear(user: String) throws {
        let url = root.appendingPathComponent(user)
        if FileManager.default.fileExists(atPath: url.path) { try FileManager.default.removeItem(at: url) }
    }
}

@MainActor
final class NativeLocalReminders: NativeReminders {
    private let center = UNUserNotificationCenter.current()
    func update(_ preferences: NativePreferences, barrier: String?) async throws {
        clear()
        guard preferences.dailyReminder else { return }
        guard try await center.requestAuthorization(options: [.alert, .sound]) else {
            throw NativeFailure(
                code: "NOTIFICATIONS_DENIED",
                message: "Enable notifications for Veylo in Settings to receive reminders.")
        }
        let content = UNMutableNotificationContent()
        content.title = "A little progress, every day"
        content.body =
            barrier == "anxiety"
            ? "A calm practice session can make exam day feel more familiar."
            : "Your Reading and Writing practice is ready when you are."
        if preferences.soundEffects { content.sound = .default }
        let trigger = UNCalendarNotificationTrigger(
            dateMatching: DateComponents(hour: preferences.reminderHour), repeats: true)
        try await center.add(UNNotificationRequest(identifier: "veylo.daily", content: content, trigger: trigger))
    }
    func clear() {
        center.removePendingNotificationRequests(withIdentifiers: ["veylo.daily"])
        center.removeDeliveredNotifications(withIdentifiers: ["veylo.daily"])
    }
}
