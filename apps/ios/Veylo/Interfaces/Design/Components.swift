import SwiftUI
import UIKit

struct BrandHeader: View {
    var body: some View {
        HStack(spacing: 8) {
            Mascot(size: 32)
            Text("Veylo").font(VeyloStyle.font(28, weight: .heavy))
            Spacer()
        }
        .accessibilityElement(children: .combine)
        .padding(.vertical, 6)
    }
}

struct Mascot: View {
    var size: CGFloat = 96
    var body: some View {
        Image("Vey").resizable().scaledToFit().frame(width: size, height: size)
            .accessibilityHidden(true)
    }
}

struct PrimaryButton: View {
    let title: String
    var symbol = "arrow.right"
    var color = VeyloStyle.ink
    var enabled = true
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 10) {
                Text(title).font(VeyloStyle.font(17, weight: .heavy))
                if !symbol.isEmpty { Image(systemName: symbol).font(.system(size: 16, weight: .semibold)) }
            }
            .foregroundStyle(enabled ? color : VeyloStyle.muted)
            .padding(.horizontal, 18).frame(maxWidth: .infinity).frame(minHeight: 54)
            .veyloGlass(tint: enabled ? VeyloStyle.lavender : VeyloStyle.line)
            .opacity(enabled ? 1 : 0.55)
            .contentShape(Capsule())
        }
        .buttonStyle(PressStyle()).disabled(!enabled)
        .accessibilityIdentifier(title)
    }
}

struct ScreenHeading: View {
    var title: String
    var subtitle: String
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title).font(VeyloStyle.font(28, weight: .heavy)).fixedSize(horizontal: false, vertical: true)
            if !subtitle.isEmpty {
                Text(subtitle).font(VeyloStyle.font(15)).foregroundStyle(VeyloStyle.muted)
            }
        }.frame(maxWidth: .infinity, alignment: .leading)
    }
}

struct SectionHeading: View {
    var title: String
    var body: some View {
        Text(title).font(VeyloStyle.font(20, weight: .heavy)).frame(maxWidth: .infinity, alignment: .leading)
    }
}

struct Caption: View {
    var text: String
    var color: Color = VeyloStyle.muted
    var body: some View { Text(text).font(VeyloStyle.font(11, weight: .heavy)).foregroundStyle(color) }
}

struct SkillBadge: View {
    var skill: Skill
    var size: CGFloat = 40
    var body: some View {
        Image(systemName: skill.symbol).font(.system(size: size * 0.44, weight: .medium))
            .foregroundStyle(skill.accent).frame(width: size, height: size)
            .background(skill.surface, in: RoundedRectangle(cornerRadius: 12))
            .accessibilityHidden(true)
    }
}

struct ActionRow: View {
    var title: String
    var subtitle: String = ""
    var symbol: String
    var color: Color = VeyloStyle.violet
    var surface: Color = VeyloStyle.panel
    var trailing = "chevron.right"
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 12) {
                Image(systemName: symbol).font(.system(size: 20)).foregroundStyle(color)
                    .frame(width: 40, height: 42).background(surface, in: RoundedRectangle(cornerRadius: 12))
                VStack(alignment: .leading, spacing: 4) {
                    Text(title).font(VeyloStyle.font(16, weight: .bold))
                    if !subtitle.isEmpty { Text(subtitle).font(VeyloStyle.font(13)).foregroundStyle(VeyloStyle.muted) }
                }
                Spacer(minLength: 0)
                Image(systemName: trailing).font(.system(size: 13)).foregroundStyle(color)
            }
            .padding(14).frame(maxWidth: .infinity, alignment: .leading)
            .background(.white, in: RoundedRectangle(cornerRadius: 22))
            .overlay(RoundedRectangle(cornerRadius: 22).stroke(VeyloStyle.line, lineWidth: 1))
            .contentShape(RoundedRectangle(cornerRadius: 22))
        }.buttonStyle(PressStyle()).accessibilityIdentifier(title)
    }
}

struct PageScroll<Content: View>: View {
    @ViewBuilder var content: Content
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 22) { content }
                .padding(.horizontal, 24).padding(.top, 8).padding(.bottom, 24)
                .frame(maxWidth: 560).frame(maxWidth: .infinity)
        }
        .scrollIndicators(.hidden)
        .background(VeyloStyle.paper)
        .scrollDismissesKeyboard(.interactively)
        .toolbar {
            ToolbarItemGroup(placement: .keyboard) {
                Spacer()
                Button("Done") {
                    UIApplication.shared.sendAction(
                        #selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil)
                }.accessibilityIdentifier("Dismiss keyboard")
            }
        }
    }
}

struct StickyFooter<Content: View>: View {
    @ViewBuilder var content: Content
    var body: some View {
        VStack(spacing: 10) { content }.padding(.horizontal, 24).padding(.vertical, 12)
            .frame(maxWidth: 560).frame(maxWidth: .infinity)
            .background(VeyloStyle.paper.opacity(0.97))
    }
}

struct SelectionCard: View {
    var title: String
    var selected: Bool
    var color: Color = VeyloStyle.accent
    var surface: Color = Skill.listening.surface
    var action: () -> Void
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        Button(action: action) {
            HStack(spacing: 10) {
                Text(title).font(VeyloStyle.font(15, weight: .bold)).multilineTextAlignment(.leading)
                Spacer(minLength: 0)
                if selected { Image(systemName: "checkmark").foregroundStyle(color).transition(.opacity) }
            }
            .padding(.horizontal, 16).padding(.vertical, 14).frame(minHeight: 54)
            .background(selected ? surface : .white, in: RoundedRectangle(cornerRadius: 16))
            .overlay(
                RoundedRectangle(cornerRadius: 16).stroke(
                    selected ? color : VeyloStyle.line, lineWidth: selected ? 1.5 : 1))
        }
        .buttonStyle(PressStyle()).animation(reduceMotion ? Motion.reduced : Motion.selection, value: selected)
        .accessibilityAddTraits(selected ? .isSelected : []).accessibilityIdentifier(title)
    }
}

struct BandSelector: View {
    @Binding var selection: Double?
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    var body: some View {
        HStack(spacing: 8) {
            ForEach(OnboardingAnswers.targets, id: \.self) { band in
                Button {
                    selection = band
                } label: {
                    Text(band.formatted(.number.precision(.fractionLength(1))))
                        .font(VeyloStyle.font(16, weight: .heavy)).lineLimit(1).minimumScaleFactor(0.8)
                        .frame(maxWidth: .infinity, minHeight: 52)
                        .background(
                            selection == band ? Skill.listening.surface : .white, in: RoundedRectangle(cornerRadius: 16)
                        )
                        .overlay(
                            RoundedRectangle(cornerRadius: 16).stroke(
                                selection == band ? VeyloStyle.accent : VeyloStyle.line, lineWidth: 1.5))
                }.buttonStyle(PressStyle()).accessibilityIdentifier("band-\(band)")
                    .accessibilityAddTraits(selection == band ? .isSelected : [])
            }
        }.animation(reduceMotion ? Motion.reduced : Motion.selection, value: selection)
    }
}

struct LabeledInput: View {
    var label: String
    var placeholder: String
    var symbol: String
    @Binding var text: String
    var secure = false

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(label).font(VeyloStyle.font(14, weight: .bold))
            HStack(spacing: 12) {
                Image(systemName: symbol).foregroundStyle(VeyloStyle.violet)
                if secure {
                    SecureField(placeholder, text: $text).textContentType(.password).accessibilityIdentifier(label)
                } else {
                    TextField(placeholder, text: $text).accessibilityIdentifier(label)
                        .textInputAutocapitalization(label == "Name" ? .words : .never)
                        .autocorrectionDisabled(label != "Name")
                        .keyboardType(label == "Email" ? .emailAddress : .default)
                }
            }
            .font(VeyloStyle.font(16)).padding(.horizontal, 16).frame(minHeight: 56)
            .background(.white, in: RoundedRectangle(cornerRadius: 18))
            .overlay(RoundedRectangle(cornerRadius: 18).stroke(VeyloStyle.lavender, lineWidth: 1))
        }
    }
}
