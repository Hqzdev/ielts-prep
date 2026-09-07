import Foundation

enum Skill: String, Codable, CaseIterable, Identifiable, Hashable {
    case reading = "Reading"
    case listening = "Listening"
    case writing = "Writing"
    case speaking = "Speaking"

    var id: String { rawValue }
}

enum StartingBand: String, Codable, CaseIterable, Identifiable {
    case below = "Below 5.5"
    case developing = "5.5–6.0"
    case confident = "6.5–7.0"
    case advanced = "7.5+"
    case unknown = "Not sure yet"

    var id: String { rawValue }
}

enum StudyBarrier: String, Codable, CaseIterable, Identifiable {
    case time = "Not enough time to study"
    case direction = "Don't know where to start"
    case anxiety = "Anxiety on test day"
    case previousAttempt = "Tried before, didn't hit my score"
    case other = "Other"
    case privateAnswer = "Prefer not to say"

    var id: String { rawValue }
}

enum ExamPlan: Codable, Equatable {
    case unanswered
    case notBooked
    case scheduled(Date)
}

struct OnboardingAnswers: Codable, Equatable {
    static let targets: [Double] = [6.5, 7, 7.5, 8]
    var startingBand: StartingBand?
    var targetBand: Double?
    var examPlan: ExamPlan = .unanswered
    var focus: [Skill] = []
    var barrier: StudyBarrier?

    mutating func toggleFocus(_ skill: Skill) {
        if focus.contains(skill) {
            focus.removeAll { $0 == skill }
        } else if focus.count < 2 {
            focus.append(skill)
        }
    }

    func isValid(step: Int) -> Bool {
        switch step {
        case 0: startingBand != nil
        case 1: targetBand.map { Self.targets.contains($0) } ?? false
        case 2: examPlan != .unanswered
        case 3: (1...2).contains(focus.count) && Set(focus).count == focus.count
        case 4: barrier != nil
        default: false
        }
    }

    var isComplete: Bool { (0...4).allSatisfy { isValid(step: $0) } }
}

struct LearnerProfile: Codable, Equatable {
    var name = ""
    var email = ""
    var answers = OnboardingAnswers()
    var dailyReminder = true
    var soundEffects = true
    var reminderHour = 19
}
