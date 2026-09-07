import Foundation

protocol DemoRepository {
    func load() throws -> DemoSnapshot?
    func save(_ snapshot: DemoSnapshot) throws
}

protocol DemoContentProviding {
    var vocabulary: [VocabularyWord] { get }
    var readingPassages: [String] { get }
    var readingQuestions: [String] { get }
    var speakingTopics: [String] { get }
    func returningLearner(at date: Date) -> DemoSnapshot
    func response(to message: String, skill: Skill) -> String
    func criteria(for skill: Skill) -> [(String, Double)]
    func feedback(for skill: Skill, criterion: String) -> String
}

struct OnboardingFlow {
    func nextStep(after step: Int, answers: OnboardingAnswers) -> Int {
        answers.isValid(step: step) ? min(step + 1, 5) : step
    }

    func canComplete(_ answers: OnboardingAnswers) -> Bool { answers.isComplete }

    func resumeStep(_ storedStep: Int, answers: OnboardingAnswers) -> Int {
        let firstMissing = (0...4).first { !answers.isValid(step: $0) } ?? 5
        return min(max(storedStep, 0), firstMissing)
    }
}

struct PracticeFlow {
    func nextSkill(after skill: Skill) -> Skill? {
        let order: [Skill] = [.listening, .reading, .writing, .speaking]
        guard let index = order.firstIndex(of: skill), index + 1 < order.count else { return nil }
        return order[index + 1]
    }

    func result(for session: PracticeSession, at date: Date) -> PracticeResult {
        PracticeResult(
            id: "\(session.id)-\(date.timeIntervalSince1970)", skill: session.skill,
            band: session.skill == .reading ? 7 : 6.5, date: date,
            isFullExam: session.isFullExam, practiceID: session.id, savedResponse: session.essay)
    }
}
