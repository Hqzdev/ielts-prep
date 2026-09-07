import SwiftUI

struct ArcadeGameView: View {
    let game: ArcadeGame
    @Environment(AppModel.self) private var model
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.scenePhase) private var scenePhase
    @State private var round = 0
    @State private var selection: Int?
    @State private var lives = 3
    @State private var score = 0
    @State private var seconds = 0
    @State private var complete = false
    @State private var isPlaying = false
    @State private var showPhrase = false
    @State private var answerReady = false

    private var word: VocabularyWord { model.content.vocabulary[round % model.content.vocabulary.count] }
    private var roundCount: Int { game == .wordSprint ? 10 : game == .speakingShuffle ? 4 : 5 }
    private var choices: [String] {
        if game == .listenMatch {
            return ["Tuesday at six thirty", "Thursday at six thirty", "Tuesday at seven thirty"]
        }
        return word.alternatives + ["Extremely expensive"]
    }
    private var correctChoice: Int { game == .listenMatch ? round % 3 : word.correctChoice }

    var body: some View {
        PageScroll {
            HStack {
                Caption(text: complete ? "ROUND COMPLETE" : "ROUND \(round + 1) OF \(roundCount)", color: game.color)
                Spacer()
                Text("\(lives) hearts · \(seconds.clockText)").font(VeyloStyle.font(12, weight: .bold))
                    .monospacedDigit()
            }
            if complete {
                VStack(spacing: 18) {
                    Mascot(size: 116)
                    Text(lives == 0 ? "A little practice goes a long way." : "Look at you go!")
                        .font(VeyloStyle.font(30, weight: .heavy)).multilineTextAlignment(.center)
                    Text("\(score)").font(VeyloStyle.font(76, weight: .black)).foregroundStyle(game.color)
                    Text("points earned").font(VeyloStyle.font(16))
                    Text("Your best: \(model.snapshot.arcadeBestScores[game.rawValue] ?? score) points")
                        .font(VeyloStyle.font(14)).foregroundStyle(VeyloStyle.muted)
                }.frame(maxWidth: .infinity).panel(game.surface).reveal()
            } else if game == .speakingShuffle {
                CueCard(topic: model.content.speakingTopics[round % model.content.speakingTopics.count])
                Text(
                    isPlaying
                        ? "Keep talking. One clear example is enough."
                        : answerReady
                            ? "Nice rehearsal. Ready for a new prompt?"
                            : "A surprise prompt. A short answer. Your turn."
                )
                .font(VeyloStyle.font(18, weight: .bold))
                Waveform(active: isPlaying, color: game.color).frame(height: 50)
                Button {
                    round = (round + 1) % roundCount
                    answerReady = false
                    isPlaying = false
                } label: {
                    Label("Shuffle prompt", systemImage: "shuffle").font(VeyloStyle.font(15, weight: .bold)).frame(
                        minHeight: 44)
                }
                Text("Speaking demo · no audio is recorded").font(VeyloStyle.font(12)).foregroundStyle(VeyloStyle.muted)
            } else {
                VStack(spacing: 18) {
                    Image(systemName: game.symbol).font(.system(size: 34))
                    Text(game == .wordSprint ? word.id.lowercased() : "Catch the detail")
                        .font(VeyloStyle.font(36, weight: .heavy)).minimumScaleFactor(0.75).lineLimit(1)
                    Text(
                        game == .wordSprint
                            ? "Choose the closest meaning" : "Read the demo phrase, then match it below."
                    )
                    .font(VeyloStyle.font(14)).foregroundStyle(VeyloStyle.muted)
                    if game == .listenMatch {
                        Button {
                            showPhrase = true
                            isPlaying = true
                        } label: {
                            Label("Play demo phrase", systemImage: "play.fill").font(VeyloStyle.font(15, weight: .bold))
                                .frame(minHeight: 44)
                        }
                        if showPhrase {
                            Text(choices[correctChoice]).font(VeyloStyle.font(20, weight: .heavy)).transition(.opacity)
                        }
                        Waveform(active: isPlaying, color: game.color).frame(height: 34)
                    }
                }.frame(maxWidth: .infinity).panel(game.surface).foregroundStyle(game.color)
                VStack(spacing: 10) {
                    ForEach(Array(choices.enumerated()), id: \.offset) { index, choice in
                        SelectionCard(
                            title: "\(String(UnicodeScalar(65 + index)!))  \(choice)", selected: selection == index,
                            color: selection == index
                                ? index == correctChoice ? Color(hex: 0x1A9771) : Skill.writing.accent : game.color,
                            surface: index == correctChoice ? Color(hex: 0xE4F7EF) : Skill.writing.surface
                        ) {
                            answer(index)
                        }.disabled(selection != nil).accessibilityIdentifier("Game answer \(index)")
                    }
                }
                if let selection {
                    Label(
                        selection == correctChoice
                            ? "Exactly! Keep that one." : "The answer is: \(choices[correctChoice])",
                        systemImage: selection == correctChoice ? "checkmark.circle.fill" : "heart.slash"
                    )
                    .font(VeyloStyle.font(14, weight: .bold)).foregroundStyle(
                        selection == correctChoice ? VeyloStyle.arcadeInk : Skill.writing.accent
                    )
                    .transition(.opacity)
                }
            }
        }
        .safeAreaInset(edge: .bottom) {
            StickyFooter {
                PrimaryButton(title: buttonTitle, enabled: complete || game == .speakingShuffle || selection != nil) {
                    if complete {
                        reset()
                    } else if game == .speakingShuffle && !answerReady {
                        if isPlaying {
                            isPlaying = false
                            answerReady = true
                            score += 10
                        } else {
                            isPlaying = true
                        }
                    } else {
                        next()
                    }
                }
            }
        }
        .navigationTitle(game.rawValue).navigationBarTitleDisplayMode(.inline).toolbar(.visible, for: .navigationBar)
        .animation(reduceMotion ? Motion.reduced : Motion.selection, value: selection)
        .animation(reduceMotion ? Motion.reduced : Motion.navigation, value: complete)
        .onChange(of: scenePhase) { _, phase in if phase != .active { isPlaying = false } }
        .task(id: scenePhase) {
            guard scenePhase == .active else { return }
            do {
                while !Task.isCancelled {
                    try await Task.sleep(for: .seconds(1))
                    if !complete { seconds += 1 }
                }
            } catch {}
        }
        .task(id: showPhrase) {
            guard showPhrase else { return }
            do {
                try await Task.sleep(for: .seconds(3))
                showPhrase = false
                isPlaying = false
            } catch {}
        }
        .onDisappear { isPlaying = false }
    }

    private var buttonTitle: String {
        if complete { return "Play again" }
        if game == .speakingShuffle && !answerReady { return isPlaying ? "Finish rehearsal" : "Start speaking" }
        return lives == 0 || round + 1 == roundCount ? "See my score" : game == .wordSprint ? "Next word" : "Next round"
    }
    private func answer(_ index: Int) {
        guard selection == nil else { return }
        selection = index
        if index == correctChoice {
            score += 10
            if game == .wordSprint { model.update { $0.learnedWords.insert(word.id) } }
        } else {
            lives = max(0, lives - 1)
        }
    }
    private func next() {
        withAnimation(reduceMotion ? Motion.reduced : Motion.navigation) {
            if lives == 0 || round + 1 == roundCount {
                complete = true
                model.update {
                    $0.arcadeBestScores[game.rawValue] = max($0.arcadeBestScores[game.rawValue] ?? 0, score)
                }
            } else {
                round += 1
                selection = nil
                answerReady = false
                showPhrase = false
                isPlaying = false
            }
        }
    }
    private func reset() {
        round = 0
        selection = nil
        lives = 3
        score = 0
        seconds = 0
        complete = false
        isPlaying = false
        showPhrase = false
        answerReady = false
    }
}
