import SwiftUI

struct ListeningExercise: View {
    var session: PracticeSession
    @Binding var elapsed: Int
    @Binding var isPlaying: Bool
    var openTranscript: () -> Void
    @Environment(AppModel.self) private var model
    @FocusState private var focusedQuestion: Int?
    private let labels = ["Membership type", "Preferred day", "Start time"]

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            VStack(spacing: 12) {
                Label("A booking at the sports centre", systemImage: "headphones").font(
                    VeyloStyle.font(17, weight: .heavy))
                ProgressView(value: min(Double(elapsed), 266), total: 266).tint(Skill.listening.accent)
                HStack {
                    Button {
                        elapsed = max(0, elapsed - 10)
                    } label: {
                        Label("10s", systemImage: "gobackward.10").font(VeyloStyle.font(13))
                    }.frame(minWidth: 44, minHeight: 44)
                    Spacer()
                    Button {
                        isPlaying.toggle()
                    } label: {
                        Image(systemName: isPlaying ? "pause.fill" : "play.fill").frame(width: 44, height: 44)
                            .veyloGlass(tint: .white, radius: 22)
                    }.accessibilityLabel(isPlaying ? "Pause demo audio" : "Play demo audio")
                    Spacer()
                    Text("\(elapsed.clockText) / 04:26").font(VeyloStyle.font(12, weight: .bold)).monospacedDigit()
                }
            }.panel(Skill.listening.surface).foregroundStyle(Skill.listening.ink)
            VStack(alignment: .leading, spacing: 5) {
                Caption(text: "QUESTIONS 1–3 · NOTE COMPLETION", color: Skill.listening.accent)
                Text("ONE WORD AND/OR A NUMBER").font(VeyloStyle.font(12, weight: .heavy))
            }
            VStack(alignment: .leading, spacing: 18) {
                Caption(text: "RIVERSIDE SPORTS CENTRE", color: Skill.listening.ink)
                Text("Membership enquiry").font(VeyloStyle.font(22, weight: .heavy))
                ForEach(0..<3) { index in
                    HStack(alignment: .top, spacing: 12) {
                        Text("\(index + 1)").font(VeyloStyle.font(14, weight: .bold)).foregroundStyle(
                            Skill.listening.accent
                        ).padding(.top, 3)
                        VStack(alignment: .leading, spacing: 8) {
                            Text(labels[index]).font(VeyloStyle.font(13, weight: .bold))
                            TextField(
                                "Your answer",
                                text: Binding(
                                    get: { model.snapshot.sessions[session.id]?.answers[String(index)] ?? "" },
                                    set: { value in
                                        model.editSession(session.id) {
                                            $0.answers[String(index)] = value
                                            $0.question = index
                                        }
                                    })
                            )
                            .font(VeyloStyle.font(15)).padding(12).frame(minHeight: 46)
                            .background(
                                focusedQuestion == index ? Skill.listening.surface : VeyloStyle.paper,
                                in: RoundedRectangle(cornerRadius: 10)
                            )
                            .overlay(
                                RoundedRectangle(cornerRadius: 10).stroke(
                                    focusedQuestion == index ? Skill.listening.accent : VeyloStyle.line, lineWidth: 1)
                            )
                            .focused($focusedQuestion, equals: index).autocorrectionDisabled()
                            .accessibilityIdentifier("Listening answer \(index + 1)")
                        }
                    }
                }
            }.panel(.white).overlay(RoundedRectangle(cornerRadius: 24).stroke(VeyloStyle.line))
            HStack(alignment: .top, spacing: 10) {
                Image(systemName: "flag").foregroundStyle(Skill.listening.accent)
                Text("Missed a detail? Mark it and keep listening. You can return in practice mode.").font(
                    VeyloStyle.font(13)
                ).foregroundStyle(VeyloStyle.muted)
            }
            Button("Read demo transcript") { openTranscript() }.font(VeyloStyle.font(13, weight: .bold)).frame(
                minHeight: 44)
            Text("Visual audio preview · use the transcript for answers").font(VeyloStyle.font(11)).foregroundStyle(
                VeyloStyle.muted)
        }
        .onChange(of: session.question) { _, value in focusedQuestion = value }
    }
}
