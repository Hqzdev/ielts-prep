import Charts
import SwiftUI

struct NativeProgressView: View {
    @Environment(NativeAppModel.self) private var model
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var progress: NativeProgress?
    @State private var skill = "reading"
    @State private var days = 30
    @State private var selectedDate: String?
    @State private var revealed = false

    var body: some View {
        PageScroll {
            BrandHeader()
            ScreenHeading(title: "Your progress", subtitle: "Real practice. A clearer next step.")
            Picker("Period", selection: $days) {
                Text("Week").tag(7)
                Text("Month").tag(30)
                Text("3 months").tag(90)
                Text("All").tag(3650)
            }.pickerStyle(.segmented)
            Picker("Skill", selection: $skill) {
                Text("Reading").tag("reading")
                Text("Writing").tag("writing")
            }.pickerStyle(.segmented)
            if let progress {
                let series = progress.statistics.skills.first { $0.skill == skill }
                VStack(alignment: .leading, spacing: 16) {
                    Text(skill.uppercased() + " · ESTIMATED BAND").font(VeyloStyle.font(12, weight: .heavy))
                    if let latest = series?.latest {
                        Text(String(format: "%.1f", latest)).font(VeyloStyle.font(54, weight: .black))
                    }
                    if let series, !series.series.isEmpty {
                        Chart {
                            ForEach(Array(series.series.enumerated()), id: \.offset) { _, point in
                                LineMark(
                                    x: .value("Date", point.date), y: .value("Band", point.value),
                                    series: .value("Task", point.part)
                                ).interpolationMethod(.linear)
                                PointMark(x: .value("Date", point.date), y: .value("Band", point.value))
                            }
                            if let target = model.account?.profile.targetBand {
                                RuleMark(y: .value("Target", target)).lineStyle(StrokeStyle(dash: [5]))
                                    .foregroundStyle(VeyloStyle.muted).annotation(position: .top, alignment: .trailing)
                                { Text("Target").font(.caption) }
                            }
                        }.chartYScale(domain: 1...9).frame(height: 210)
                            .chartXSelection(value: $selectedDate)
                            .opacity(revealed ? 1 : 0)
                            .animation(reduceMotion ? Motion.reduced : Motion.reveal, value: revealed)
                        if let selectedDate, let point = series.series.first(where: { $0.date == selectedDate }) {
                            Text("\(selectedDate.prefix(10)) · \(String(format: "%.1f", point.value))").font(
                                VeyloStyle.font(13, weight: .bold))
                        }
                    } else {
                        Text(
                            "Complete practice with a band result to start your chart. Short Reading exercises count towards accuracy."
                        )
                    }
                    Text("Practice estimates, not official IELTS scores.").font(VeyloStyle.font(12)).foregroundStyle(
                        VeyloStyle.muted)
                }.panel(skill == "reading" ? Skill.reading.surface : Skill.writing.surface)
                if let forecast = progress.forecasts.first(where: { $0.skill == skill }) {
                    VStack(alignment: .leading, spacing: 10) {
                        Text("Towards your target").font(VeyloStyle.font(20, weight: .heavy))
                        Text(
                            forecast.estimatedDate.map { "At your recent pace: around " + $0 }
                                ?? forecastText(forecast.reason))
                        Text("Based on independent results in the same test format. Your pace can change.").font(
                            VeyloStyle.font(12))
                    }.panel(VeyloStyle.panel)
                }
                Text("Recent practice").font(VeyloStyle.font(21, weight: .heavy))
                ForEach(progress.statistics.history.filter { $0.skill == skill }) { entry in
                    NavigationLink(value: NativeRoute.practice(entry.id)) {
                        HStack {
                            VStack(alignment: .leading) {
                                Text(entry.title).bold()
                                Text(String(entry.date.prefix(10))).font(.caption)
                            }
                            Spacer()
                            Text(
                                entry.band.map { String(format: "%.1f", $0) } ?? entry.accuracy.map { "\(Int($0))%" }
                                    ?? "Saved")
                        }.panel()
                    }
                }
            } else {
                ProgressView("Loading progress…")
            }
        }.task(id: "\(days)-\(model.learningRevision)") { await load() }.refreshable { await load() }
    }
    private func load() async {
        do {
            progress = try await model.remote.get("statistics?days=\(days)", as: NativeProgress.self)
            revealed = true
        } catch { model.error = error.localizedDescription }
    }
    private func forecastText(_ reason: String) -> String {
        switch reason {
        case "reached": "Your recent result reached this target."
        case "no_growth": "Your recent results are steady. More practice will help reveal a trend."
        case "too_distant": "There isn't a reliable target date yet."
        default: "A few more results are needed. Practise on at least three days across a week to build a trend."
        }
    }
}
