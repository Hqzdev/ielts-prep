import Foundation

struct DemoContent: DemoContentProviding {
    let readingPassages = [
        "Urban trees do more than provide shade. A recent study compared the temperature of streets with mature trees to nearby streets without them. The shaded streets were cooler throughout the afternoon, even when the air temperature across the city remained high.",
        "Their leaves cool the surrounding air. Through a process called transpiration, trees release water vapour. This uses heat energy and lowers local temperatures. The effect depends on the species, access to water and the size of the canopy.",
        "Planting alone is not enough. Young trees need long-term care, particularly during dry summers. Researchers recommend protecting existing trees while creating space for new ones. They did not compare the cost of tree care across different cities.",
    ]
    let readingQuestions = [
        "Trees help lower the temperature of the air around them.",
        "All tree species cool the air equally well.",
        "Maintaining urban trees costs less in small cities.",
    ]
    let speakingTopics = [
        "Describe a place where you like to relax.",
        "Describe a skill you would like to learn.",
        "Describe a person who encouraged you.",
        "Describe a journey you remember well.",
    ]
    let vocabulary: [VocabularyWord] = [
        .init(
            id: "Resilient", pronunciation: "/rɪˈzɪliənt/", meaning: "Able to recover quickly after difficulties.",
            example: "Cities need resilient transport systems.",
            alternatives: ["Quick to recover", "Easy to forget", "Difficult to explain"], correctChoice: 0),
        .init(
            id: "Substantial", pronunciation: "/səbˈstænʃəl/", meaning: "Large in amount, size or importance.",
            example: "Public transport can bring substantial benefits.",
            alternatives: ["Temporary", "Significant in size", "Uncertain"], correctChoice: 1),
        .init(
            id: "Mitigate", pronunciation: "/ˈmɪtɪɡeɪt/", meaning: "To make something less harmful or serious.",
            example: "Urban trees help mitigate the effects of heat.",
            alternatives: ["Make worse", "Remove completely", "Make less severe"], correctChoice: 2),
        .init(
            id: "Coherent", pronunciation: "/kəʊˈhɪərənt/", meaning: "Clear, logical and well connected.",
            example: "A coherent argument is easy to follow.",
            alternatives: ["Logical and connected", "Very brief", "Highly emotional"], correctChoice: 0),
        .init(
            id: "Sustainable", pronunciation: "/səˈsteɪnəbl/",
            meaning: "Able to continue without exhausting resources.",
            example: "Cycling is a sustainable way to travel.",
            alternatives: ["Expensive to maintain", "Able to last", "Quick to build"], correctChoice: 1),
        .init(
            id: "Perspective", pronunciation: "/pəˈspektɪv/", meaning: "A particular way of considering something.",
            example: "Consider the issue from another perspective.",
            alternatives: ["A precise measurement", "A past experience", "A point of view"], correctChoice: 2),
    ]

    func returningLearner(at date: Date) -> DemoSnapshot {
        var state = DemoSnapshot()
        state.signedIn = true
        state.onboardingCompleted = true
        state.onboardingStep = 5
        state.profile.name = "Yaroslav"
        state.profile.email = "yaroslav@example.com"
        state.profile.answers = OnboardingAnswers(
            startingBand: .confident, targetBand: 8, examPlan: .scheduled(Date(timeIntervalSince1970: 1_804_550_400)),
            focus: [.listening, .speaking], barrier: .time)
        state.seededHistory = true
        state.completedTasks = ["reading-8"]
        state.sessions["Reading-8"] = PracticeSession(
            id: "Reading-8", skill: .reading, testNumber: 8, question: 0, answers: ["previous": "TRUE"],
            elapsedSeconds: 1062)
        state.results = (0..<4).flatMap { week in
            Skill.allCases.map { skill in
                PracticeResult(
                    id: "history-\(week)-\(skill.rawValue)", skill: skill,
                    band: [6, 6, 6.5, 6.5][week] + (skill == .reading ? 0.5 : 0),
                    date: date.addingTimeInterval(Double(week - 3) * 7 * 86_400), isFullExam: false)
            }
        }
        return state
    }

    func response(to message: String, skill: Skill) -> String {
        switch skill {
        case .writing:
            "TASK 2 · INTRODUCTION\n\nStart with the issue, then state your position.\n\nTry: ‘While private cars offer flexibility, I believe cities should prioritise reliable public transport.’\n\nYour turn: add one reason that your first body paragraph will develop."
        case .speaking:
            "PART 2 · CUE CARD\n\nDescribe a place where you like to relax.\n\nSay where it is, when you go there and what you do. Then explain why it helps you relax.\n\nAim for one clear story with a specific detail. Ready for a two-minute rehearsal?"
        case .reading:
            "READING · FIND EVIDENCE\n\nLook at paragraph 2: ‘Their leaves cool the surrounding air.’\n\nThis supports TRUE. Match the meaning, not just repeated words.\n\nFor NOT GIVEN, the passage must leave the claim unanswered."
        case .listening:
            "LISTENING · NOTE COMPLETION\n\nBefore you listen, predict the type of answer: a name, a number or a place.\n\nIn ‘Membership: ___ per month’, expect a price. Check the word limit and spelling before moving on."
        }
    }

    func criteria(for skill: Skill) -> [(String, Double)] {
        switch skill {
        case .writing:
            [
                ("Task response", 6), ("Coherence & cohesion", 7), ("Lexical resource", 6.5),
                ("Grammatical range & accuracy", 6.5),
            ]
        case .speaking:
            [
                ("Fluency & coherence", 6.5), ("Lexical resource", 6.5), ("Grammatical range & accuracy", 6),
                ("Pronunciation", 7),
            ]
        case .reading:
            [("Finding evidence", 7), ("Understanding detail", 7), ("Matching information", 6.5), ("Inference", 6.5)]
        case .listening:
            [
                ("Note completion", 6.5), ("Recognising detail", 7), ("Following a conversation", 6.5),
                ("Spelling & word limits", 6),
            ]
        }
    }
}
