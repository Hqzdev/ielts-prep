import SwiftUI

struct SpeakingExercise: View {
    var elapsed: Int
    @Binding var phase: Int
    @Binding var isPlaying: Bool
    var topic: String

    var body: some View {
        VStack(alignment: .leading, spacing: 24) {
            ScreenHeading(
                title: phase == 2 ? "A little better already." : "Your turn to speak",
                subtitle: "1 minute to prepare · up to 2 minutes to talk")
            CueCard(topic: topic)
            HStack {
                Text(elapsed.clockText).font(VeyloStyle.font(44, weight: .heavy)).monospacedDigit()
                Spacer()
                Text(
                    phase == 2
                        ? "Ready to review"
                        : isPlaying ? phase == 0 ? "Preparing" : "● Recording" : "Ready when you are"
                )
                .font(VeyloStyle.font(13, weight: .bold)).foregroundStyle(Skill.writing.accent)
                .padding(12).background(Skill.writing.surface, in: Capsule())
            }
            Waveform(active: isPlaying, color: Skill.speaking.accent).frame(height: 42)
            if phase == 2 {
                VStack(alignment: .leading, spacing: 10) {
                    Text("Review your rehearsal").font(VeyloStyle.font(20, weight: .heavy))
                    Text(
                        "You explored a Part 2 cue card. In this demo, no audio is recorded. Open the sample feedback to see how your real review will look."
                    ).font(VeyloStyle.font(14)).foregroundStyle(VeyloStyle.muted)
                }.panel(Skill.speaking.surface).reveal()
            }
        }
    }
}

struct CueCard: View {
    var topic: String
    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Caption(text: "PART 2 · LONG TURN", color: Skill.speaking.ink)
            Text(topic).font(VeyloStyle.font(24, weight: .heavy))
            Text(details)
                .font(VeyloStyle.font(15)).lineSpacing(5)
        }.panel(Skill.speaking.surface).foregroundStyle(Skill.speaking.ink)
    }

    private var details: String {
        if topic.contains("skill") {
            return
                "You should say:\n• what the skill is\n• how you would learn it\n• when you would use it\nand explain why it matters to you."
        }
        if topic.contains("person") {
            return
                "You should say:\n• who the person is\n• how you know them\n• what they encouraged you to do\nand explain how their support helped you."
        }
        if topic.contains("journey") {
            return
                "You should say:\n• where you went\n• who you travelled with\n• what happened along the way\nand explain why you remember it."
        }
        return
            "You should say:\n• where it is\n• when you go there\n• what you do there\nand explain why you find it relaxing."
    }
}

struct Waveform: View {
    var active: Bool
    var color: Color = VeyloStyle.accent
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.scenePhase) private var scenePhase

    var body: some View {
        TimelineView(.animation(minimumInterval: 1 / 20, paused: !active || reduceMotion || scenePhase != .active)) {
            context in
            let time = active && !reduceMotion ? context.date.timeIntervalSinceReferenceDate : 0
            HStack(alignment: .center, spacing: 4) {
                ForEach(0..<28) { index in
                    Capsule().fill(color.opacity(active ? 0.8 : 0.25))
                        .frame(
                            width: 4,
                            height: active && !reduceMotion ? 8 + abs(sin(time * 4 + Double(index) * 0.8)) * 30 : 6)
                }
            }.frame(maxWidth: .infinity, maxHeight: .infinity)
        }.accessibilityHidden(true)
    }
}
