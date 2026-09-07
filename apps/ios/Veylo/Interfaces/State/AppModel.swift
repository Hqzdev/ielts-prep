import SwiftUI

@Observable
final class AppModel {
    private let service: DemoSessionService
    private(set) var snapshot: DemoSnapshot
    private(set) var storageFailed: Bool
    var content: any DemoContentProviding { service.content }

    init(service: DemoSessionService) {
        self.service = service
        snapshot = service.snapshot
        storageFailed = service.storageFailed
    }

    var target: Double { snapshot.profile.answers.targetBand ?? 8 }
    var name: String { snapshot.profile.name.isEmpty ? "Learner" : snapshot.profile.name }

    func update(_ change: (inout DemoSnapshot) -> Void) {
        service.update(change)
        refresh()
    }

    func signIn(email: String) {
        service.signIn(email: email, at: Date())
        refresh()
    }

    func register(name: String, email: String) {
        service.register(name: name, email: email)
        refresh()
    }

    func advanceOnboarding() {
        service.advanceOnboarding()
        refresh()
    }

    func completeOnboarding() {
        service.completeOnboarding()
        refresh()
    }

    func startPractice(_ skill: Skill, number: Int = 8, fullExam: Bool = false, restart: Bool = false) -> String {
        let id = service.startPractice(skill: skill, number: number, fullExam: fullExam, restart: restart)
        refresh()
        return id
    }

    func editSession(_ id: String, change: (inout PracticeSession) -> Void) {
        update { snapshot in
            guard var session = snapshot.sessions[id] else { return }
            change(&session)
            snapshot.sessions[id] = session
        }
    }

    func submit(_ id: String) -> PracticeResult? {
        let result = service.submitPractice(id: id, at: Date())
        refresh()
        return result
    }

    func nextExamSession(after id: String) -> String? {
        let next = service.nextExamSession(after: id)
        refresh()
        return next
    }

    func retrySaving() {
        service.persist()
        refresh()
    }

    private func refresh() {
        snapshot = service.snapshot
        storageFailed = service.storageFailed
    }
}

enum AppTab: String, CaseIterable, Identifiable {
    case home = "Home"
    case tests = "Tests"
    case progress = "Progress"
    case profile = "Profile"
    var id: String { rawValue }
    var symbol: String {
        switch self {
        case .home: "house"
        case .tests: "doc.text"
        case .progress: "chart.xyaxis.line"
        case .profile: "person.crop.circle"
        }
    }
}

enum AppRoute: Hashable {
    case practice(String)
    case result(PracticeResult)
    case vocabulary
    case arcade
    case game(ArcadeGame)
    case ai
    case chat
    case voice(String)
}

enum AppSheet: String, Identifiable {
    case profile, goal, exam, notifications, help, privacy, fullExam, conversations, dailyPlan
    var id: String { rawValue }
}

@Observable
final class AppRouter {
    var path: [AppRoute] = []
    var sheet: AppSheet?
    var hidesDock: Bool {
        path.contains { route in
            switch route {
            case .practice, .result, .voice, .game, .chat: true
            default: false
            }
        }
    }
}
