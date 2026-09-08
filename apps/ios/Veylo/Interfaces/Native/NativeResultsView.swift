import Charts
import SwiftUI

struct NativeResultView: View {
    @Bindable var state: NativePracticeModel
    @Environment(NativeAppModel.self) private var model
    @Environment(\.scenePhase) private var phase
    @State private var revision: String?

    var body: some View {
        PageScroll {
            if let result = state.result {
                ScreenHeading(title: "Your practice result", subtitle: result.attempt.taskSnapshot.title)
                if let assessment = result.assessment {
                    if let band = assessment.band {
                        VStack(spacing: 8) {
                            Text(String(format: "%.1f", band)).font(VeyloStyle.font(150, weight: .black))
                                .minimumScaleFactor(0.6).lineLimit(1).frame(maxWidth: .infinity, minHeight: 270)
                                .accessibilityLabel("Estimated practice band \(String(format: "%.1f", band))")
                            Text("Practice estimate · not an official IELTS score").font(VeyloStyle.font(12))
                                .foregroundStyle(VeyloStyle.muted)
                        }.reveal()
                    } else if let verdicts = assessment.reading {
                        let correct = verdicts.filter(\.correct).count
                        Text("\(correct) / \(verdicts.count)").font(VeyloStyle.font(78, weight: .black))
                            .frame(maxWidth: .infinity, minHeight: 230)
                        Text(
                            "A short exercise shows accuracy. A full-length Reading test is needed for a band estimate."
                        )
                    } else {
                        NativeEmptyState(
                            title: statusTitle(assessment.status),
                            detail: statusDetail(assessment.status))
                    }
                    if let grade = assessment.grade {
                        ForEach(grade.criteria, id: \.key) { criterion in
                            VStack(alignment: .leading, spacing: 8) {
                                HStack {
                                    Text(criterion.label).bold()
                                    Spacer()
                                    Text(String(format: "%.1f", criterion.score)).bold()
                                }
                                Text(criterion.explanation).font(VeyloStyle.font(14))
                            }.panel(Skill.writing.surface).reveal(delay: 0.12)
                        }
                        if let reason = grade.insufficientReason { Text(reason).panel() }
                        if !grade.strengths.isEmpty {
                            Text("What worked well").font(VeyloStyle.font(21, weight: .heavy))
                            ForEach(grade.strengths, id: \.self) { Text($0).panel() }
                        }
                        Text("Your feedback").font(VeyloStyle.font(21, weight: .heavy))
                        ForEach(Array(grade.errors.enumerated()), id: \.offset) { _, error in
                            VStack(alignment: .leading, spacing: 10) {
                                Text(error.category.replacingOccurrences(of: "_", with: " ").capitalized).font(
                                    VeyloStyle.font(12, weight: .heavy))
                                if let quote = error.anchor.quote { Text("“\(quote)”").italic() }
                                if let requirement = error.anchor.requirement { Text(requirement).italic() }
                                Text(error.issue)
                                if !error.correction.isEmpty {
                                    Text(error.correction).foregroundStyle(Skill.writing.ink)
                                }
                            }.panel(Skill.writing.surface)
                        }
                        Text(grade.nextFocus).font(VeyloStyle.font(17, weight: .bold)).panel(VeyloStyle.panel)
                    }
                    if let verdicts = assessment.reading {
                        ForEach(verdicts) { verdict in
                            DisclosureGroup {
                                VStack(alignment: .leading, spacing: 10) {
                                    Text("Your answer: " + verdict.given.joined(separator: ", "))
                                    Text("Expected: " + verdict.expected.joined(separator: ", ")).bold()
                                    Text("“" + verdict.evidence + "”").italic()
                                    Text(verdict.explanation)
                                }.padding(.top, 12)
                            } label: {
                                Label(
                                    "Question \(verdict.number)",
                                    systemImage: verdict.correct ? "checkmark.circle.fill" : "xmark.circle"
                                )
                                .foregroundStyle(verdict.correct ? .green : Skill.writing.accent)
                            }.panel()
                        }
                    }
                    if ["failed", "unavailable"].contains(assessment.status)
                        && model.account?.capabilities.writingAssessment == true
                    {
                        NativeBusyButton(title: "Retry assessment") {
                            let _: NativeResult.Assessment = try await model.remote.send(
                                "attempts/\(state.id)/retry-assessment",
                                method: "POST", body: [String: String](), as: NativeResult.Assessment.self)
                            try await state.refreshResult()
                        }
                    }
                }
                #if DEBUG
                    if result.attempt.taskSnapshot.skill == "speaking" { NativeRecordingView(state: state) }
                #endif
                if result.attempt.taskSnapshot.skill != "speaking" {
                    NavigationLink(value: NativeRoute.chat(nil, state.id)) {
                        Label("Review with Vey", systemImage: "sparkles")
                    }
                    .disabled(model.account?.capabilities.textAI != true)
                    NativeBusyButton(title: "Revise this answer") {
                        let attempt = try await model.remote.send(
                            "attempts/\(state.id)/revisions", method: "POST",
                            body: [String: String](), as: NativeAttempt.self)
                        revision = attempt.id
                    }
                    NativeBusyButton(title: "Try again") {
                        revision = try await NativeStartAttempt.create(
                            taskID: result.attempt.taskSnapshot.id, remote: model.remote)
                    }
                }
            }
        }
        .navigationDestination(item: $revision) { NativePracticeView(id: $0) }
        .task(id: phase) {
            guard phase == .active else { return }
            do {
                while ["queued", "processing"].contains(state.result?.assessment?.status ?? "") {
                    try await Task.sleep(for: .seconds(4))
                    try await state.refreshResult()
                }
            } catch is CancellationError {} catch { model.error = error.localizedDescription }
        }
        .refreshable { do { try await state.refreshResult() } catch { model.error = error.localizedDescription } }
    }

    private func statusTitle(_ status: String) -> String {
        switch status {
        case "queued": "Your answer is in the queue"
        case "processing": "Reviewing your writing"
        case "failed": "Your answer is saved"
        case "insufficient_evidence": "A little more writing is needed"
        default: "Practice saved"
        }
    }
    private func statusDetail(_ status: String) -> String {
        switch status {
        case "queued", "processing": "You can leave this screen. Your result will be here when the review is complete."
        case "failed": "The review was interrupted. Your work is safe and you can retry."
        case "insufficient_evidence":
            "There's not enough evidence for a reliable band estimate. Open your feedback for the next step."
        default:
            state.result?.attempt.taskSnapshot.skill == "speaking"
                ? "Your recording is available to play back. Speaking AI assessment is not enabled."
                : "Writing assessment is not enabled on this server yet. Your response has been saved."
        }
    }
}

struct NativeWritingVisual: View {
    var visual: NativeTask.Visual
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text(visual.title).font(VeyloStyle.font(18, weight: .bold))
            if let unit = visual.unit { Text(unit).font(VeyloStyle.font(12)) }
            if visual.chartType == "process_diagram" {
                ForEach(Array(visual.processSteps.enumerated()), id: \.offset) { index, step in
                    Label("\(index + 1). \(step)", systemImage: "arrow.down")
                }
            } else if visual.chartType == "table" {
                Grid(alignment: .leading) {
                    GridRow {
                        Text("Category").bold()
                        ForEach(visual.periods, id: \.self) { Text($0).bold() }
                    }
                    ForEach(visual.dataSeries, id: \.category) { series in
                        GridRow {
                            Text(series.category)
                            ForEach(visual.periods, id: \.self) { Text(series.values[$0]?.formatted() ?? "—") }
                        }
                    }
                }.font(VeyloStyle.font(12))
            } else {
                Chart {
                    ForEach(visual.dataSeries, id: \.category) { series in
                        ForEach(visual.periods, id: \.self) { period in
                            if let value = series.values[period] {
                                if visual.chartType == "line_graph" {
                                    LineMark(x: .value("Period", period), y: .value("Value", value)).foregroundStyle(
                                        by: .value("Category", series.category))
                                    PointMark(x: .value("Period", period), y: .value("Value", value)).foregroundStyle(
                                        by: .value("Category", series.category))
                                } else if visual.chartType == "pie_chart" {
                                    SectorMark(angle: .value("Value", value)).foregroundStyle(
                                        by: .value("Category", series.category))
                                } else {
                                    BarMark(x: .value("Period", period), y: .value("Value", value))
                                        .foregroundStyle(by: .value("Category", series.category)).position(
                                            by: .value("Category", series.category))
                                }
                            }
                        }
                    }
                }.frame(height: 230)
                DisclosureGroup("View exact data") {
                    ForEach(visual.dataSeries, id: \.category) { series in
                        Text(
                            series.category + ": "
                                + visual.periods.map { $0 + " " + (series.values[$0]?.formatted() ?? "—") }.joined(
                                    separator: ", "))
                    }
                }.font(VeyloStyle.font(12))
            }
        }.panel(Skill.writing.surface)
    }
}
