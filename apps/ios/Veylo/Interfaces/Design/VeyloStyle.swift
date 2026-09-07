import SwiftUI

enum VeyloStyle {
    static let paper = Color(hex: 0xFDFCFE)
    static let ink = Color(hex: 0x3C315B)
    static let muted = Color(hex: 0x6E667D)
    static let lavender = Color(hex: 0xE2DFFE)
    static let violet = Color(hex: 0x65548E)
    static let line = Color(hex: 0xE9E5F0)
    static let panel = Color(hex: 0xF3EFF9)
    static let accent = Color(hex: 0x9480DA)
    static let arcade = Color(hex: 0xE8F2F1)
    static let arcadeInk = Color(hex: 0x27776D)

    static func font(_ size: CGFloat, weight: Font.Weight = .regular) -> Font {
        let face: String
        switch weight {
        case .heavy: face = "ExtraBold"
        case .black: face = "Black"
        case .bold: face = "Bold"
        case .semibold: face = "SemiBold"
        case .medium: face = "Medium"
        default: face = "Regular"
        }
        return .custom("NunitoSans-12ptExtraLight_\(face)", size: size, relativeTo: size >= 24 ? .title2 : .body)
    }
}

extension Color {
    init(hex: UInt32) {
        self.init(
            .sRGB, red: Double((hex >> 16) & 255) / 255, green: Double((hex >> 8) & 255) / 255,
            blue: Double(hex & 255) / 255, opacity: 1)
    }
}

extension Skill {
    var symbol: String {
        switch self {
        case .reading: "book"
        case .listening: "headphones"
        case .writing: "pencil.and.outline"
        case .speaking: "mic"
        }
    }

    var surface: Color {
        switch self {
        case .reading: Color(hex: 0xEAF2FF)
        case .listening: Color(hex: 0xEEE8FC)
        case .writing: Color(hex: 0xFFE9EE)
        case .speaking: Color(hex: 0xFFF6CA)
        }
    }

    var accent: Color {
        switch self {
        case .reading: Color(hex: 0x2462C5)
        case .listening: Color(hex: 0x7458C4)
        case .writing: Color(hex: 0xB94F75)
        case .speaking: Color(hex: 0x9C7715)
        }
    }

    var ink: Color {
        switch self {
        case .reading: Color(hex: 0x183F77)
        case .listening: Color(hex: 0x514085)
        case .writing: Color(hex: 0x8A3555)
        case .speaking: Color(hex: 0x69500E)
        }
    }
}

enum Motion {
    static let selection = Animation.easeInOut(duration: 0.22)
    static let navigation = Animation.spring(response: 0.32, dampingFraction: 0.88)
    static let press = Animation.spring(response: 0.17, dampingFraction: 0.7)
    static let reveal = Animation.easeOut(duration: 0.6)
    static let reduced = Animation.easeOut(duration: 0.12)
}

struct PressStyle: ButtonStyle {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed && !reduceMotion ? 0.97 : 1)
            .opacity(configuration.isPressed ? 0.82 : 1)
            .animation(reduceMotion ? Motion.reduced : Motion.press, value: configuration.isPressed)
    }
}

struct GlassSurface: ViewModifier {
    @Environment(\.accessibilityReduceTransparency) private var reduceTransparency
    var tint: Color
    var radius: CGFloat

    func body(content: Content) -> some View {
        if reduceTransparency {
            content.background(tint, in: RoundedRectangle(cornerRadius: radius))
                .overlay(RoundedRectangle(cornerRadius: radius).stroke(VeyloStyle.line, lineWidth: 1))
        } else {
            content.glassEffect(.regular.tint(tint.opacity(0.32)).interactive(), in: .rect(cornerRadius: radius))
        }
    }
}

struct Reveal: ViewModifier {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var appeared = false
    var delay: Double

    func body(content: Content) -> some View {
        content.opacity(appeared ? 1 : 0)
            .offset(y: appeared || reduceMotion ? 0 : 12)
            .onAppear {
                guard !appeared else { return }
                withAnimation(reduceMotion ? Motion.reduced : Motion.reveal.delay(delay)) { appeared = true }
            }
    }
}

extension View {
    func veyloGlass(tint: Color = VeyloStyle.lavender, radius: CGFloat = 28) -> some View {
        modifier(GlassSurface(tint: tint, radius: radius))
    }

    func reveal(delay: Double = 0) -> some View { modifier(Reveal(delay: delay)) }

    func panel(_ color: Color = .white, radius: CGFloat = 24) -> some View {
        padding(20).frame(maxWidth: .infinity, alignment: .leading)
            .background(color, in: RoundedRectangle(cornerRadius: radius))
    }
}
