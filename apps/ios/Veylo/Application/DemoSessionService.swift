import Foundation

final class DemoSessionService {
    private let repository: any DemoRepository
    let content: any DemoContentProviding
    private(set) var snapshot: DemoSnapshot
    private(set) var storageFailed = false
    private let onboarding = OnboardingFlow()
    private let practice = PracticeFlow()

    init(repository: any DemoRepository, content: any DemoContentProviding) {
        self.repository = repository
        self.content = content
        do {
            snapshot = try repository.load() ?? DemoSnapshot()
            snapshot.onboardingStep = onboarding.resumeStep(snapshot.onboardingStep, answers: snapshot.profile.answers)
        } catch {
            snapshot = DemoSnapshot()
            storageFailed = true
        }
    }

    func update(_ change: (inout DemoSnapshot) -> Void) {
        change(&snapshot)
        persist()
    }

    func signIn(email: String, at date: Date) {
        if snapshot.profile.email.caseInsensitiveCompare(email) != .orderedSame || snapshot.profile.email.isEmpty {
            snapshot = content.returningLearner(at: date)
            snapshot.profile.email = email
        }
        snapshot.signedIn = true
        persist()
    }

    func register(name: String, email: String) {
        snapshot = DemoSnapshot()
        snapshot.signedIn = true
        snapshot.profile.name = name.trimmingCharacters(in: .whitespacesAndNewlines)
        snapshot.profile.email = email
        persist()
    }

    func advanceOnboarding() {
        snapshot.onboardingStep = onboarding.nextStep(after: snapshot.onboardingStep, answers: snapshot.profile.answers)
        persist()
    }

    func completeOnboarding() {
        guard onboarding.canComplete(snapshot.profile.answers) else { return }
        snapshot.onboardingCompleted = true
        persist()
    }

    func startPractice(skill: Skill, number: Int, fullExam: Bool = false, restart: Bool = false) -> String {
        let id = "\(fullExam ? "exam-" : "")\(skill.rawValue)-\(number)"
        if restart || snapshot.sessions[id] == nil || snapshot.sessions[id]?.submitted == true {
            snapshot.sessions[id] = PracticeSession(id: id, skill: skill, testNumber: number, isFullExam: fullExam)
        }
        persist()
        return id
    }

    func submitPractice(id: String, at date: Date) -> PracticeResult? {
        guard var session = snapshot.sessions[id] else { return nil }
        if let result = snapshot.results.last(where: { $0.sourceSessionID == id }), session.submitted { return result }
        session.submitted = true
        snapshot.sessions[id] = session
        let result = practice.result(for: session, at: date)
        snapshot.results.append(result)
        snapshot.completedTasks.insert("\(session.skill.rawValue.lowercased())-\(session.testNumber)")
        persist()
        return result
    }

    func nextExamSession(after id: String) -> String? {
        guard let session = snapshot.sessions[id], session.isFullExam,
            let next = practice.nextSkill(after: session.skill)
        else { return nil }
        return startPractice(skill: next, number: session.testNumber, fullExam: true)
    }

    func persist() {
        do {
            try repository.save(snapshot)
            storageFailed = false
        } catch {
            storageFailed = true
        }
    }
}
