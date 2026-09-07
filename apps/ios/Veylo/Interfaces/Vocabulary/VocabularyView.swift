import SwiftUI

struct VocabularyView: View {
    @Environment(AppModel.self) private var model
    @State private var search = ""
    @State private var filter = "All words"
    @State private var selectedWord: VocabularyWord?
    private var words: [VocabularyWord] {
        model.content.vocabulary.filter { word in
            (search.isEmpty || word.id.localizedCaseInsensitiveContains(search)
                || word.meaning.localizedCaseInsensitiveContains(search))
                && (filter == "All words" || filter == "Learning" && !model.snapshot.learnedWords.contains(word.id)
                    || filter == "Mastered" && model.snapshot.learnedWords.contains(word.id))
        }
    }

    var body: some View {
        PageScroll {
            ScreenHeading(
                title: "Words that stay with you",
                subtitle: "\(model.content.vocabulary.count) words · \(model.snapshot.learnedWords.count) mastered")
            LabeledInput(
                label: "Find a word", placeholder: "Search your vocabulary", symbol: "magnifyingglass", text: $search)
            Picker("Word filter", selection: $filter) {
                ForEach(["All words", "Learning", "Mastered"], id: \.self) { Text($0).tag($0) }
            }.pickerStyle(.segmented)
            VStack(alignment: .leading, spacing: 12) {
                Text("Make them yours").font(VeyloStyle.font(22, weight: .heavy))
                Text("A quick review helps new words stick.").font(VeyloStyle.font(14)).foregroundStyle(
                    VeyloStyle.muted)
                PrimaryButton(title: "Review words", symbol: "arrow.counterclockwise", enabled: !words.isEmpty) {
                    selectedWord = words.first
                }
            }.panel(VeyloStyle.arcade)
            if words.isEmpty {
                ContentUnavailableView(
                    "No words here yet", systemImage: "book",
                    description: Text(
                        search.isEmpty
                            ? "Review a word and mark it as learned." : "Try another word or change the filter."))
            }
            ForEach(words) { word in
                HStack(spacing: 12) {
                    Button {
                        selectedWord = word
                    } label: {
                        HStack(spacing: 12) {
                            Image(systemName: "speaker.wave.2").frame(width: 36, height: 40).background(
                                VeyloStyle.arcade, in: RoundedRectangle(cornerRadius: 10))
                            VStack(alignment: .leading, spacing: 4) {
                                Text(word.id.lowercased()).font(VeyloStyle.font(16, weight: .heavy))
                                Text(word.meaning).font(VeyloStyle.font(12)).foregroundStyle(VeyloStyle.muted)
                            }
                            Spacer(minLength: 0)
                        }
                    }.buttonStyle(PressStyle()).accessibilityIdentifier("word-\(word.id)")
                    Button {
                        model.update {
                            if $0.favoriteWords.contains(word.id) {
                                $0.favoriteWords.remove(word.id)
                            } else {
                                $0.favoriteWords.insert(word.id)
                            }
                        }
                    } label: {
                        Image(systemName: model.snapshot.favoriteWords.contains(word.id) ? "bookmark.fill" : "bookmark")
                            .frame(width: 44, height: 44)
                    }
                    .accessibilityLabel("Bookmark \(word.id)")
                }.padding(12).background(.white, in: RoundedRectangle(cornerRadius: 18))
                    .overlay(RoundedRectangle(cornerRadius: 18).stroke(VeyloStyle.line))
            }
        }.navigationTitle("Vocabulary").navigationBarTitleDisplayMode(.inline).toolbar(.visible, for: .navigationBar)
            .sheet(item: $selectedWord) { word in WordReviewSheet(word: word) }
    }
}

struct WordReviewSheet: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    var word: VocabularyWord
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss
    @State private var currentIndex = 0
    @State private var playing = false
    @State private var showMeaning = false
    @State private var reviewedCount = 0
    private var current: VocabularyWord { model.content.vocabulary[currentIndex] }

    var body: some View {
        NavigationStack {
            PageScroll {
                VStack(spacing: 18) {
                    Caption(text: "VOCABULARY · QUICK REVIEW")
                    Text(current.id.lowercased()).font(VeyloStyle.font(36, weight: .heavy))
                    Text(current.pronunciation).font(VeyloStyle.font(18)).foregroundStyle(VeyloStyle.muted)
                    Button {
                        playing = true
                    } label: {
                        Label("Preview pronunciation", systemImage: "speaker.wave.2").frame(minHeight: 44)
                    }
                    Waveform(active: playing, color: VeyloStyle.arcadeInk).frame(height: 40)
                    if showMeaning {
                        Text(current.meaning).font(VeyloStyle.font(20, weight: .bold))
                        Text(current.example).font(VeyloStyle.font(16)).foregroundStyle(VeyloStyle.muted)
                    } else {
                        PrimaryButton(title: "Reveal meaning", symbol: "eye") {
                            withAnimation(reduceMotion ? Motion.reduced : Motion.selection) { showMeaning = true }
                        }
                    }
                }.frame(maxWidth: .infinity).panel(VeyloStyle.arcade)
                Text("Pronunciation preview is visual in this demo.").font(VeyloStyle.font(12)).foregroundStyle(
                    VeyloStyle.muted)
                if showMeaning {
                    PrimaryButton(title: "I know this word", symbol: "checkmark") {
                        model.update { $0.learnedWords.insert(current.id) }
                        advance()
                    }
                    Button("Keep practising") { advance() }.frame(maxWidth: .infinity, minHeight: 44)
                }
            }.navigationTitle("Word review").navigationBarTitleDisplayMode(.inline)
                .toolbar { ToolbarItem(placement: .confirmationAction) { Button("Done") { dismiss() } } }
        }
        .onAppear { currentIndex = model.content.vocabulary.firstIndex(of: word) ?? 0 }
        .task(id: playing) {
            guard playing else { return }
            do {
                try await Task.sleep(for: .milliseconds(1400))
                playing = false
            } catch {}
        }
    }
    private func advance() {
        reviewedCount += 1
        if reviewedCount >= 3 { model.update { $0.completedTasks.insert("vocabulary-review") } }
        currentIndex = (currentIndex + 1) % model.content.vocabulary.count
        showMeaning = false
        playing = false
    }
}
