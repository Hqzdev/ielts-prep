import XCTest

@MainActor
final class QuickActionUITests: XCTestCase {
    func testHomeScreenMenuSupportsWarmAndColdLaunch() {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launch()
        XCTAssertTrue(app.staticTexts["Welcome back"].waitForExistence(timeout: 15))
        let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
        XCUIDevice.shared.press(.home)
        let icon = springboard.icons["Veylo"].firstMatch
        XCTAssertTrue(icon.waitForExistence(timeout: 10))
        icon.press(forDuration: 1.2)
        for title in ["Continue practice", "Keep your streak", "Talk to Vey", "Review saved words"] {
            XCTAssertTrue(
                springboard.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", title)).firstMatch
                    .waitForExistence(timeout: 5))
        }
        let menu = XCTAttachment(screenshot: springboard.screenshot())
        menu.name = "Home Screen quick actions"
        menu.lifetime = .keepAlways
        add(menu)
        springboard.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Review saved words")).firstMatch.tap()
        XCTAssertTrue(app.wait(for: .runningForeground, timeout: 10))
        XCTAssertTrue(app.staticTexts["Welcome back"].waitForExistence(timeout: 10))
        app.terminate()
        XCUIDevice.shared.press(.home)
        XCTAssertTrue(icon.waitForExistence(timeout: 10))
        icon.press(forDuration: 1.2)
        springboard.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Talk to Vey")).firstMatch.tap()
        XCTAssertTrue(app.wait(for: .runningForeground, timeout: 10))
        XCTAssertTrue(app.staticTexts["Welcome back"].waitForExistence(timeout: 10))
    }
}
