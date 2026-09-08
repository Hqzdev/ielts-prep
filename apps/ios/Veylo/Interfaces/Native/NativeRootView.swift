import SwiftUI

struct NativeRootView: View {
    @Environment(NativeAppModel.self) private var model
    var body: some View {
        @Bindable var model = model
        Group {
            if model.loading {
                ProgressView("Opening Veylo…")
            } else if model.recovery {
                NavigationStack { NativePasswordView() }
            } else if let account = model.account {
                if account.onboarding.completedAt == nil {
                    NavigationStack { NativeSurveyView(initial: account.onboarding) }
                } else {
                    NativeMainView()
                }
            } else if model.signedIn {
                VStack(spacing: 20) {
                    NativeEmptyState(title: "Your account is safe", detail: "Reconnect to load your study plan.")
                    NativeBusyButton(title: "Try again") { try await model.refresh() }
                    NativeBusyButton(title: "Sign out") { try await model.signOut() }
                }.padding(24)
            } else {
                NavigationStack { NativeAuthView() }
            }
        }
        .font(VeyloStyle.font(16)).foregroundStyle(VeyloStyle.ink).tint(VeyloStyle.violet)
        .preferredColorScheme(.light)
        .overlay(alignment: .top) {
            if model.busy {
                ProgressView().padding(12).background(.regularMaterial, in: Capsule()).allowsHitTesting(false)
            }
        }
        .alert(
            "Couldn't finish", isPresented: Binding(get: { model.error != nil }, set: { if !$0 { model.error = nil } })
        ) {
            Button("OK") { model.error = nil }
        } message: {
            Text(model.error ?? "")
        }
        .alert("Veylo", isPresented: Binding(get: { model.notice != nil }, set: { if !$0 { model.notice = nil } })) {
            Button("OK") { model.notice = nil }
        } message: {
            Text(model.notice ?? "")
        }
        .task {
            #if DEBUG
                if ProcessInfo.processInfo.arguments.contains("--native-test-signout") {
                    try? await model.identity.signOut()
                }
            #endif
            await model.restore()
        }
        .onOpenURL { model.receive($0) }
    }
}

struct NativeMainView: View {
    @Environment(NativeAppModel.self) private var model
    @State private var selected: AppTab = .home
    @State private var menu = false
    @State private var hiddenTabs: Set<AppTab> = []
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Namespace private var selection

    var body: some View {
        ZStack(alignment: .bottom) {
            ZStack {
                ForEach(AppTab.allCases) { tab in
                    NativeTabView(tab: tab) { hidden in
                        if hidden { hiddenTabs.insert(tab) } else { hiddenTabs.remove(tab) }
                    }
                    .opacity(selected == tab ? 1 : 0)
                    .allowsHitTesting(selected == tab)
                    .accessibilityHidden(selected != tab)
                }
            }
            .safeAreaInset(edge: .bottom) { Color.clear.frame(height: hiddenTabs.contains(selected) ? 0 : 78) }
            if !hiddenTabs.contains(selected) {
                VStack(alignment: .trailing, spacing: 12) {
                    if menu {
                        HStack {
                            NativeQuickLink(title: "Arcade", symbol: "gamecontroller", route: .arcade)
                            NativeQuickLink(title: "Vey AI", symbol: "sparkles", route: .ai)
                        }.padding(12).veyloGlass().transition(
                            .opacity.combined(with: .scale(scale: reduceMotion ? 1 : 0.96, anchor: .bottomTrailing)))
                    }
                    HStack(spacing: 4) {
                        ForEach(AppTab.allCases) { tab in
                            Button {
                                withAnimation(reduceMotion ? Motion.reduced : Motion.navigation) {
                                    selected = tab
                                    menu = false
                                }
                                model.learningRevision += 1
                            } label: {
                                VStack(spacing: 4) {
                                    Image(systemName: tab.symbol).font(.system(size: 21))
                                    Text(tab.rawValue).font(VeyloStyle.font(10, weight: .bold))
                                }.frame(maxWidth: .infinity).frame(height: 52)
                                    .background {
                                        if tab == selected {
                                            Capsule().fill(VeyloStyle.lavender.opacity(0.8)).matchedGeometryEffect(
                                                id: "tab", in: selection)
                                        }
                                    }
                            }.buttonStyle(PressStyle()).accessibilityAddTraits(tab == selected ? .isSelected : [])
                        }
                        Button {
                            withAnimation(reduceMotion ? Motion.reduced : Motion.navigation) { menu.toggle() }
                        } label: {
                            Image(systemName: "plus").font(.system(size: 23, weight: .medium))
                                .rotationEffect(.degrees(menu && !reduceMotion ? 45 : 0)).frame(width: 48, height: 52)
                        }.buttonStyle(PressStyle()).accessibilityLabel(menu ? "Close menu" : "Open Arcade and Vey AI")
                    }.padding(6).veyloGlass()
                }.padding(.horizontal, 16).padding(.bottom, 4)
            }
        }.background(VeyloStyle.paper)
    }
}

struct NativeQuickLink: View {
    var title: String
    var symbol: String
    var route: NativeRoute
    @State private var presented = false
    var body: some View {
        Button {
            presented = true
        } label: {
            Label(title, systemImage: symbol).font(VeyloStyle.font(15, weight: .bold)).padding(12)
        }
        .sheet(isPresented: $presented) {
            NavigationStack {
                NativeDestination(route: route)
                    .navigationDestination(for: NativeRoute.self) { NativeDestination(route: $0) }
                    .toolbar { ToolbarItem(placement: .topBarTrailing) { Button("Done") { presented = false } } }
            }
        }
    }
}

struct NativeDockHiddenKey: PreferenceKey {
    static let defaultValue = false
    static func reduce(value: inout Bool, nextValue: () -> Bool) { value = value || nextValue() }
}

struct NativeTabView: View {
    var tab: AppTab
    var onDockVisibility: (Bool) -> Void
    @State private var path: [NativeRoute] = []
    var body: some View {
        NavigationStack(path: $path) {
            Group {
                switch tab {
                case .home: NativeHomeView()
                case .tests: NativeCatalogView()
                case .progress: NativeProgressView()
                case .profile: NativeProfileView()
                }
            }
            .navigationDestination(for: NativeRoute.self) { NativeDestination(route: $0) }
        }.onPreferenceChange(NativeDockHiddenKey.self) { onDockVisibility($0) }
    }
}

struct NativeDestination: View {
    var route: NativeRoute
    var body: some View {
        switch route {
        case .practice(let id): NativePracticeView(id: id)
        case .vocabulary: NativeVocabularyView()
        case .arcade: NativeArcadeView()
        case .sprint(let id): NativeSprintView(id: id)
        case .ai: NativeAIView()
        case .chat(let thread, let attempt): NativeChatView(thread: thread, attempt: attempt)
        }
    }
}
