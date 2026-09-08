import Foundation

struct NativeProfile: Codable, Equatable {
    var id: String
    var email: String
    var name: String
    var targetBand: Double
    var selfReportedBand: Double?
    var examDate: String?
    var dailyMinutes: Int
    var studyDays: [Int]
    var timezone: String
    enum CodingKeys: String, CodingKey {
        case id, email, name, targetBand, selfReportedBand, examDate, dailyMinutes, studyDays, timezone
    }
    func encode(to encoder: Encoder) throws {
        var values = encoder.container(keyedBy: CodingKeys.self)
        try values.encode(id, forKey: .id)
        try values.encode(email, forKey: .email)
        try values.encode(name, forKey: .name)
        try values.encode(targetBand, forKey: .targetBand)
        try values.encode(selfReportedBand, forKey: .selfReportedBand)
        try values.encode(examDate, forKey: .examDate)
        try values.encode(dailyMinutes, forKey: .dailyMinutes)
        try values.encode(studyDays, forKey: .studyDays)
        try values.encode(timezone, forKey: .timezone)
    }
}

struct NativeAnswers: Codable, Equatable {
    var startingLevel: String?
    var targetBand: Double?
    var examStatus = "unanswered"
    var examDate: String?
    var focus: [String] = []
    var barrier: String?
    enum CodingKeys: String, CodingKey { case startingLevel, targetBand, examStatus, examDate, focus, barrier }
    func encode(to encoder: Encoder) throws {
        var values = encoder.container(keyedBy: CodingKeys.self)
        try values.encode(startingLevel, forKey: .startingLevel)
        try values.encode(targetBand, forKey: .targetBand)
        try values.encode(examStatus, forKey: .examStatus)
        try values.encode(examDate, forKey: .examDate)
        try values.encode(focus, forKey: .focus)
        try values.encode(barrier, forKey: .barrier)
    }

    func valid(step: Int) -> Bool {
        switch step {
        case 0: return ["below_5_5", "5_5_6_0", "6_5_7_0", "7_5_plus", "unknown"].contains(startingLevel ?? "")
        case 1: return [6.5, 7, 7.5, 8].contains(targetBand ?? 0)
        case 2: return examStatus == "not_booked" || (examStatus == "scheduled" && examDate != nil)
        case 3:
            return !focus.isEmpty && focus.count <= 2 && Set(focus).count == focus.count
                && focus.allSatisfy { ["reading", "writing"].contains($0) }
        case 4: return ["time", "direction", "anxiety", "previous_attempt", "other", "private"].contains(barrier ?? "")
        default: return (0..<5).allSatisfy { valid(step: $0) }
        }
    }
}

struct NativePreferences: Codable, Equatable {
    var dailyReminder: Bool
    var reminderHour: Int
    var soundEffects: Bool
}

struct NativeOnboarding: Codable, Equatable {
    var revision: Int
    var version: Int
    var step: Int
    var completedAt: String?
    var answers: NativeAnswers
    var preferences: NativePreferences
}

struct NativeCapabilities: Codable {
    var skills: [String]
    var writingAssessment: Bool
    var textAI: Bool
    var speakingRecording: Bool
}

struct NativeBootstrap: Codable {
    var profile: NativeProfile
    var onboarding: NativeOnboarding
    var capabilities: NativeCapabilities
}

struct NativeTask: Codable, Identifiable {
    var id: String
    var title: String
    var skill: String
    var part: Int
    var topic: String
    var format: String
    var durationSeconds: Int
    var minimumWords: Int
    var prompt: String
    var instructions: String
    var paragraphs: [Paragraph]
    var readingQuestions: [Question]
    var speakingQuestions: [String]
    var cuePoints: [String]
    var preparationSeconds: Int
    var visual: Visual?
    var diagram: Diagram?
    struct Paragraph: Codable {
        var label: String
        var text: String
    }
    struct Question: Codable, Identifiable {
        var number: Int
        var statement: String
        var mode: String
        var options: [Option]
        var selectCount: Int
        var maxWords: Int?
        var group: String?
        var id: Int { number }
    }
    struct Option: Codable {
        var value: String
        var label: String
    }
    struct Visual: Codable {
        var chartType: String
        var title: String
        var unit: String?
        var periods: [String]
        var dataSeries: [Series]
        var processSteps: [String]
        struct Series: Codable {
            var category: String
            var values: [String: Double]
        }
    }
    struct Diagram: Codable {
        var title: String
        var nodes: [Node]
        var edges: [Edge]
        struct Node: Codable {
            var id: String
            var label: String
            var x: Double
            var y: Double
            var questionNumber: Int?
        }
        struct Edge: Codable {
            var source: String
            var target: String
        }
    }
}

struct NativeCatalog: Codable {
    var items: [Item]
    var total: Int
    var page: Int
    struct Item: Codable, Identifiable {
        var task: NativeTask
        var status: String
        var lastAttemptId: String?
        var lastBand: Double?
        var lastAccuracy: Double?
        var id: String { task.id }
    }
}

struct NativeStreak: Codable {
    var current: Int
    var best: Int
    var todayComplete: Bool
    var week: [Day]
    struct Day: Codable {
        var date: String
        var label: String
        var state: String
    }
}

struct NativeDashboard: Codable {
    var today: String
    var tasks: [NativeCatalog.Item]
    var streak: NativeStreak
    var completed: Int
    var total: Int
}

enum NativeReadingAnswer: Codable, Hashable {
    case single(String)
    case multiple([String])
    var values: [String] {
        switch self {
        case .single(let value): [value]
        case .multiple(let values): values
        }
    }
    init(from decoder: Decoder) throws {
        let value = try decoder.singleValueContainer()
        if let string = try? value.decode(String.self) {
            self = .single(string)
        } else {
            self = .multiple(try value.decode([String].self))
        }
    }
    func encode(to encoder: Encoder) throws {
        var value = encoder.singleValueContainer()
        switch self {
        case .single(let string): try value.encode(string)
        case .multiple(let strings): try value.encode(strings)
        }
    }
}

struct NativeAnswer: Codable, Hashable {
    var text = ""
    var reading: [String: NativeReadingAnswer] = [:]
    var audioIds: [String] = []
}

struct NativeAttempt: Codable, Identifiable {
    var id: String
    var userId: String
    var taskSnapshot: NativeTask
    var mode: String
    var status: String
    var answer: NativeAnswer
    var revision: Int
    var elapsedSeconds: Int
    var activeSince: String?
    var deadlineAt: String?
    var editable: Bool { status == "in_progress" || status == "paused" }
}

struct NativeNotes: Codable, Equatable {
    var revision = 0
    var flaggedQuestions: [Int] = []
    var highlights: [String] = []
}

struct NativeResult: Codable {
    var attempt: NativeAttempt
    var assessment: Assessment?
    struct Assessment: Codable {
        var status: String
        var band: Double?
        var grade: Grade?
        var reading: [Verdict]?
        var errorCode: String?
    }
    struct Grade: Codable {
        var sufficientEvidence: Bool
        var insufficientReason: String?
        var criteria: [Criterion]
        var errors: [Feedback]
        var strengths: [String]
        var nextFocus: String
    }
    struct Criterion: Codable {
        var key: String
        var label: String
        var score: Double
        var explanation: String
    }
    struct Feedback: Codable {
        var category: String
        var issue: String
        var correction: String
        var anchor: Anchor
        struct Anchor: Codable {
            var quote: String?
            var requirement: String?
        }
    }
    struct Verdict: Codable, Identifiable {
        var number: Int
        var statement: String
        var given: [String]
        var expected: [String]
        var correct: Bool
        var evidence: String
        var explanation: String
        var id: Int { number }
    }
}

struct NativeProgress: Codable {
    var statistics: Statistics
    var forecasts: [Forecast]
    var streak: NativeStreak
    struct Statistics: Codable {
        var skills: [SkillSeries]
        var independentCount: Int
        var totalMinutes: Int
        var history: [Entry]
    }
    struct SkillSeries: Codable {
        var skill: String
        var count: Int
        var latest: Double?
        var average: Double?
        var series: [Point]
    }
    struct Point: Codable {
        var date: String
        var value: Double
        var part: Int
        var mode: String
    }
    struct Forecast: Codable {
        var skill: String
        var target: Double
        var estimatedDate: String?
        var reason: String
        var resultCount: Int
    }
    struct Entry: Codable, Identifiable {
        var id: String
        var title: String
        var date: String
        var skill: String
        var band: Double?
        var accuracy: Double?
    }
}

struct NativeWord: Codable, Identifiable {
    var id: String
    var term: String
    var translation: String
    var topic: String
    var partOfSpeech: String
    var example: String
    var gapSentence: String
    var alternatives: [String]
    var saved: Bool
    var correct: Int
    var total: Int
}

struct NativeQuiz: Codable, Identifiable {
    var id: String
    var questions: [Question]
    var result: [Answer]?
    struct Question: Codable, Identifiable {
        var id: String
        var wordId: String
        var type: String
        var prompt: String
        var options: [String]
    }
    struct Answer: Codable {
        var questionId: String
        var correct: Bool
        var given: String
        var expected: String
        var term: String
        var translation: String
        var example: String
    }
}

struct NativeSprint: Codable, Identifiable {
    var id: String
    var score: Int
    var lives: Int
    var index: Int
    var total: Int
    var finished: Bool
    var question: NativeQuiz.Question?
    var lastAnswer: NativeQuiz.Answer?
}

struct NativeThread: Codable, Identifiable {
    var id: String
    var title: String
    var attemptId: String?
}
struct NativeMessage: Codable, Identifiable {
    var id: String
    var role: String
    var content: String
    var status: String
}
struct NativeChatEvent: Decodable {
    var type: String
    var threadId: String?
    var assistantId: String?
    var text: String?
    var message: String?
    var status: String?
}

struct NativeFailure: LocalizedError {
    var code: String
    var message: String
    var errorDescription: String? { message }
}

struct NativeAcknowledgement: Decodable {}
