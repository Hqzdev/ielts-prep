import Foundation

extension DemoContent {
    func feedback(for skill: Skill, criterion: String) -> String {
        if skill == .speaking && criterion == "Lexical resource" {
            return
                "Use precise, natural phrases such as ‘a quiet spot’ and ‘clear my head’. Describe one detail you can see or hear, then explain why it matters to you."
        }
        if skill == .speaking && criterion == "Grammatical range & accuracy" {
            return
                "Move clearly between a past visit and your usual routine. Try ‘Although it was busy, I found a quiet corner’, and keep verb tenses consistent within each idea."
        }
        let notes: [String: String] = [
            "Task response":
                "Your position is clear. The public transport argument needs development: explain who benefits and add an example, such as a commuter reaching a new job without a car.",
            "Coherence & cohesion":
                "The ideas follow a logical order. Give each paragraph one purpose and use references such as ‘this investment’ to connect sentences without repeating ‘firstly’ and ‘secondly’.",
            "Lexical resource":
                "Your vocabulary communicates the main idea. Practise precise combinations such as ‘reliable public transport’ and ‘reduce traffic congestion’. Accuracy matters more than rare words.",
            "Grammatical range & accuracy":
                "The simple sentences are clear. Add a controlled contrast using ‘although’ or ‘while’, then check articles and subject–verb agreement before submitting.",
            "Fluency & coherence":
                "Your answer has a clear direction. Develop one example for a few sentences. Pause between ideas rather than in the middle of a phrase.",
            "Pronunciation":
                "Keep important words prominent. Rehearse ‘a quiet place to relax’ in natural groups, stressing ‘quiet’ and ‘relax’ rather than every word equally.",
            "Finding evidence":
                "Paragraph 2 directly supports the statement about cooling the air. Highlight the shortest phrase that proves your choice before moving on.",
            "Understanding detail":
                "The passage distinguishes shade from transpiration. Compare the complete statement with the source; a familiar keyword alone is not proof.",
            "Matching information":
                "Give each paragraph a short summary: shade, transpiration, and long-term care. Use those summaries to locate details quickly.",
            "Inference":
                "The passage does not compare maintenance costs between cities. Choose NOT GIVEN when a comparison is absent, even if one option sounds plausible.",
            "Note completion":
                "Predict the answer type before playback. ‘Preferred day’ needs a day; ‘Start time’ needs a time. This makes the relevant detail easier to catch.",
            "Recognising detail":
                "Watch for corrections in a conversation. A speaker may mention an option before choosing a different one. Record the final confirmed detail.",
            "Following a conversation":
                "Follow the receptionist's question to anticipate the caller's answer. If you miss a word, mark the gap and keep listening.",
            "Spelling & word limits":
                "Use ‘Tuesday’ for the day and ‘6:30’ for the time. Check that each response respects ONE WORD AND/OR A NUMBER.",
        ]
        return notes[criterion] ?? "Return to the task and support each answer with a clear example."
    }
}
