import UIKit
import XCTest

@testable import Veylo

@MainActor
final class DemoFlowTests: XCTestCase {
    func testOnboardingCannotAdvanceWithoutAnAnswer() {
        let flow = OnboardingFlow()
        XCTAssertEqual(flow.nextStep(after: 0, answers: OnboardingAnswers()), 0)
        var answers = OnboardingAnswers()
        answers.startingBand = .unknown
        XCTAssertEqual(flow.nextStep(after: 0, answers: answers), 1)
    }

    func testUnknownLevelAndUnbookedExamAreValidAnswers() {
        let answers = completeAnswers()
        XCTAssertTrue(answers.isComplete)
        XCTAssertTrue(OnboardingFlow().canComplete(answers))
    }

    func testFocusSelectionAllowsAtMostTwoDistinctSkills() {
        var answers = OnboardingAnswers()
        answers.toggleFocus(.reading)
        answers.toggleFocus(.listening)
        answers.toggleFocus(.writing)
        XCTAssertEqual(answers.focus, [.reading, .listening])
        answers.toggleFocus(.reading)
        answers.toggleFocus(.writing)
        XCTAssertEqual(answers.focus, [.listening, .writing])
    }

    func testInvalidOrDuplicateFocusCannotCompleteOnboarding() {
        var answers = completeAnswers()
        answers.focus = [.speaking, .speaking]
        XCTAssertFalse(answers.isComplete)
        answers.focus = []
        XCTAssertFalse(answers.isComplete)
    }

    func testResumeStopsAtFirstUnansweredQuestion() {
        var answers = OnboardingAnswers()
        answers.startingBand = .confident
        XCTAssertEqual(OnboardingFlow().resumeStep(5, answers: answers), 1)
        XCTAssertEqual(OnboardingFlow().resumeStep(-2, answers: answers), 0)
    }

    func testNewAccountHasNoInventedHistory() throws {
        let service = try service()
        service.register(name: "New Learner", email: "new@example.com")
        XCTAssertTrue(service.snapshot.signedIn)
        XCTAssertFalse(service.snapshot.onboardingCompleted)
        XCTAssertTrue(service.snapshot.results.isEmpty)
        XCTAssertEqual(service.snapshot.streak, 0)
        service.completeOnboarding()
        XCTAssertFalse(service.snapshot.onboardingCompleted)
        service.update { $0.profile.answers = completeAnswers() }
        service.completeOnboarding()
        XCTAssertTrue(service.snapshot.onboardingCompleted)
    }

    func testDraftsAnswersAndOnboardingSurviveRelaunch() throws {
        let directory = temporaryDirectory()
        let first = DemoSessionService(repository: LocalDemoRepository(directory: directory), content: DemoContent())
        first.register(name: "Learner", email: "learner@example.com")
        first.update {
            $0.profile.answers.startingBand = .unknown
            $0.onboardingStep = 1
        }
        let id = first.startPractice(skill: .writing, number: 8)
        first.update { $0.sessions[id]?.essay = "One idea with one clear example." }
        let restored = DemoSessionService(repository: LocalDemoRepository(directory: directory), content: DemoContent())
        XCTAssertEqual(restored.snapshot.onboardingStep, 1)
        XCTAssertEqual(restored.snapshot.profile.answers.startingBand, .unknown)
        XCTAssertEqual(restored.snapshot.sessions[id]?.wordCount, 6)
        XCTAssertEqual(restored.snapshot.sessions[id]?.essay, "One idea with one clear example.")
    }

    func testReturningToSameAccountPreservesUnfinishedOnboarding() throws {
        let service = try service()
        service.register(name: "Learner", email: "learner@example.com")
        service.update {
            $0.profile.answers.startingBand = .unknown
            $0.onboardingStep = 1
            $0.signedIn = false
        }
        service.signIn(email: "learner@example.com", at: Date(timeIntervalSince1970: 0))
        XCTAssertFalse(service.snapshot.onboardingCompleted)
        XCTAssertEqual(service.snapshot.onboardingStep, 1)
    }

    func testSubmitIsIdempotentAndKeepsDraft() throws {
        let service = try service()
        let id = service.startPractice(skill: .writing, number: 8)
        service.update { $0.sessions[id]?.essay = "A saved response." }
        let date = Date(timeIntervalSince1970: 0)
        _ = service.submitPractice(id: id, at: date)
        _ = service.submitPractice(id: id, at: date)
        XCTAssertEqual(service.snapshot.results.count, 1)
        XCTAssertEqual(service.snapshot.completedTasks.count, 1)
        XCTAssertEqual(service.snapshot.sessions[id]?.essay, "A saved response.")
        XCTAssertEqual(service.snapshot.streak, 1)
    }

    func testFullExamFollowsAllFourSkills() throws {
        let service = try service()
        var id = service.startPractice(skill: .listening, number: 1, fullExam: true)
        for skill in [Skill.listening, .reading, .writing, .speaking] {
            XCTAssertEqual(service.snapshot.sessions[id]?.skill, skill)
            _ = service.submitPractice(id: id, at: Date(timeIntervalSince1970: 0))
            let next = service.nextExamSession(after: id)
            if skill == .speaking { XCTAssertNil(next) } else { id = try XCTUnwrap(next) }
        }
        XCTAssertEqual(service.snapshot.results.count, 4)
    }

    func testUnreadableStorageIsReportedWithoutCrashing() throws {
        let directory = temporaryDirectory()
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        try Data("invalid".utf8).write(to: directory.appendingPathComponent("veylo-demo.json"))
        let service = DemoSessionService(repository: LocalDemoRepository(directory: directory), content: DemoContent())
        XCTAssertTrue(service.storageFailed)
        XCTAssertFalse(service.snapshot.signedIn)
        service.persist()
        XCTAssertFalse(service.storageFailed)
    }

    func testRetakingPracticePreservesEarlierResponseAndScore() throws {
        let service = try service()
        let id = service.startPractice(skill: .writing, number: 8)
        service.update { $0.sessions[id]?.essay = "First response" }
        _ = service.submitPractice(id: id, at: Date(timeIntervalSince1970: 0))
        _ = service.startPractice(skill: .writing, number: 8, restart: true)
        service.update { $0.sessions[id]?.essay = "Revised response" }
        _ = service.submitPractice(id: id, at: Date(timeIntervalSince1970: 60))
        XCTAssertEqual(service.snapshot.results.count, 2)
        XCTAssertEqual(service.snapshot.results.first?.savedResponse, "First response")
        XCTAssertEqual(service.snapshot.results.last?.savedResponse, "Revised response")
    }

    func testForecastRequiresEnoughResultsAndAPositiveTrend() {
        let origin = Date(timeIntervalSince1970: 0)
        let results = [6.0, 6.0, 6.0].enumerated().map { index, band in
            PracticeResult(
                id: "\(index)", skill: .writing, band: band,
                date: origin.addingTimeInterval(Double(index) * 604_800), isFullExam: false)
        }
        let flat = ProgressTrend(results: results, target: 8, skill: nil, since: nil)
        XCTAssertTrue(flat.hasEnoughData)
        XCTAssertNil(flat.projectedDate)
        var rising = results
        rising[2].band = 7
        let trend = ProgressTrend(results: rising, target: 8, skill: nil, since: nil)
        XCTAssertNotNil(trend.projectedDate)
        XCTAssertEqual(trend.currentBand, 7)
        let reached = ProgressTrend(results: rising, target: 7, skill: nil, since: nil)
        XCTAssertTrue(reached.targetReached)
        XCTAssertNil(reached.projectedDate)
    }

    func testForecastFiltersPeriodAndSkill() {
        let date = Date(timeIntervalSince1970: 2_000_000)
        let results = DemoContent().returningLearner(at: date).results
        let reading = ProgressTrend(results: results, target: 8, skill: .reading, since: nil)
        XCTAssertEqual(reading.resultCount, 4)
        XCTAssertEqual(reading.currentBand, 7)
        let week = ProgressTrend(
            results: results, target: 8, skill: .reading,
            since: date.addingTimeInterval(-86_400))
        XCTAssertEqual(week.resultCount, 1)
        XCTAssertFalse(week.hasEnoughData)
        XCTAssertNil(week.projectedDate)
    }

    func testNunitoFontFacesAreRegistered() {
        for face in ["Regular", "Bold", "ExtraBold", "Black"] {
            XCTAssertNotNil(UIFont(name: "NunitoSans-12ptExtraLight_\(face)", size: 16))
        }
    }

    private func completeAnswers() -> OnboardingAnswers {
        OnboardingAnswers(
            startingBand: .unknown, targetBand: 8, examPlan: .notBooked, focus: [.listening, .speaking],
            barrier: .privateAnswer)
    }

    private func temporaryDirectory() -> URL {
        let url = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        addTeardownBlock { try? FileManager.default.removeItem(at: url) }
        return url
    }

    private func service() throws -> DemoSessionService {
        DemoSessionService(repository: LocalDemoRepository(directory: temporaryDirectory()), content: DemoContent())
    }
}
