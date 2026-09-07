import Charts
import SwiftUI

struct ProgressScreen: View {
    @Environment(AppModel.self) private var model
    @Environment(AppRouter.self) private var router
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var period = "Month"
    @State private var focusedSkill: Skill?
    private let periods = ["Week", "Month", "3 months", "All time"]
    private var trend: ProgressTrend {
        let days = period == "Week" ? 7 : period == "Month" ? 31 : period == "3 months" ? 93 : nil
        return ProgressTrend(
            results: model.snapshot.results, target: model.target, skill: focusedSkill,
            since: days.map { Date().addingTimeInterval(-Double($0) * 86_400) })
    }
    private var enoughData: Bool { trend.hasEnoughData }

    var body: some View {
        PageScroll {
            BrandHeader()
            ScreenHeading(title: "Look how far you've come", subtitle: "Small wins, lasting progress.").reveal()
            Picker("Period", selection: $period) {
                ForEach(periods, id: \.self) { Text($0).tag($0) }
            }.pickerStyle(.segmented).accessibilityIdentifier("Progress period")
            VStack(alignment: .leading, spacing: 18) {
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 8) {
                        Caption(text: "ESTIMATED BAND", color: VeyloStyle.violet)
                        Text(enoughData ? bandText(trend.currentBand) : "—").font(VeyloStyle.font(44, weight: .heavy))
                    }
                    Spacer()
                    VStack(alignment: .trailing, spacing: 5) {
                        Text(
                            enoughData
                                ? "\(trend.change >= 0 ? "+" : "")\(bandText(trend.change)) this period"
                                : "Your story starts here")
                        Text("Target \(model.target.formatted(.number.precision(.fractionLength(1))))")
                    }.font(VeyloStyle.font(12, weight: .bold)).foregroundStyle(VeyloStyle.violet).padding(.top, 22)
                }
                if enoughData {
                    ForecastChart(trend: trend)
                    Divider().overlay(VeyloStyle.lavender)
                    Caption(text: "PREDICTED GOAL WINDOW", color: VeyloStyle.violet)
                    Text(
                        trend.targetReached
                            ? "Target reached in this demo"
                            : trend.projectedDate.map { "Around \($0.formatted(.dateTime.month(.wide).year()))" }
                                ?? "Still finding your rhythm"
                    )
                    .font(VeyloStyle.font(22, weight: .heavy))
                    Text(
                        trend.projectedDate == nil
                            ? "More sessions over time will make the trend clearer."
                            : "At the pace shown by these sample results"
                    )
                    .font(VeyloStyle.font(13))
                    Text("Illustrative forecast from local demo scores, not an assessment or a guaranteed date.")
                        .font(VeyloStyle.font(11)).foregroundStyle(VeyloStyle.muted)
                } else {
                    Image(systemName: "chart.xyaxis.line").font(.system(size: 50, weight: .light)).foregroundStyle(
                        VeyloStyle.accent
                    )
                    .frame(maxWidth: .infinity, minHeight: 120)
                    Text("A few sessions will reveal your path.").font(VeyloStyle.font(20, weight: .heavy))
                    Text(
                        "Complete three practice sessions to explore the demo forecast. No score or date is estimated yet."
                    )
                    .font(VeyloStyle.font(14)).foregroundStyle(VeyloStyle.muted)
                    PrimaryButton(title: "Start a practice") {
                        router.path.append(.practice(model.startPractice(.reading)))
                    }
                }
            }.panel(Skill.listening.surface).reveal(delay: 0.08)
            SectionHeading(title: "Your skills")
            VStack(spacing: 10) {
                ForEach(Skill.allCases) { skill in
                    ActionRow(
                        title: skill.rawValue, subtitle: skillSubtitle(skill), symbol: skill.symbol,
                        color: skill.accent, surface: skill.surface,
                        trailing: focusedSkill == skill ? "checkmark" : "chevron.right"
                    ) {
                        withAnimation(reduceMotion ? Motion.reduced : Motion.selection) {
                            focusedSkill = focusedSkill == skill ? nil : skill
                        }
                    }
                }
            }
            if let focusedSkill {
                VStack(alignment: .leading, spacing: 12) {
                    SectionHeading(title: "Your \(focusedSkill.rawValue.lowercased()) focus")
                    Text(
                        "Build confidence with one focused task. Your local practice results stay in your progress history."
                    ).font(VeyloStyle.font(14))
                    PrimaryButton(title: "Practise \(focusedSkill.rawValue.lowercased())") {
                        router.path.append(.practice(model.startPractice(focusedSkill)))
                    }
                }.panel(focusedSkill.surface).transition(.opacity)
            }
            Button {
                router.path.append(.ai)
            } label: {
                Label("Your next training idea starts with Vey.\nPractise at your own pace.", systemImage: "sparkles")
                    .font(VeyloStyle.font(13, weight: .semibold)).frame(maxWidth: .infinity, alignment: .leading)
                    .padding(16)
                    .background(Skill.listening.surface, in: RoundedRectangle(cornerRadius: 18))
            }.buttonStyle(PressStyle())
            if !model.snapshot.results.isEmpty {
                SectionHeading(title: "Recent practice")
                ForEach(model.snapshot.results.reversed().prefix(6)) { result in
                    ActionRow(
                        title:
                            "\(result.skill.rawValue) · \(result.band.formatted(.number.precision(.fractionLength(1))))",
                        subtitle: "Sample result · \(result.date.formatted(date: .abbreviated, time: .omitted))",
                        symbol: result.skill.symbol, color: result.skill.accent, surface: result.skill.surface
                    ) {
                        router.path.append(.result(result))
                    }
                }
            }
        }
    }

    private func skillSubtitle(_ skill: Skill) -> String {
        guard let result = model.snapshot.results.last(where: { $0.skill == skill }) else {
            return "Your first session is waiting"
        }
        return "\(bandText(result.band)) · Latest sample result"
    }
    private func bandText(_ value: Double?) -> String {
        value?.formatted(.number.precision(.fractionLength(1))) ?? "—"
    }
}

struct ForecastChart: View {
    var trend: ProgressTrend
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var appeared = false
    @State private var selected: Date?
    private var baseline: Double { trend.points.first?.band ?? 5 }
    private var selectedPoint: ProgressPoint? {
        guard let selected else { return nil }
        return trend.points.min { abs($0.date.timeIntervalSince(selected)) < abs($1.date.timeIntervalSince(selected)) }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Chart {
                RuleMark(y: .value("Target", trend.target)).foregroundStyle(VeyloStyle.violet.opacity(0.5)).lineStyle(
                    StrokeStyle(lineWidth: 1, dash: [3, 3]))
                ForEach(trend.points) { point in
                    LineMark(
                        x: .value("Date", point.date),
                        y: .value("Band", appeared || reduceMotion ? point.band : baseline),
                        series: .value("Series", "Results")
                    )
                    .foregroundStyle(VeyloStyle.accent).lineStyle(StrokeStyle(lineWidth: 2.5))
                    PointMark(
                        x: .value("Date", point.date),
                        y: .value("Band", appeared || reduceMotion ? point.band : baseline)
                    )
                    .foregroundStyle(VeyloStyle.accent).symbolSize(20)
                }
                if let end = trend.projectedDate, let last = trend.points.last {
                    ForEach([last, ProgressPoint(date: end, band: trend.target)]) { point in
                        LineMark(
                            x: .value("Date", point.date),
                            y: .value("Band", appeared || reduceMotion ? point.band : baseline),
                            series: .value("Series", "Forecast")
                        ).foregroundStyle(VeyloStyle.violet).lineStyle(StrokeStyle(lineWidth: 1.5, dash: [4, 4]))
                    }
                    PointMark(
                        x: .value("Goal", end), y: .value("Band", appeared || reduceMotion ? trend.target : baseline)
                    )
                    .foregroundStyle(Color(hex: 0x35A98B)).symbolSize(45)
                }
                if let point = selectedPoint {
                    RuleMark(x: .value("Selected practice", point.date)).foregroundStyle(
                        VeyloStyle.violet.opacity(0.25)
                    )
                    .annotation(position: .top) {
                        Text("Band \(point.band.formatted(.number.precision(.fractionLength(1))))").font(
                            VeyloStyle.font(11, weight: .bold)
                        ).padding(6).background(.white, in: Capsule())
                    }
                }
            }
            .chartYScale(domain: 4...9).chartXScale(range: .plotDimension(padding: 16))
            .chartYAxis { AxisMarks(position: .leading, values: [5, 6, 7, 8, 9]) }
            .chartXAxis {
                AxisMarks(values: .automatic(desiredCount: 4)) {
                    AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                }
            }
            .chartXSelection(value: $selected).frame(height: 180)
            .opacity(appeared ? 1 : 0)
            .accessibilityElement(children: .ignore)
            .accessibilityLabel("Demonstration band chart").accessibilityValue(
                "Current band \(trend.currentBand ?? 0). Target \(trend.target). \(trend.projectedDate == nil ? "More results are needed for a projection." : "Dotted line shows an illustrative forecast.")"
            )
            HStack(spacing: 16) {
                Label("Your results", systemImage: "circle.fill").foregroundStyle(VeyloStyle.accent)
                if trend.projectedDate != nil {
                    Label("Projection", systemImage: "line.diagonal").foregroundStyle(VeyloStyle.violet)
                }
            }.font(VeyloStyle.font(10, weight: .semibold))
        }
        .onAppear { withAnimation(reduceMotion ? Motion.reduced : Motion.reveal) { appeared = true } }
        .animation(reduceMotion ? nil : Motion.selection, value: trend.points)
    }
}
