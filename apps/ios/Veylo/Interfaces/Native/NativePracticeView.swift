import SwiftUI

struct NativePracticeView: View {
    var id: String
    @Environment(NativeAppModel.self) private var model
    @Environment(\.scenePhase) private var phase
    @State private var state: NativePracticeModel?
    @State private var confirm = false
    @State private var hints = false

    var body: some View {
        Group {
            if let state, let result = state.result {
                if result.attempt.editable {
                    editor(state: state, attempt: result.attempt)
                } else {
                    NativeResultView(state: state)
                }
            } else {
                ProgressView("Opening your practice…")
            }
        }
        .preference(key: NativeDockHiddenKey.self, value: true)
        .navigationTitle(state?.result?.attempt.taskSnapshot.skill.capitalized ?? "Practice")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            guard state == nil else { return }
            let loaded = NativePracticeModel(id: id, remote: model.remote, drafts: model.drafts)
            state = loaded
            do { try await loaded.load() } catch { model.error = error.localizedDescription }
        }
        .task(id: phase) {
            guard phase == .active else { return }
            while !Task.isCancelled {
                do {
                    try await Task.sleep(for: .seconds(1))
                    try await state?.checkDeadline()
                } catch is CancellationError { return } catch {
                    state?.saveError = error.localizedDescription
                    do { try await Task.sleep(for: .seconds(10)) } catch { return }
                }
            }
        }
        .task(id: state?.answer) {
            guard let state, state.dirty, !state.conflict else { return }
            do {
                try await Task.sleep(for: .milliseconds(700))
                try await state.flush()
            } catch is CancellationError {} catch { state.saveError = error.localizedDescription }
        }
        .onChange(of: state?.result?.assessment?.status) { _, _ in model.learningRevision += 1 }
        .onChange(of: state?.answer) { _, _ in state?.changed() }
        .onChange(of: phase) { _, value in
            guard let state, let attempt = state.result?.attempt, attempt.editable else { return }
            Task {
                do {
                    if attempt.mode == "practice" {
                        try await state.flush(action: value == .active ? "resume" : "pause")
                    } else {
                        try await state.flush()
                    }
                } catch { state.saveError = error.localizedDescription }
            }
        }
        .onDisappear {
            guard let state else { return }
            Task {
                do { try await state.flush(action: state.result?.attempt.mode == "practice" ? "pause" : nil) } catch {
                    state.saveError = error.localizedDescription
                }
            }
        }
        .sheet(isPresented: $hints) {
            NavigationStack {
                NativeChatView(thread: nil, attempt: id)
                    .toolbar { ToolbarItem(placement: .topBarTrailing) { Button("Done") { hints = false } } }
            }
        }
        .confirmationDialog("Finish this practice?", isPresented: $confirm, titleVisibility: .visible) {
            Button("Submit answers") { model.perform { try await state?.submit() } }
        } message: {
            Text("Your answers will be locked. You can start a revision after submission.")
        }
    }

    private func editor(state: NativePracticeModel, attempt: NativeAttempt) -> some View {
        @Bindable var state = state
        return PageScroll {
            HStack {
                SkillBadge(skill: attempt.taskSnapshot.displaySkill)
                VStack(alignment: .leading) {
                    Text("IELTS · \(attempt.taskSnapshot.skill.capitalized)").font(VeyloStyle.font(14, weight: .heavy))
                    Text(attempt.mode == "strict" ? "Timed practice" : "Go at your own pace").font(VeyloStyle.font(12))
                }
                Spacer()
                TimelineView(.periodic(from: .now, by: 1)) { context in
                    let seconds = state.remaining(at: context.date)
                    Text(String(format: "%02d:%02d", seconds / 60, seconds % 60))
                        .monospacedDigit().font(VeyloStyle.font(18, weight: .bold))
                        .accessibilityLabel("\(seconds / 60) minutes remaining")
                }
            }
            if state.conflict {
                VStack(alignment: .leading, spacing: 12) {
                    Text("This draft changed on another device.").bold()
                    NativeBusyButton(title: "Keep this draft") { try await state.resolve(keepLocal: true) }
                    NativeBusyButton(title: "Use server draft") { try await state.resolve(keepLocal: false) }
                }.panel(Skill.writing.surface)
            }
            ScreenHeading(title: attempt.taskSnapshot.title, subtitle: attempt.taskSnapshot.instructions)
            if attempt.taskSnapshot.skill == "reading" {
                NativeReadingView(task: attempt.taskSnapshot, state: state)
            } else if attempt.taskSnapshot.skill == "writing" {
                NativeWritingView(task: attempt.taskSnapshot, answer: $state.answer.text)
            } else {
                #if DEBUG
                    NativeRecordingView(state: state)
                #endif
            }
            if let error = state.saveError {
                Text(error).font(VeyloStyle.font(13)).foregroundStyle(.red)
                NativeBusyButton(title: "Retry saving") { try await state.flush() }
            } else {
                Text(
                    state.dirty
                        ? "Saving your draft…"
                        : state.savedAt == nil ? "Your progress is saved automatically." : "Saved"
                )
                .font(VeyloStyle.font(12)).foregroundStyle(VeyloStyle.muted)
            }
        }
        .safeAreaInset(edge: .bottom) {
            StickyFooter {
                if attempt.mode == "practice" && attempt.taskSnapshot.skill != "speaking" {
                    Button("Ask Vey for a hint") { hints = true }.disabled(model.account?.capabilities.textAI != true)
                }
                PrimaryButton(title: "Finish practice", enabled: !model.busy && !state.conflict) { confirm = true }
            }
        }
    }
}

struct NativeReadingView: View {
    var task: NativeTask
    @Bindable var state: NativePracticeModel
    @Environment(NativeAppModel.self) private var model
    @State private var showPassage = true

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            DisclosureGroup("Reading passage", isExpanded: $showPassage) {
                VStack(alignment: .leading, spacing: 18) {
                    ForEach(task.paragraphs, id: \.label) { paragraph in
                        Text(paragraph.label + "  " + paragraph.text)
                            .textSelection(.enabled)
                            .font(VeyloStyle.font(17)).lineSpacing(6)
                            .padding(8)
                            .background(
                                state.notes.highlights.contains(paragraph.text) ? Color.yellow.opacity(0.25) : .clear
                            )
                            .contextMenu {
                                Button(
                                    state.notes.highlights.contains(paragraph.text)
                                        ? "Remove highlight" : "Highlight paragraph"
                                ) {
                                    model.perform {
                                        if state.notes.highlights.contains(paragraph.text) {
                                            state.notes.highlights.removeAll { $0 == paragraph.text }
                                        } else {
                                            state.notes.highlights.append(paragraph.text)
                                        }
                                        try await state.saveNotes()
                                    }
                                }
                            }
                    }
                }.padding(.top, 12)
            }.panel(Skill.reading.surface)
            if let diagram = task.diagram {
                VStack(alignment: .leading, spacing: 10) {
                    Text(diagram.title).bold()
                    ForEach(diagram.nodes, id: \.id) { node in
                        Text(node.label + (node.questionNumber.map { " · Question \($0)" } ?? ""))
                    }
                }.panel(Skill.reading.surface)
            }
            ForEach(task.readingQuestions) { question in
                VStack(alignment: .leading, spacing: 14) {
                    HStack {
                        Text("Question \(question.number)").font(VeyloStyle.font(13, weight: .heavy))
                        Spacer()
                        Button {
                            model.perform {
                                if state.notes.flaggedQuestions.contains(question.number) {
                                    state.notes.flaggedQuestions.removeAll { $0 == question.number }
                                } else {
                                    state.notes.flaggedQuestions.append(question.number)
                                }
                                try await state.saveNotes()
                            }
                        } label: {
                            Image(
                                systemName: state.notes.flaggedQuestions.contains(question.number)
                                    ? "flag.fill" : "flag")
                        }.accessibilityLabel("Mark question \(question.number) for review")
                    }
                    Text(question.statement).font(VeyloStyle.font(16, weight: .bold))
                    if question.mode == "text" {
                        if let maximum = question.maxWords {
                            Text("No more than \(maximum) words").font(VeyloStyle.font(12))
                        }
                        TextField(
                            "Your answer",
                            text: Binding(
                                get: { state.answer.reading[String(question.number)]?.values.first ?? "" },
                                set: { state.answer.reading[String(question.number)] = .single($0) })
                        )
                        .textFieldStyle(.roundedBorder).autocorrectionDisabled()
                    } else {
                        ForEach(question.options, id: \.value) { option in
                            SelectionCard(
                                title: option.label,
                                selected: state.answer.reading[String(question.number)]?.values.contains(option.value)
                                    == true,
                                color: Skill.reading.accent, surface: Skill.reading.surface
                            ) {
                                let key = String(question.number)
                                if question.mode == "multiple" {
                                    var values = state.answer.reading[key]?.values ?? []
                                    if values.contains(option.value) {
                                        values.removeAll { $0 == option.value }
                                    } else if values.count < question.selectCount {
                                        values.append(option.value)
                                    }
                                    state.answer.reading[key] = .multiple(values)
                                } else {
                                    state.answer.reading[key] = .single(option.value)
                                }
                            }
                        }
                    }
                }.panel()
            }
        }
    }
}

struct NativeWritingView: View {
    var task: NativeTask
    @Binding var answer: String
    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            Text(task.prompt).font(VeyloStyle.font(17, weight: .bold)).textSelection(.enabled).panel(
                Skill.writing.surface)
            if let visual = task.visual {
                NativeWritingVisual(visual: visual)
            }
            HStack {
                Text("Your response").bold()
                Spacer()
                Text("\(answer.split(whereSeparator: { $0.isWhitespace }).count) / \(task.minimumWords) words")
                    .font(VeyloStyle.font(12))
            }
            TextEditor(text: $answer).font(VeyloStyle.font(17)).frame(minHeight: 320)
                .padding(12).background(.white, in: RoundedRectangle(cornerRadius: 16))
                .overlay(RoundedRectangle(cornerRadius: 16).stroke(VeyloStyle.line))
                .accessibilityLabel("Writing response")
        }
    }
}
