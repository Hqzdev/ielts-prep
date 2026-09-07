import SwiftUI

enum PracticeSheet: String, Identifiable {
    case passage, transcript
    var id: String { rawValue }
}

struct PracticeView: View {
    let sessionID: String
    @Environment(AppModel.self) private var model
    @Environment(AppRouter.self) private var router
    @Environment(\.scenePhase) private var scenePhase
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var elapsed = 0
    @State private var isPlaying = false
    @State private var showTimer = true
    @State private var sheet: PracticeSheet?
    @State private var speakingPhase = 0
    @State private var prepared = false
    @State private var confirmSubmit = false

    private var session: PracticeSession? { model.snapshot.sessions[sessionID] }

    var body: some View {
        Group {
            if let session {
                PageScroll {
                    if session.skill == .reading || session.skill == .listening {
                        PartIndicator(
                            labels: session.skill == .reading
                                ? ["Passage 1", "Passage 2", "Passage 3"] : ["Part 1", "Part 2", "Part 3", "Part 4"],
                            selected: 0, color: session.skill.accent)
                    }
                    switch session.skill {
                    case .reading:
                        ReadingExercise(
                            session: session, elapsed: elapsed, showTimer: $showTimer, openPassage: { sheet = .passage }
                        )
                    case .listening:
                        ListeningExercise(
                            session: session, elapsed: $elapsed, isPlaying: $isPlaying,
                            openTranscript: { sheet = .transcript })
                    case .writing:
                        WritingExercise(session: session, elapsed: elapsed, showTimer: $showTimer)
                    case .speaking:
                        SpeakingExercise(
                            elapsed: elapsed, phase: $speakingPhase, isPlaying: $isPlaying,
                            topic: model.content.speakingTopics[0])
                    }
                }
                .safeAreaInset(edge: .bottom) { footer(session) }
                .navigationTitle(
                    session.skill == .writing
                        ? "Writing Task 2"
                        : session.skill == .speaking ? "Speaking · Part 2" : "IELTS \(session.skill.rawValue)"
                )
                .toolbar {
                    ToolbarItem(placement: .topBarTrailing) {
                        Menu {
                            Button("Finish demo now", systemImage: "checkmark.circle") { confirmSubmit = true }
                            if session.skill == .listening {
                                Button("Show demo transcript", systemImage: "text.bubble") { sheet = .transcript }
                            }
                        } label: {
                            Image(systemName: "ellipsis.circle").frame(width: 44, height: 44)
                        }
                        .accessibilityIdentifier("Practice options")
                    }
                }
            } else {
                ContentUnavailableView(
                    "Session unavailable", systemImage: "book.closed",
                    description: Text("Return to Tests to start a new practice."))
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .toolbar(.visible, for: .navigationBar)
        .toolbarBackground(VeyloStyle.paper, for: .navigationBar)
        .confirmationDialog("Show the demonstration result?", isPresented: $confirmSubmit, titleVisibility: .visible) {
            Button("Finish demo") { finish() }
            Button("Keep practising", role: .cancel) { confirmSubmit = false }
        } message: {
            Text("This preview uses a sample score and feedback. Your text or audio is not assessed.")
        }
        .sheet(item: $sheet) { sheet in
            PracticeInformationSheet(kind: sheet, passages: model.content.readingPassages)
        }
        .onAppear {
            guard !prepared else { return }
            elapsed = session?.elapsedSeconds ?? 0
            prepared = true
        }
        .onDisappear {
            saveTime()
            isPlaying = false
        }
        .onChange(of: scenePhase) { _, value in
            if value != .active {
                saveTime()
                isPlaying = false
            }
        }
        .task(id: scenePhase) {
            guard scenePhase == .active else { return }
            do {
                while !Task.isCancelled {
                    try await Task.sleep(for: .seconds(1))
                    guard let session, !session.submitted else { continue }
                    if session.skill == .reading || session.skill == .writing || isPlaying { elapsed += 1 }
                    if session.skill == .speaking && isPlaying && elapsed >= (speakingPhase == 0 ? 60 : 120) {
                        isPlaying = false
                        if speakingPhase == 0 {
                            speakingPhase = 1
                            elapsed = 0
                        } else {
                            speakingPhase = 2
                        }
                    }
                    if session.skill == .listening && elapsed >= 266 {
                        elapsed = 266
                        isPlaying = false
                    }
                }
            } catch {}
        }
    }

    private func footer(_ session: PracticeSession) -> some View {
        StickyFooter {
            if session.skill == .speaking {
                PrimaryButton(
                    title: speakingPhase == 2
                        ? "Submit for feedback"
                        : isPlaying
                            ? (speakingPhase == 0 ? "Finish preparation" : "Finish recording")
                            : speakingPhase == 0 ? "Start preparation" : "Start recording",
                    symbol: speakingPhase == 2 ? "checkmark" : isPlaying ? "stop" : "mic"
                ) {
                    if speakingPhase == 2 {
                        finish()
                    } else if isPlaying {
                        isPlaying = false
                        if speakingPhase == 0 {
                            speakingPhase = 1
                            elapsed = 0
                        } else {
                            speakingPhase = 2
                        }
                    } else {
                        elapsed = 0
                        isPlaying = true
                    }
                }
                if speakingPhase == 0 {
                    Button("Ready to speak") {
                        isPlaying = false
                        speakingPhase = 1
                        elapsed = 0
                    }
                    .font(VeyloStyle.font(13, weight: .bold)).frame(minHeight: 44)
                } else if speakingPhase == 2 {
                    Button("Try again") {
                        elapsed = 0
                        speakingPhase = 1
                        isPlaying = false
                    }
                    .font(VeyloStyle.font(13, weight: .bold)).frame(minHeight: 44)
                }
                Text("Simulated recording · microphone is off").font(VeyloStyle.font(11)).foregroundStyle(
                    VeyloStyle.muted)
            } else if session.skill == .writing {
                PrimaryButton(title: "Submit for feedback", symbol: "checkmark", enabled: session.wordCount > 0) {
                    finish()
                }
            } else {
                let answered = !(session.answers[String(session.question)] ?? "").trimmingCharacters(
                    in: .whitespacesAndNewlines
                ).isEmpty
                PrimaryButton(
                    title: session.question >= 2 ? "Finish practice" : "Save & next question",
                    color: session.skill.accent, enabled: answered
                ) {
                    if session.question >= 2 {
                        finish()
                    } else {
                        withAnimation(reduceMotion ? Motion.reduced : Motion.navigation) {
                            model.editSession(sessionID) { $0.question += 1 }
                        }
                    }
                }
            }
        }
    }

    private func saveTime() { model.editSession(sessionID) { $0.elapsedSeconds = elapsed } }

    private func finish() {
        isPlaying = false
        saveTime()
        if let result = model.submit(sessionID) { router.path.append(.result(result)) }
    }
}

struct PartIndicator: View {
    var labels: [String]
    var selected: Int
    var color: Color
    var body: some View {
        HStack(spacing: 8) {
            ForEach(Array(labels.enumerated()), id: \.offset) { index, label in
                VStack(spacing: 7) {
                    Capsule().fill(index == selected ? color : VeyloStyle.line).frame(height: 3)
                    Text(label).font(VeyloStyle.font(10, weight: index == selected ? .bold : .regular))
                        .foregroundStyle(index == selected ? color : VeyloStyle.muted)
                }.frame(maxWidth: .infinity)
            }
        }.accessibilityElement(children: .ignore).accessibilityLabel(labels[selected])
    }
}

struct PracticeTimer: View {
    var seconds: Int
    @Binding var visible: Bool
    var body: some View {
        Button {
            visible.toggle()
        } label: {
            HStack(spacing: 5) {
                Image(systemName: "timer")
                Text(visible ? seconds.clockText : "Show timer").monospacedDigit()
                Image(systemName: visible ? "eye.slash" : "eye")
            }.font(VeyloStyle.font(12)).foregroundStyle(VeyloStyle.muted).frame(minHeight: 44)
        }.buttonStyle(PressStyle()).accessibilityLabel(visible ? "Hide timer" : "Show timer")
    }
}

extension Int {
    var clockText: String { String(format: "%02d:%02d", Swift.max(0, self) / 60, Swift.max(0, self) % 60) }
}

struct PracticeInformationSheet: View {
    var kind: PracticeSheet
    var passages: [String]
    @Environment(\.dismiss) private var dismiss
    var body: some View {
        NavigationStack {
            PageScroll {
                ScreenHeading(
                    title: kind == .passage ? "The city beneath the trees" : "A booking at the sports centre",
                    subtitle: kind == .passage ? "IELTS Reading · Passage 1" : "Demo transcript · Note completion")
                if kind == .passage {
                    ForEach(Array(passages.enumerated()), id: \.offset) { index, passage in
                        VStack(alignment: .leading, spacing: 8) {
                            Caption(text: "PARAGRAPH \(index + 1)", color: Skill.reading.accent)
                            Text(passage).font(VeyloStyle.font(17)).lineSpacing(5).textSelection(.enabled)
                        }
                    }
                } else {
                    Text(
                        "RECEPTIONIST: Good morning, Riverside Sports Centre. How can I help?\n\nCALLER: I'd like an individual membership.\n\nRECEPTIONIST: Which day would you prefer for your induction?\n\nCALLER: Tuesday would be ideal. I finish work at five.\n\nRECEPTIONIST: We have a session at 6:30.\n\nCALLER: Perfect. I'll take that."
                    ).font(VeyloStyle.font(17)).lineSpacing(5)
                }
            }.navigationTitle(kind == .passage ? "Full passage" : "Transcript")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar { ToolbarItem(placement: .confirmationAction) { Button("Done") { dismiss() } } }
        }
    }
}
