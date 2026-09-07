import XCTest

@MainActor
final class VeyloFlowUITests: XCTestCase {
    private var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["--uitesting", "--reset-demo"]
    }

    func testRegistrationSurveyReviewAndResume() {
        app.launch()
        capture("01-login")
        tap("Create an account")
        capture("02-register")
        fill("Name", "Alex")
        fill("Email", "alex@example.com")
        app.secureTextFields["Password"].tap()
        app.secureTextFields["Password"].typeText("practice123")
        dismissKeyboard()
        tap("Create account")
        XCTAssertTrue(app.buttons["Next"].waitForExistence(timeout: 5))
        XCTAssertFalse(app.buttons["Next"].isEnabled)
        capture("04a-empty")
        tap("Not sure yet")
        tap("Next")
        capture("04b-target")
        tap("band-8.0")
        tap("Next")
        capture("04c-exam")
        tap("Haven't booked yet")
        tap("Next")
        tap("focus-Listening")
        tap("focus-Speaking")
        XCTAssertFalse(app.buttons["focus-Reading"].isEnabled)
        capture("04d-focus")
        tap("Onboarding back")
        XCTAssertTrue(app.buttons["Haven't booked yet"].exists)
        tap("Next")
        tap("Next")
        capture("04e-barrier")
        tap("Prefer not to say")
        tap("Next")
        capture("04-review")
        tap("Edit Target band")
        tap("band-7.5")
        tap("Save answer")
        tap("Start my plan")
        XCTAssertTrue(app.buttons["tab-Home"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["Your first spark"].exists)
        capture("05-fresh-home")
        app.terminate()
        app.launchArguments = ["--uitesting"]
        app.launch()
        XCTAssertTrue(app.buttons["tab-Home"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["Hi, Alex"].exists)
    }

    func testPasswordRecoveryPreview() {
        app.launch()
        tap("Forgot password?")
        fill("Email", "alex@example.com")
        dismissKeyboard()
        tap("Send reset link")
        XCTAssertTrue(app.staticTexts["Recovery preview"].waitForExistence(timeout: 3))
        capture("03-password-recovery")
        tap("Back to sign in")
        XCTAssertTrue(app.buttons["Continue with Google"].exists)
    }

    func testAllPracticeSkillsAndDetailedFeedback() {
        launchDemo()
        capture("05-home")
        tap("tab-Tests")
        capture("07-tests")
        tap("Continue test")
        capture("13-reading")
        tap("Highlight evidence")
        tap("Full passage")
        capture("13-full-passage")
        tap("Done")
        tap("TRUE")
        tap("Save & next question")
        tap("FALSE")
        tap("Save & next question")
        tap("NOT GIVEN")
        tap("Finish practice")
        XCTAssertTrue(app.staticTexts["What shaped your score"].waitForExistence(timeout: 5))
        capture("19-reading-result")
        backToPractice()
        tap("skill-Listening")
        tap("Start test")
        capture("17-listening")
        tap("Play demo audio")
        tap("Pause demo audio")
        fill("Listening answer 1", "monthly")
        XCTAssertEqual(app.textFields["Listening answer 1"].value as? String, "monthly")
        dismissKeyboard()
        finishDemo()
        backToPractice()
        tap("skill-Writing")
        tap("Start test")
        capture("14-writing")
        app.textViews["Essay response"].tap()
        app.textViews["Essay response"].typeText(
            "Cities should prioritise public transport because reliable buses connect people with jobs and education.")
        dismissKeyboard()
        tap("Submit for feedback")
        capture("19-writing-result")
        scrollTo("See all feedback")
        tap("See all feedback")
        capture("19-detailed-feedback")
        backToPractice()
        tap("skill-Speaking")
        tap("Start test")
        capture("18-speaking")
        tap("Ready to speak")
        tap("Start recording")
        tap("Finish recording")
        tap("Submit for feedback")
        XCTAssertTrue(app.staticTexts["What shaped your score"].waitForExistence(timeout: 5))
    }

    func testAIArcadeVocabularyAndProfile() {
        launchDemo()
        tap("Quick actions")
        capture("06-quick-actions")
        tap("Quick Vey AI")
        capture("12-vey-ai")
        tap("Chat with Vey")
        capture("15-chat")
        tap("Task 2 intro")
        XCTAssertTrue(
            app.staticTexts.containing(NSPredicate(format: "label CONTAINS %@", "Start with the issue")).firstMatch
                .waitForExistence(timeout: 5))
        app.navigationBars.buttons.element(boundBy: 0).tap()
        tap("Start talking")
        capture("16-voice")
        app.segmentedControls.buttons["Speak"].tap()
        tap("Start speaking")
        tap("Finish answer")
        tap("Finish & get feedback")
        backToPractice()
        tap("Quick actions")
        tap("Quick Arcade")
        capture("11-arcade")
        tap("Word Sprint")
        capture("20-word-sprint")
        tap("Game answer 0")
        tap("Next word")
        app.navigationBars.buttons.element(boundBy: 0).tap()
        tap("Speaking Shuffle")
        tap("Start speaking")
        tap("Finish rehearsal")
        tap("Next round")
        app.navigationBars.buttons.element(boundBy: 0).tap()
        tap("Listen & Match")
        tap("Play demo phrase")
        tap("Game answer 0")
        tap("Next round")
        app.navigationBars.buttons.element(boundBy: 0).tap()
        tap("tab-Profile")
        capture("09-profile")
        tap("Vocabulary")
        capture("10-vocabulary")
        tap("Review words")
        tap("Reveal meaning")
        tap("I know this word")
        tap("Done")
        app.navigationBars.buttons.element(boundBy: 0).tap()
        tap("Notifications")
        XCTAssertTrue(app.switches["Daily study reminder"].exists)
        tap("Done")
        tap("tab-Progress")
        capture("08-progress")
        app.segmentedControls.buttons["Week"].tap()
        capture("08-progress-week")
    }

    func testFullMockExamAndRepeatedTaps() {
        launchDemo()
        tap("tab-Tests")
        tap("Full mock exam")
        capture("full-exam-intro")
        tap("Start full demo exam")
        for skill in ["Listening", "Reading", "Writing", "Speaking"] {
            finishDemo()
            XCTAssertTrue(app.navigationBars["IELTS \(skill)"].exists)
            tap(skill == "Speaking" ? "Finish full exam" : "Next exam section")
        }
        XCTAssertTrue(app.buttons["tab-Tests"].waitForExistence(timeout: 5))
        for _ in 0..<3 {
            tap("Quick actions")
            tap("Quick actions")
        }
        XCTAssertFalse(app.buttons["Quick Vey AI"].exists)
    }

    func testDraftBackgroundAndTabHistory() {
        launchDemo()
        tap("tab-Tests")
        tap("skill-Writing")
        tap("Start test")
        let editor = app.textViews["Essay response"]
        editor.tap()
        editor.typeText("A draft that stays with me.")
        dismissKeyboard()
        XCUIDevice.shared.press(.home)
        app.activate()
        XCTAssertTrue(editor.waitForExistence(timeout: 5))
        XCTAssertEqual(editor.value as? String, "A draft that stays with me.")
        app.terminate()
        app.launchArguments = ["--uitesting"]
        app.launch()
        tap("tab-Tests")
        tap("skill-Writing")
        tap("Continue test")
        XCTAssertEqual(app.textViews["Essay response"].value as? String, "A draft that stays with me.")
        app.navigationBars.buttons.element(boundBy: 0).tap()
        tap("tab-Home")
        tap("Quick actions")
        tap("Quick Arcade")
        tap("tab-Profile")
        tap("tab-Home")
        XCTAssertTrue(app.buttons["Word Sprint"].waitForExistence(timeout: 3))
    }

    func testGameFailureReplayAndProfileReset() {
        launchDemo()
        tap("Quick actions")
        tap("Quick Arcade")
        tap("Word Sprint")
        for round in 0..<3 {
            tap("Game answer 3")
            tap(round == 2 ? "See my score" : "Next word")
        }
        capture("word-sprint-score")
        tap("Play again")
        XCTAssertTrue(app.staticTexts["ROUND 1 OF 10"].exists)
        app.navigationBars.buttons.element(boundBy: 0).tap()
        tap("tab-Profile")
        tap("Edit profile")
        let name = app.textFields["Name"]
        name.tap()
        name.typeText(String(repeating: XCUIKeyboardKey.delete.rawValue, count: 8) + "Alex")
        dismissKeyboard()
        tap("Save profile")
        tap("Study goal")
        tap("band-7.5")
        tap("Save goal")
        tap("Exam date")
        tap("Haven't booked yet")
        tap("Save date")
        tap("Privacy & account")
        tap("Reset all demo data")
        tap("Reset demo")
        XCTAssertTrue(app.buttons["Continue with Google"].waitForExistence(timeout: 5))
    }

    func testLayoutAndAccessibilitySemantics() throws {
        launchDemo()
        capture("layout-home")
        XCTAssertTrue(app.buttons["tab-Home"].isHittable)
        tap("tab-Progress")
        capture("layout-progress")
        try app.performAccessibilityAudit(for: [.elementDetection, .sufficientElementDescription, .trait])
        tap("tab-Profile")
        tap("Study goal")
        capture("layout-goal")
        tap("band-7.5")
        tap("Save goal")
        XCTAssertTrue(app.buttons["Study goal"].waitForExistence(timeout: 3))
    }

    func testReducedMotionAndTransparency() throws {
        let settings = XCUIApplication(bundleIdentifier: "com.apple.Preferences")
        settings.launch()
        for _ in 0..<4 {
            let back = settings.navigationBars.buttons["BackButton"]
            if !back.exists { break }
            back.tap()
            Thread.sleep(forTimeInterval: 0.5)
        }
        settingsTap("Accessibility", in: settings)
        settingsTap("Motion", in: settings)
        let motion = settings.switches["Reduce Motion"]
        XCTAssertTrue(motion.waitForExistence(timeout: 5))
        let originalMotion = motion.value as? String == "1"
        setSwitch(motion, enabled: true)
        settingsAccessibilityRoot(settings)
        settingsTap("Display & Text Size", in: settings)
        let transparency = settings.switches["Reduce Transparency"]
        for _ in 0..<5 {
            if transparency.isHittable { break }
            settings.swipeUp()
        }
        XCTAssertTrue(transparency.waitForExistence(timeout: 5))
        let originalTransparency = transparency.value as? String == "1"
        setSwitch(transparency, enabled: true)
        launchDemo()
        capture("reduced-effects-home")
        tap("Quick actions")
        capture("reduced-effects-menu")
        tap("Quick actions")
        tap("tab-Progress")
        capture("reduced-effects-progress")
        try app.performAccessibilityAudit(for: [.elementDetection, .sufficientElementDescription, .trait])
        settings.launch()
        setSwitch(transparency, enabled: originalTransparency)
        settingsAccessibilityRoot(settings)
        settingsTap("Motion", in: settings)
        setSwitch(motion, enabled: originalMotion)
        app.activate()
    }

    private func settingsAccessibilityRoot(_ settings: XCUIApplication) {
        for _ in 0..<4 {
            if settings.navigationBars["Accessibility"].exists { return }
            settings.navigationBars.buttons["BackButton"].tap()
            Thread.sleep(forTimeInterval: 0.5)
        }
        XCTAssertTrue(settings.navigationBars["Accessibility"].exists)
    }

    private func setSwitch(_ control: XCUIElement, enabled: Bool) {
        XCTAssertTrue(control.waitForExistence(timeout: 5))
        let expected = enabled ? "1" : "0"
        if control.value as? String != expected {
            control.coordinate(withNormalizedOffset: CGVector(dx: 0.95, dy: 0.5)).tap()
        }
        expectation(for: NSPredicate(format: "value == %@", expected), evaluatedWith: control)
        waitForExpectations(timeout: 5)
    }

    private func settingsTap(_ label: String, in settings: XCUIApplication) {
        let element = settings.staticTexts[label].firstMatch
        for _ in 0..<8 {
            if element.isHittable { break }
            settings.swipeUp()
        }
        XCTAssertTrue(element.waitForExistence(timeout: 5), settings.debugDescription)
        element.tap()
    }

    private func launchDemo() {
        app.launchArguments += ["--demo-home"]
        app.launch()
        XCTAssertTrue(app.buttons["tab-Home"].waitForExistence(timeout: 8))
    }

    private func tap(_ id: String) {
        let button = app.buttons[id].firstMatch
        XCTAssertTrue(button.waitForExistence(timeout: 5), "Missing button: \(id)")
        for _ in 0..<6 {
            let behindDock =
                app.buttons["Quick actions"].exists
                && !id.hasPrefix("tab-") && id != "Quick actions"
                && button.frame.midY > app.frame.maxY - 115
            if button.isHittable && !behindDock { break }
            app.swipeUp()
        }
        button.tap()
    }

    private func fill(_ id: String, _ value: String) {
        let field = app.textFields[id]
        XCTAssertTrue(field.waitForExistence(timeout: 3))
        field.tap()
        field.typeText(value)
    }

    private func dismissKeyboard() {
        if app.buttons["Dismiss keyboard"].waitForExistence(timeout: 2) {
            app.buttons["Dismiss keyboard"].tap()
        } else {
            app.swipeUp()
        }
    }

    private func finishDemo() {
        tap("Practice options")
        if !app.buttons["Finish demo now"].waitForExistence(timeout: 2) { tap("Practice options") }
        tap("Finish demo now")
        tap("Finish demo")
        XCTAssertTrue(app.staticTexts["What shaped your score"].waitForExistence(timeout: 5))
    }

    private func scrollTo(_ id: String) {
        for _ in 0..<8 {
            if app.buttons[id].isHittable { return }
            app.swipeUp()
        }
    }

    private func backToPractice() {
        scrollTo("Back to practice")
        tap("Back to practice")
    }

    private func capture(_ name: String) {
        Thread.sleep(forTimeInterval: 1)
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}
