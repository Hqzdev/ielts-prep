#if DEBUG
    import SwiftUI

    private final class PreviewRepository: DemoRepository {
        private var snapshot: DemoSnapshot

        init(snapshot: DemoSnapshot) { self.snapshot = snapshot }
        func load() throws -> DemoSnapshot? { snapshot }
        func save(_ snapshot: DemoSnapshot) throws { self.snapshot = snapshot }
    }

    private enum PreviewComposition {
        static func model(returningLearner: Bool) -> AppModel {
            let content = DemoContent()
            let state = returningLearner ? content.returningLearner(at: Date()) : DemoSnapshot()
            return AppModel(
                service: DemoSessionService(repository: PreviewRepository(snapshot: state), content: content))
        }
    }

    #Preview("Home · returning learner") {
        AppRootView().environment(PreviewComposition.model(returningLearner: true))
    }

    #Preview("Sign in · first launch") {
        AppRootView().environment(PreviewComposition.model(returningLearner: false))
    }

    #Preview("Progress · no results") {
        ProgressScreen().environment(PreviewComposition.model(returningLearner: false)).environment(AppRouter())
            .font(VeyloStyle.font(16)).foregroundStyle(VeyloStyle.ink)
    }
#endif
