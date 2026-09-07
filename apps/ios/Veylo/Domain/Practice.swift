import Foundation

struct PracticeSession: Codable, Equatable, Identifiable, Hashable {
    var id: String
    var skill: Skill
    var testNumber: Int
    var question = 0
    var answers: [String: String] = [:]
    var flaggedQuestions: Set<Int> = []
    var highlighted = false
    var essay = ""
    var elapsedSeconds = 0
    var submitted = false
    var isFullExam = false

    var answerCount: Int { answers.values.filter { !$0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }.count }
    var wordCount: Int { essay.split { $0.isWhitespace || $0.isNewline }.count }
}

struct PracticeResult: Codable, Identifiable, Hashable {
    var id: String
    var skill: Skill
    var band: Double
    var date: Date
    var isFullExam: Bool
    var practiceID: String?
    var savedResponse: String?

    var sourceSessionID: String { practiceID ?? id }
}

struct ChatMessage: Codable, Identifiable, Equatable {
    var id: Int
    var text: String
    var isLearner: Bool
    var skill: Skill?
}

enum ArcadeGame: String, CaseIterable, Identifiable, Hashable {
    case wordSprint = "Word Sprint"
    case speakingShuffle = "Speaking Shuffle"
    case listenMatch = "Listen & Match"

    var id: String { rawValue }
}

struct VocabularyWord: Identifiable, Hashable {
    var id: String
    var pronunciation: String
    var meaning: String
    var example: String
    var alternatives: [String]
    var correctChoice: Int
}

struct DemoSnapshot: Codable, Equatable {
    var version = 1
    var signedIn = false
    var onboardingCompleted = false
    var onboardingStep = 0
    var profile = LearnerProfile()
    var sessions: [String: PracticeSession] = [:]
    var results: [PracticeResult] = []
    var completedTasks: Set<String> = []
    var learnedWords: Set<String> = []
    var favoriteWords: Set<String> = []
    var messages: [ChatMessage] = []
    var arcadeBestScores: [String: Int] = [:]
    var seededHistory = false

    var streak: Int { seededHistory ? 5 : (completedTasks.isEmpty ? 0 : 1) }
}
