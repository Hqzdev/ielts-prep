import SwiftUI

struct NativeAIView: View {
    @Environment(NativeAppModel.self) private var model
    @State private var threads: [NativeThread] = []
    var body: some View {
        PageScroll {
            BrandHeader()
            Mascot(size: 160).frame(maxWidth: .infinity).reveal()
            ScreenHeading(title: "Meet Vey", subtitle: "Your IELTS Reading and Writing partner.")
            if model.account?.capabilities.textAI != true {
                Text("AI is not connected on this server yet. Your exercises and saved work remain available.").panel()
            }
            NavigationLink(value: NativeRoute.chat(nil, nil)) {
                Label("Start a conversation", systemImage: "sparkles").padding(18).frame(maxWidth: .infinity)
                    .veyloGlass()
            }.disabled(model.account?.capabilities.textAI != true)
            Text("Your conversations").font(VeyloStyle.font(21, weight: .heavy))
            ForEach(threads) { thread in
                NavigationLink(value: NativeRoute.chat(thread.id, thread.attemptId)) {
                    HStack {
                        Text(thread.title)
                        Spacer()
                        Image(systemName: "chevron.right")
                    }.panel()
                }
            }
        }.task {
            do { threads = try await model.remote.get("chat/threads", as: [NativeThread].self) } catch {
                model.error = error.localizedDescription
            }
        }
    }
}

struct NativeChatView: View {
    var thread: String?
    var attempt: String?
    @Environment(NativeAppModel.self) private var model
    @State private var threadID: String?
    @State private var messages: [NativeMessage] = []
    @State private var text = ""
    @State private var personality = "classic"
    @State private var sending = false
    @State private var request: Task<Void, Never>?
    @State private var feedback: String?

    var body: some View {
        ScrollViewReader { proxy in
            PageScroll {
                ScreenHeading(
                    title: "Vey AI",
                    subtitle: attempt == nil ? "IELTS Reading & Writing" : "Reviewing your selected exercise")
                Picker("Tutor style", selection: $personality) {
                    Text("Classic").tag("classic")
                    Text("Kind").tag("kind")
                    Text("Angry").tag("angry")
                    Text("Sarcastic").tag("sarcastic")
                }.pickerStyle(.segmented).disabled(sending)
                ScrollView(.horizontal) {
                    HStack {
                        ForEach(
                            ["Task 2 introduction", "Task 1 overview", "Reading: Not Given", "Explain my feedback"],
                            id: \.self
                        ) { prompt in
                            Button(prompt) { send(content: prompt) }.padding(12).veyloGlass()
                                .disabled(sending || model.account?.capabilities.textAI != true)
                        }
                    }
                }.scrollIndicators(.hidden)
                ForEach(messages) { message in
                    VStack(alignment: .leading, spacing: 10) {
                        Text(message.role == "user" ? "You" : "Vey").font(VeyloStyle.font(12, weight: .heavy))
                        Text(message.content.isEmpty ? "Thinking…" : message.content).textSelection(.enabled)
                        if message.status == "failed" && message.role == "assistant" {
                            Button("Retry reply") { send(content: nil, retry: message.id) }.disabled(sending)
                        }
                    }.panel(message.role == "user" ? VeyloStyle.panel : .white)
                        .id(message.id).transition(.opacity)
                }
                if let feedback { Text(feedback).textSelection(.enabled).panel(Skill.writing.surface) }
                if threadID != nil && !sending {
                    NativeBusyButton(title: "Review my English") {
                        struct Input: Encodable { var threadId: String }
                        let result = try await model.remote.send(
                            "chat/feedback", method: "POST",
                            body: Input(threadId: threadID!), as: NativeConversationFeedback.self)
                        feedback = result.display
                    }.disabled(model.account?.capabilities.textAI != true)
                }
                Color.clear.frame(height: 1).id("latest")
            }
            .onChange(of: messages.last?.content) { _, _ in
                withAnimation(Motion.reduced) { proxy.scrollTo("latest", anchor: .bottom) }
            }
        }
        .safeAreaInset(edge: .bottom) {
            StickyFooter {
                HStack {
                    TextField("Ask about IELTS…", text: $text, axis: .vertical).lineLimit(1...5)
                        .padding(14).background(.white, in: RoundedRectangle(cornerRadius: 18))
                    Button {
                        let content = text
                        text = ""
                        send(content: content)
                    } label: {
                        Image(systemName: "arrow.up").font(.system(size: 20, weight: .bold)).frame(
                            width: 48, height: 48
                        ).veyloGlass()
                    }.disabled(
                        sending || text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
                            || model.account?.capabilities.textAI != true
                    )
                    .accessibilityLabel("Send message")
                }
            }
        }
        .preference(key: NativeDockHiddenKey.self, value: true)
        .navigationTitle("Vey AI").navigationBarTitleDisplayMode(.inline)
        .task {
            threadID = thread
            if let thread {
                do {
                    messages = try await model.remote.get("chat/threads/\(thread)/messages", as: [NativeMessage].self)
                } catch { model.error = error.localizedDescription }
            }
        }
        .onDisappear { request?.cancel() }
    }

    private func send(content: String?, retry: String? = nil) {
        guard !sending else { return }
        sending = true
        if let content {
            messages.append(.init(id: UUID().uuidString, role: "user", content: content, status: "complete"))
        }
        request = Task { @MainActor in
            defer { sending = false }
            var assistantID = retry
            do {
                try await model.remote.chat(
                    "chat/messages",
                    body: NativeChatRequest(
                        content: content, threadId: threadID, attemptId: attempt, retryAssistantId: retry,
                        personality: personality)
                ) { event in
                    if let id = event.threadId { threadID = id }
                    if let id = event.assistantId {
                        assistantID = id
                        messages.removeAll { $0.id == id }
                        messages.append(.init(id: id, role: "assistant", content: "", status: "streaming"))
                    }
                    if let id = assistantID, let index = messages.firstIndex(where: { $0.id == id }) {
                        if let token = event.text { messages[index].content += token }
                        if let status = event.status { messages[index].status = status }
                        if event.type == "error" { messages[index].status = "failed" }
                    }
                    if let message = event.message { model.error = message }
                }
            } catch {
                if let id = assistantID, let index = messages.firstIndex(where: { $0.id == id }) {
                    messages[index].status = "failed"
                }
                if !(error is CancellationError) { model.error = error.localizedDescription }
            }
        }
    }
}

struct NativeConversationFeedback: Decodable {
    var status: String
    var feedback: Feedback?
    struct Feedback: Decodable {
        var strengths: [String]
        var improvements: [Item]
        var words: [Word]
    }
    struct Item: Decodable {
        var quote: String
        var correction: String
        var explanation: String
    }
    struct Word: Decodable {
        var term: String
        var meaning: String
        var example: String
    }
    var display: String {
        guard let feedback else { return "Write at least 40 words across three sentences so Vey has enough to review." }
        return
            (feedback.strengths
            + feedback.improvements.map {
                [$0.quote, $0.correction, $0.explanation].joined(separator: "\n")
            } + feedback.words.map { [$0.term, $0.meaning, $0.example].joined(separator: "\n") }).joined(
                separator: "\n\n")
    }
}
