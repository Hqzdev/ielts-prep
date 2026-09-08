import SwiftUI

struct NativeVocabularyView: View {
    @Environment(NativeAppModel.self) private var model
    @State private var words: [NativeWord] = []
    @State private var search = ""
    @State private var savedOnly = false
    @State private var topic = "All topics"
    @State private var quiz: NativeQuiz?
    @State private var add = false
    init(savedOnly: Bool = false) {
        _savedOnly = State(initialValue: savedOnly)
    }

    var body: some View {
        PageScroll {
            ScreenHeading(title: "Your vocabulary", subtitle: "Find the words. Make them yours.")
            TextField("Search words", text: $search).textFieldStyle(.roundedBorder)
            Toggle("Saved words only", isOn: $savedOnly)
            Picker("Topic", selection: $topic) {
                Text("All topics").tag("All topics")
                ForEach(Array(Set(words.map(\.topic))).sorted(), id: \.self) { Text($0).tag($0) }
            }
            HStack {
                NativeBusyButton(title: "Practise words") {
                    struct Request: Encodable {
                        var topic: String?
                        var personal: Bool
                    }
                    quiz = try await model.remote.send(
                        "vocabulary/quizzes", method: "POST",
                        body: Request(topic: topic == "All topics" ? nil : topic, personal: savedOnly),
                        as: NativeQuiz.self)
                }
                Button("Add word") { add = true }
            }
            ForEach(
                words.filter {
                    (!savedOnly || $0.saved) && (topic == "All topics" || $0.topic == topic)
                        && (search.isEmpty || ($0.term + " " + $0.translation).localizedCaseInsensitiveContains(search))
                }
            ) { word in
                VStack(alignment: .leading, spacing: 10) {
                    HStack {
                        Text(word.term).font(VeyloStyle.font(20, weight: .heavy))
                        Spacer()
                        Button {
                            model.perform {
                                struct Request: Encodable {
                                    var wordId: String
                                    var saved: Bool
                                }
                                let _: NativeAcknowledgement = try await model.remote.send(
                                    "vocabulary/saved", method: "POST",
                                    body: Request(wordId: word.id, saved: !word.saved), as: NativeAcknowledgement.self)
                                try await load()
                            }
                        } label: {
                            Image(systemName: word.saved ? "bookmark.fill" : "bookmark")
                        }
                        .accessibilityLabel(word.saved ? "Remove saved word" : "Save word")
                    }
                    Text(word.translation).foregroundStyle(VeyloStyle.violet)
                    Text(word.example).font(VeyloStyle.font(14))
                    Text("\(word.topic) · \(word.partOfSpeech)").font(VeyloStyle.font(12)).foregroundStyle(
                        VeyloStyle.muted)
                }.panel()
            }
        }.navigationTitle("Vocabulary").navigationBarTitleDisplayMode(.inline)
            .task { do { try await load() } catch { model.error = error.localizedDescription } }
            .sheet(item: $quiz) { quiz in NavigationStack { NativeVocabularyQuizView(quiz: quiz) } }
            .sheet(
                isPresented: $add,
                onDismiss: { Task { do { try await load() } catch { model.error = error.localizedDescription } } }
            ) {
                NavigationStack { NativeAddWordView() }
            }
    }
    private func load() async throws { words = try await model.remote.get("vocabulary", as: [NativeWord].self) }
}

struct NativeVocabularyQuizView: View {
    @State var quiz: NativeQuiz
    @Environment(NativeAppModel.self) private var model
    @Environment(\.dismiss) private var dismiss
    @State private var answers: [String: String] = [:]
    var body: some View {
        PageScroll {
            ScreenHeading(title: "Word practice", subtitle: "Put your vocabulary to work.")
            if let result = quiz.result {
                ForEach(result, id: \.questionId) { answer in
                    VStack(alignment: .leading) {
                        Label(answer.term, systemImage: answer.correct ? "checkmark.circle.fill" : "xmark.circle")
                        Text(answer.expected).bold()
                        Text(answer.example)
                    }.panel(answer.correct ? VeyloStyle.arcade : Skill.writing.surface)
                }
            } else {
                ForEach(quiz.questions) { question in
                    VStack(alignment: .leading, spacing: 12) {
                        Text(question.prompt).font(VeyloStyle.font(18, weight: .bold))
                        if question.options.isEmpty {
                            TextField(
                                "Your answer",
                                text: Binding(get: { answers[question.id] ?? "" }, set: { answers[question.id] = $0 })
                            )
                            .textFieldStyle(.roundedBorder).textInputAutocapitalization(.never).autocorrectionDisabled()
                        }
                        ForEach(question.options, id: \.self) { option in
                            SelectionCard(title: option, selected: answers[question.id] == option) {
                                answers[question.id] = option
                            }
                        }
                    }.panel()
                }
                NativeBusyButton(
                    title: "Check answers",
                    enabled: answers.values.filter { !$0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }.count
                        == quiz.questions.count
                ) {
                    struct Request: Encodable { var answers: [String: String] }
                    let result = try await model.remote.send(
                        "vocabulary/quizzes/\(quiz.id)/submit", method: "POST",
                        body: Request(answers: answers), as: [NativeQuiz.Answer].self)
                    quiz.result = result
                }
            }
        }.toolbar { ToolbarItem(placement: .topBarTrailing) { Button("Done") { dismiss() } } }
    }
}

struct NativeAddWordView: View {
    @Environment(NativeAppModel.self) private var model
    @Environment(\.dismiss) private var dismiss
    @State private var word = WordInput()
    struct WordInput: Codable {
        var term = ""
        var topic = "Education"
        var translation = ""
        var partOfSpeech = "noun"
        var example = ""
    }
    var body: some View {
        PageScroll {
            ScreenHeading(title: "Add a word", subtitle: "Keep useful words close.")
            TextField("Word", text: $word.term).textFieldStyle(.roundedBorder)
            TextField("Topic", text: $word.topic).textFieldStyle(.roundedBorder)
            NativeBusyButton(
                title: "Help me with this word",
                enabled: !word.term.isEmpty && !word.topic.isEmpty && model.account?.capabilities.textAI == true
            ) {
                struct Request: Encodable {
                    var term: String
                    var topic: String
                }
                word = try await model.remote.send(
                    "vocabulary/suggest", method: "POST", body: Request(term: word.term, topic: word.topic),
                    as: WordInput.self)
            }
            TextField("Translation", text: $word.translation).textFieldStyle(.roundedBorder)
            TextField("Part of speech", text: $word.partOfSpeech).textFieldStyle(.roundedBorder)
            TextField("Example sentence", text: $word.example, axis: .vertical).textFieldStyle(.roundedBorder)
            NativeBusyButton(
                title: "Save word",
                enabled: !word.term.isEmpty && !word.translation.isEmpty && !word.example.isEmpty
                    && word.example.localizedCaseInsensitiveContains(word.term)
            ) {
                let _: NativeAcknowledgement = try await model.remote.send(
                    "vocabulary/words", method: "POST", body: word, as: NativeAcknowledgement.self)
                dismiss()
            }
        }.toolbar { ToolbarItem(placement: .topBarTrailing) { Button("Cancel") { dismiss() } } }
    }
}
