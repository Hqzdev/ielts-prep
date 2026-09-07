import SwiftUI

struct AppRootView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        Group {
            if !model.snapshot.signedIn {
                AuthView()
            } else if !model.snapshot.onboardingCompleted {
                OnboardingView()
            } else {
                MainShell()
            }
        }
        .font(VeyloStyle.font(16)).foregroundStyle(VeyloStyle.ink).tint(VeyloStyle.violet)
        .preferredColorScheme(.light)
        .background(VeyloStyle.paper)
        .animation(reduceMotion ? Motion.reduced : Motion.navigation, value: model.snapshot.signedIn)
        .animation(reduceMotion ? Motion.reduced : Motion.navigation, value: model.snapshot.onboardingCompleted)
        .safeAreaInset(edge: .top) {
            if model.storageFailed {
                HStack {
                    Text("Changes are in memory. Local saving needs attention.").font(VeyloStyle.font(12))
                    Button("Retry") { model.retrySaving() }.font(VeyloStyle.font(12, weight: .bold))
                }.padding(10).background(Skill.speaking.surface)
            }
        }
    }
}

struct MainShell: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    @State private var selectedTab: AppTab = .home
    @State private var plusOpen = false
    @State private var homeRouter = AppRouter()
    @State private var testsRouter = AppRouter()
    @State private var progressRouter = AppRouter()
    @State private var profileRouter = AppRouter()
    @Namespace private var navigationGlass

    var body: some View {
        ZStack {
            TabView(selection: $selectedTab) {
                ForEach(AppTab.allCases) { tab in
                    TabStack(tab: tab, router: router(for: tab))
                        .tabItem { Label(tab.rawValue, systemImage: tab.symbol) }.tag(tab)
                }
            }.toolbar(.hidden, for: .tabBar)
            if plusOpen {
                Color.black.opacity(0.04).ignoresSafeArea().onTapGesture { closeMenu() }
                    .accessibilityLabel("Close quick actions").accessibilityAddTraits(.isButton)
            }
        }
        .safeAreaInset(edge: .bottom, spacing: 0) {
            if !router(for: selectedTab).hidesDock {
                GlassEffectContainer(spacing: 12) {
                    dock.overlay(alignment: .bottomTrailing) {
                        if plusOpen {
                            quickActions.padding(.bottom, 82).transition(
                                reduceMotion
                                    ? .opacity : .scale(scale: 0.92, anchor: .bottomTrailing).combined(with: .opacity))
                        }
                    }
                }.padding(.horizontal, 20).padding(.bottom, 8).frame(maxWidth: 430).frame(maxWidth: .infinity)
            }
        }
        .onChange(of: selectedTab) { _, _ in plusOpen = false }
        .animation(reduceMotion ? Motion.reduced : Motion.navigation, value: plusOpen)
    }

    private var dock: some View {
        HStack(spacing: 10) {
            HStack(spacing: 2) {
                ForEach(AppTab.allCases) { tab in
                    Button {
                        withAnimation(reduceMotion ? Motion.reduced : Motion.navigation) {
                            selectedTab = tab
                            plusOpen = false
                        }
                    } label: {
                        VStack(spacing: 5) {
                            Image(systemName: tab.symbol).font(.system(size: 20, weight: .regular))
                            if !dynamicTypeSize.isAccessibilitySize {
                                Text(tab.rawValue).font(VeyloStyle.font(10, weight: .bold))
                            }
                        }
                        .foregroundStyle(selectedTab == tab ? VeyloStyle.violet : VeyloStyle.muted)
                        .frame(maxWidth: .infinity).frame(height: 54)
                        .background {
                            if selectedTab == tab {
                                if reduceMotion {
                                    Capsule().fill(VeyloStyle.lavender)
                                } else {
                                    Capsule().fill(VeyloStyle.lavender)
                                        .matchedGeometryEffect(id: "selectedTab", in: navigationGlass, isSource: true)
                                }
                            }
                        }
                    }.buttonStyle(PressStyle()).accessibilityIdentifier("tab-\(tab.rawValue)").accessibilityLabel(
                        tab.rawValue
                    )
                    .accessibilityAddTraits(selectedTab == tab ? .isSelected : [])
                }
            }.padding(5).veyloGlass(radius: 34)
            Button {
                withAnimation(reduceMotion ? Motion.reduced : Motion.navigation) { plusOpen.toggle() }
            } label: {
                Image(systemName: "plus").font(.system(size: 25, weight: .light))
                    .rotationEffect(.degrees(plusOpen && !reduceMotion ? 45 : 0))
                    .frame(width: 58, height: 58).veyloGlass(radius: 29)
            }.buttonStyle(PressStyle()).accessibilityLabel(plusOpen ? "Close quick actions" : "Open Arcade and Vey AI")
                .accessibilityIdentifier("Quick actions")
        }
    }

    private var quickActions: some View {
        VStack(spacing: 4) {
            Button {
                open(.ai)
            } label: {
                HStack(spacing: 12) {
                    Mascot(size: 30)
                    Text("Vey AI").font(VeyloStyle.font(17, weight: .heavy))
                    Spacer()
                    Image(systemName: "arrow.up.right")
                }.padding(12)
            }.accessibilityIdentifier("Quick Vey AI")
            Divider().padding(.horizontal, 12)
            Button {
                open(.arcade)
            } label: {
                HStack(spacing: 12) {
                    Image(systemName: "gamecontroller").frame(width: 30)
                    Text("Arcade").font(VeyloStyle.font(17, weight: .heavy))
                    Spacer()
                    Image(systemName: "arrow.up.right")
                }.padding(12)
            }.accessibilityIdentifier("Quick Arcade")
        }.padding(6).frame(width: 220).veyloGlass(radius: 26).buttonStyle(PressStyle())
    }
    private func closeMenu() { withAnimation(reduceMotion ? Motion.reduced : Motion.navigation) { plusOpen = false } }
    private func open(_ route: AppRoute) {
        closeMenu()
        router(for: selectedTab).path.append(route)
    }
    private func router(for tab: AppTab) -> AppRouter {
        switch tab {
        case .home: homeRouter
        case .tests: testsRouter
        case .progress: progressRouter
        case .profile: profileRouter
        }
    }
}

struct TabStack: View {
    var tab: AppTab
    @Bindable var router: AppRouter

    var body: some View {
        NavigationStack(path: $router.path) {
            root.toolbar(.hidden, for: .navigationBar)
                .navigationDestination(for: AppRoute.self) { route in
                    switch route {
                    case .practice(let id): PracticeView(sessionID: id)
                    case .result(let result): ResultView(result: result)
                    case .vocabulary: VocabularyView()
                    case .arcade: ArcadeView()
                    case .game(let game): ArcadeGameView(game: game)
                    case .ai: AIHomeView()
                    case .chat: ChatView()
                    case .voice(let personality): VoiceCoachView(personality: personality)
                    }
                }
        }
        .environment(router)
        .sheet(item: $router.sheet) { sheet in ProfileSheet(kind: sheet).environment(router) }
        .toolbar(.hidden, for: .tabBar)
    }

    @ViewBuilder private var root: some View {
        switch tab {
        case .home: HomeView()
        case .tests: TestCatalogView()
        case .progress: ProgressScreen()
        case .profile: ProfileView()
        }
    }
}
