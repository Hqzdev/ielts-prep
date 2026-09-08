import SwiftUI

struct NativeQuickActions: ViewModifier {
    @Environment(NativeAppModel.self) private var model
    @State private var inbox = QuickActionInbox.shared
    @State private var presented: HomeQuickAction?

    private var ready: Bool {
        !model.loading && !model.recovery && model.account?.onboarding.completedAt != nil
    }

    func body(content: Content) -> some View {
        content
            .onChange(of: inbox.pending, initial: true) { _, _ in receive() }
            .onChange(of: ready) { _, value in
                if value { receive() } else { presented = nil }
            }
            .fullScreenCover(item: $presented, onDismiss: receive) { action in
                NativeQuickActionView(action: action).environment(model)
            }
    }

    private func receive() {
        guard presented == nil, let action = inbox.take(ready: ready) else { return }
        presented = action
    }
}

struct NativeQuickActionView: View {
    var action: HomeQuickAction
    @Environment(NativeAppModel.self) private var model
    @Environment(\.dismiss) private var dismiss
    @State private var attempt: String?
    @State private var completedToday = false
    @State private var loading = true
    @State private var failure: String?

    var body: some View {
        NavigationStack {
            Group {
                switch action {
                case .chat:
                    NativeChatView(thread: nil, attempt: nil)
                case .vocabulary:
                    NativeVocabularyView(savedOnly: true)
                case .resume, .streak:
                    if loading {
                        ProgressView("Opening your practice…")
                    } else if let failure {
                        VStack(spacing: 20) {
                            NativeEmptyState(title: "Let's try again", detail: failure)
                            Button("Retry") { Task { await loadPractice() } }
                        }.padding(24)
                    } else if completedToday {
                        NativeProgressView()
                    } else if let attempt {
                        NativePracticeView(id: attempt)
                    } else {
                        NativeCatalogView()
                    }
                }
            }
            .navigationDestination(for: NativeRoute.self) { NativeDestination(route: $0) }
            .toolbar { ToolbarItem(placement: .topBarLeading) { Button("Done") { dismiss() } } }
        }
        .tint(VeyloStyle.violet)
        .task { if action == .resume || action == .streak { await loadPractice() } }
    }

    private func loadPractice() async {
        loading = true
        failure = nil
        defer { loading = false }
        do {
            switch try await QuickPracticeService(remote: model.remote).open(action) {
            case .attempt(let id): attempt = id
            case .progress: completedToday = true
            case .catalog: break
            }
        } catch is CancellationError {
        } catch {
            failure = error.localizedDescription
        }
    }
}
