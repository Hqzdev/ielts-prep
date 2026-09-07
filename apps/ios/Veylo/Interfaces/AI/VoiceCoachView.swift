import SwiftUI

struct VoiceCoachView: View {
    var personality: String
    @Environment(AppModel.self) private var model
    @Environment(AppRouter.self) private var router
    @Environment(\.scenePhase) private var scenePhase
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var part = 2
    @State private var phase = "Prepare"
    @State private var seconds = 0
    @State private var active = false
    @State private var muted = false

    var body: some View {
        PageScroll {
            Picker("Speaking part", selection: $part) {
                ForEach(1...3, id: \.self) { Text("Part \($0)").tag($0) }
            }.pickerStyle(.segmented).onChange(of: part) { _, _ in restart() }
            if part == 2 {
                CueCard(topic: model.content.speakingTopics[0])
            } else {
                VStack(alignment: .leading, spacing: 12) {
                    Caption(
                        text: "PART \(part) · \(part == 1 ? "INTRODUCTION" : "DISCUSSION")", color: Skill.speaking.ink)
                    Text(
                        part == 1
                            ? "What do you enjoy about the place where you live?"
                            : "Why is it important for cities to have quiet public spaces?"
                    )
                    .font(VeyloStyle.font(24, weight: .heavy))
                    Text(
                        part == 1
                            ? "Give a direct answer, then add a personal detail."
                            : "Consider different perspectives. Explain your reasons and give an example."
                    )
                    .font(VeyloStyle.font(15))
                }.panel(Skill.speaking.surface).foregroundStyle(Skill.speaking.ink)
            }
            Picker("Speaking phase", selection: $phase) {
                ForEach(["Prepare", "Speak", "Review"], id: \.self) { Text($0).tag($0) }
            }.pickerStyle(.segmented).onChange(of: phase) { _, _ in
                active = false
                seconds = 0
            }
            HStack(spacing: 16) {
                Mascot(size: 64)
                VStack(alignment: .leading, spacing: 6) {
                    Text("\(seconds.clockText) / \(phase == "Prepare" ? "01:00" : "02:00")")
                        .font(VeyloStyle.font(24, weight: .heavy)).monospacedDigit().foregroundStyle(Skill.speaking.ink)
                    Text(
                        phase == "Review"
                            ? "Ready for your sample feedback"
                            : active ? "Vey is listening to your demo answer" : "Take your time. You're in control."
                    )
                    .font(VeyloStyle.font(12)).foregroundStyle(VeyloStyle.muted)
                }
            }
            Waveform(active: active && !muted, color: Skill.speaking.accent).frame(height: 40)
            if personality != "Examiner" && phase != "Review" {
                VStack(alignment: .leading, spacing: 8) {
                    Caption(text: "COACH MODE · IF YOU GET STUCK", color: Skill.speaking.ink)
                    Text("Explain why this place helps you relax.").font(VeyloStyle.font(17, weight: .bold))
                }.panel(Skill.speaking.surface).reveal()
            }
            VStack(alignment: .leading, spacing: 8) {
                Caption(text: "AFTER YOUR ANSWER")
                Text("Fluency · Vocabulary · Grammar · Pronunciation").font(VeyloStyle.font(12)).foregroundStyle(
                    VeyloStyle.muted)
            }
            if phase == "Review" {
                Text(
                    "Your answer has a clear direction. In a real session, Vey will use your recording to suggest a specific next step. This preview opens a sample IELTS review."
                )
                .font(VeyloStyle.font(14)).panel(Skill.speaking.surface).reveal()
            }
        }
        .safeAreaInset(edge: .bottom) {
            StickyFooter {
                PrimaryButton(
                    title: phase == "Review"
                        ? "Finish & get feedback"
                        : active ? "Finish answer" : phase == "Prepare" ? "Start preparation" : "Start speaking",
                    symbol: phase == "Review" ? "checkmark" : active ? "stop" : "mic"
                ) {
                    if phase == "Review" {
                        let id = model.startPractice(.speaking, number: 2, restart: true)
                        if let result = model.submit(id) { router.path.append(.result(result)) }
                    } else if active {
                        active = false
                        phase = phase == "Prepare" ? "Speak" : "Review"
                    } else {
                        active = true
                    }
                }
                HStack {
                    Button {
                        muted.toggle()
                    } label: {
                        Label(muted ? "Unmute" : "Mute", systemImage: muted ? "mic.slash" : "mic")
                    }
                    Spacer()
                    Button {
                        restart()
                    } label: {
                        Label("Restart answer", systemImage: "arrow.counterclockwise")
                    }
                }.font(VeyloStyle.font(13)).padding(.horizontal, 18).frame(minHeight: 44)
                Text("Simulated voice session · microphone is off").font(VeyloStyle.font(10)).foregroundStyle(
                    VeyloStyle.muted)
            }
        }
        .navigationTitle("IELTS Speaking").navigationBarTitleDisplayMode(.inline).toolbar(.visible, for: .navigationBar)
        .onChange(of: scenePhase) { _, state in if state != .active { active = false } }
        .onDisappear { active = false }
        .task(id: active) {
            guard active else { return }
            do {
                while !Task.isCancelled {
                    try await Task.sleep(for: .seconds(1))
                    seconds += 1
                    if seconds >= (phase == "Prepare" ? 60 : 120) {
                        active = false
                        phase = phase == "Prepare" ? "Speak" : "Review"
                    }
                }
            } catch {}
        }
        .animation(reduceMotion ? Motion.reduced : Motion.selection, value: phase)
    }

    private func restart() {
        active = false
        seconds = 0
        phase = "Prepare"
        muted = false
    }
}
