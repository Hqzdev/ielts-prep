import XCTest

@MainActor
final class NativeJourneyUITests: XCTestCase {
    private let app = XCUIApplication()
    override func setUp() { continueAfterFailure = false }

    func testLiveAccountOnboardingWritingAndSessionRestore() throws {
        guard let fixture = Bundle(for: Self.self).url(forResource: "NativeTestAccount", withExtension: "plist") else {
            throw XCTSkip("Run pnpm native:prepare-tests to create an isolated local account.")
        }
        let values = try XCTUnwrap(
            PropertyListSerialization.propertyList(from: Data(contentsOf: fixture), format: nil) as? [String: String])
        app.launchArguments = ["--native-test-signout"]
        app.launch()
        XCTAssertTrue(app.textFields["Email"].waitForExistence(timeout: 20))
        app.textFields["Email"].tap()
        app.textFields["Email"].typeText(try XCTUnwrap(values["email"]))
        app.secureTextFields["Password"].tap()
        app.secureTextFields["Password"].typeText(try XCTUnwrap(values["password"]))
        if app.buttons["Dismiss keyboard"].exists { app.buttons["Dismiss keyboard"].tap() }
        tap("Sign in")
        XCTAssertTrue(app.buttons["Not sure yet"].waitForExistence(timeout: 20))
        tap("Not sure yet")
        tap("Next")
        tap("band-7.0")
        tap("Next")
        tap("Haven't booked yet")
        tap("Next")
        tap("Reading")
        tap("Next")
        tap("Prefer not to say")
        tap("Next")
        tap("Let's begin")
        XCTAssertTrue(app.staticTexts["Your plan for today"].waitForExistence(timeout: 20))
        XCTAssertFalse(app.buttons["Listening"].exists)
        attach("Home connected to Supabase")
        app.terminate()
        app.launchArguments = []
        app.launch()
        XCTAssertTrue(app.staticTexts["Your plan for today"].waitForExistence(timeout: 20))
        tap("Tests")
        tap("Writing")
        tap("Random exercise")
        let editor = app.textViews["Writing response"]
        for _ in 0..<8 where !editor.isHittable { app.swipeUp() }
        XCTAssertTrue(editor.waitForExistence(timeout: 20))
        editor.tap()
        editor.typeText(
            "Education gives people the opportunity to develop useful skills. Schools should provide clear information and practical experience."
        )
        if app.buttons["Dismiss keyboard"].exists { app.buttons["Dismiss keyboard"].tap() }
        tap("Finish practice")
        tap("Submit answers")
        XCTAssertTrue(app.staticTexts["Practice saved"].waitForExistence(timeout: 20))
        XCTAssertFalse(app.staticTexts["6.5"].exists)
        attach("Writing saved without fabricated grading")
        back()
        tap("Reading")
        tap("Random exercise")
        XCTAssertTrue(app.buttons["Finish practice"].waitForExistence(timeout: 20))
        tap("Finish practice")
        tap("Submit answers")
        XCTAssertTrue(app.staticTexts["Your practice result"].waitForExistence(timeout: 20))
        attach("Reading answer-key result")
        back()
        tap("Progress")
        XCTAssertTrue(app.staticTexts["Your progress"].waitForExistence(timeout: 20))
        attach("Progress from submitted practice")
        tap("Home")
        tap("Build your vocabulary")
        XCTAssertTrue(app.textFields["Search words"].waitForExistence(timeout: 20))
        app.textFields["Search words"].tap()
        app.textFields["Search words"].typeText("education")
        if app.buttons["Dismiss keyboard"].exists { tap("Dismiss keyboard") }
        attach("Vocabulary search")
        back()
        tap("Open Arcade and Vey AI")
        tap("Arcade")
        tap("Start Word Sprint")
        for _ in 0..<10 {
            if app.staticTexts["Sprint complete"].exists { break }
            let option = app.buttons.matching(NSPredicate(format: "identifier BEGINSWITH 'sprint-option-'")).firstMatch
            if option.waitForExistence(timeout: 3) {
                tapElement(option, title: "Sprint option")
            } else {
                let field = app.textFields["Sprint answer"]
                XCTAssertTrue(field.waitForExistence(timeout: 20))
                field.tap()
                field.typeText("practice")
                if app.buttons["Dismiss keyboard"].exists { tap("Dismiss keyboard") }
                tap("Check answer")
            }
            if app.buttons["Next round"].waitForExistence(timeout: 3) { tap("Next round") } else { tap("See score") }
        }
        XCTAssertTrue(app.staticTexts["Sprint complete"].waitForExistence(timeout: 20))
        attach("Word Sprint server score")
        tap("Done")
        tap("Profile")
        tap("Save profile")
        tap("OK")
        if values["recording"] == "true" {
            try recordingLifecycle()
        }
    }

    private func recordingLifecycle() throws {
        tap("Microphone recording lab")
        tap("Random exercise")
        addUIInterruptionMonitor(withDescription: "Microphone permission") { alert in
            for label in ["Allow", "OK"] where alert.buttons[label].exists {
                alert.buttons[label].tap()
                return true
            }
            return false
        }
        tap("Start recording")
        app.tap()
        XCTAssertTrue(app.buttons["Stop recording"].waitForExistence(timeout: 20))
        attach("Real microphone recording")
        tap("Stop recording")
        tap("Upload recording")
        XCTAssertTrue(app.buttons["Play saved audio"].waitForExistence(timeout: 20))
        tap("Play saved audio")
        tap("Finish practice")
        tap("Submit answers")
        XCTAssertTrue(app.staticTexts["Practice saved"].waitForExistence(timeout: 20))
        tap("Play saved audio")
        tap("Delete")
        XCTAssertFalse(app.buttons["Play saved audio"].exists)
        attach("Recording deleted without speech AI")
    }

    func testRecordingWithRestoredAccount() throws {
        app.launchArguments = []
        app.launch()
        XCTAssertTrue(app.staticTexts["Your plan for today"].waitForExistence(timeout: 20))
        tap("Profile")
        try recordingLifecycle()
    }

    private func tap(_ title: String) {
        let button = app.buttons[title].firstMatch
        tapElement(button, title: title)
    }

    private func back() {
        let button = app.navigationBars.buttons.firstMatch
        tapElement(button, title: "Back")
    }

    private func tapElement(_ button: XCUIElement, title: String) {
        XCTAssertTrue(button.waitForExistence(timeout: 20), title)
        let enabled = XCTNSPredicateExpectation(predicate: NSPredicate(format: "enabled == true"), object: button)
        XCTAssertEqual(XCTWaiter.wait(for: [enabled], timeout: 20), .completed, title)
        for _ in 0..<6 where button.frame.maxY > app.frame.maxY - 34 || button.frame.minY < 44 { app.swipeUp() }
        button.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
    }

    private func attach(_ name: String) {
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}
