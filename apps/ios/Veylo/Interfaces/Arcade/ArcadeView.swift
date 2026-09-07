import SwiftUI

struct ArcadeView: View {
    @Environment(AppModel.self) private var model
    @Environment(AppRouter.self) private var router

    var body: some View {
        PageScroll {
            VStack(alignment: .leading, spacing: 16) {
                Image(systemName: "gamecontroller").font(.system(size: 32))
                Text("Play your way\nto better English.").font(VeyloStyle.font(28, weight: .heavy))
                Text("Short rounds. Useful skills. A little fun.").font(VeyloStyle.font(15)).foregroundStyle(
                    VeyloStyle.muted)
            }.panel(VeyloStyle.arcade).reveal()
            SectionHeading(title: "Pick a quick game")
            VStack(spacing: 10) {
                ForEach(ArcadeGame.allCases) { game in
                    ActionRow(
                        title: game.rawValue, subtitle: game.subtitle, symbol: game.symbol, color: game.color,
                        surface: game.surface, trailing: "play"
                    ) {
                        router.path.append(.game(game))
                    }
                }
            }.reveal(delay: 0.08)
            VStack(alignment: .leading, spacing: 10) {
                Text("Today's challenge").font(VeyloStyle.font(20, weight: .heavy))
                Text("Complete a round without losing a heart.").font(VeyloStyle.font(14))
            }.panel(Color(hex: 0xE4F7EF)).foregroundStyle(VeyloStyle.arcadeInk)
            if !model.snapshot.arcadeBestScores.isEmpty {
                SectionHeading(title: "Your personal bests")
                ForEach(ArcadeGame.allCases) { game in
                    if let score = model.snapshot.arcadeBestScores[game.rawValue] {
                        HStack {
                            Text(game.rawValue)
                            Spacer()
                            Text("\(score) points").bold()
                        }.font(VeyloStyle.font(15))
                    }
                }
            }
        }.navigationTitle("Arcade").navigationBarTitleDisplayMode(.inline).toolbar(.visible, for: .navigationBar)
    }
}

extension ArcadeGame {
    var symbol: String {
        switch self {
        case .wordSprint: "bolt"
        case .speakingShuffle: "mic"
        case .listenMatch: "headphones"
        }
    }
    var subtitle: String {
        switch self {
        case .wordSprint: "Match meanings · 2 minutes"
        case .speakingShuffle: "Surprise prompts · 3 minutes"
        case .listenMatch: "Train your ear · 2 minutes"
        }
    }
    var color: Color {
        switch self {
        case .wordSprint: VeyloStyle.arcadeInk
        case .speakingShuffle: Skill.speaking.accent
        case .listenMatch: Skill.listening.accent
        }
    }
    var surface: Color {
        switch self {
        case .wordSprint: VeyloStyle.arcade
        case .speakingShuffle: Skill.speaking.surface
        case .listenMatch: Skill.listening.surface
        }
    }
}
