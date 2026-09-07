# Veylo for iOS

Open `../Veylo.xcworkspace` and choose **Veylo iOS**. Minimum OS version: 27.0, preserved from the supplied project.

Sources live in `Veylo/`:

- `Domain`: pure entities and business rules.
- `Application`: use cases and service protocols; depends on Domain.
- `Infrastructure`: implementations of Application protocols.
- `Interfaces`: SwiftUI screens, state, navigation and motion; calls Application.
- `Composition`: app entry point, dependency construction and injection.
- `Resources`: platform-specific assets.

The iOS app implements the approved Pencil flow as an offline interactive prototype. Domain owns onboarding and practice values; Application owns onboarding, session and persistence scenarios. Infrastructure provides sample content and a JSON repository. Interfaces contains the SwiftUI screens, navigation, animation tokens and observation state. Layers share one app target; compiler-level module isolation is not implemented. Layer documentation is excluded from the app bundle.

The projects own separate sources, assets and bundle identifiers. No references to the sibling platform are allowed. Shared Swift packages require a concrete shared use case.

See [native architecture](../../docs/adr/003-native-app-layers.md).

## Try the prototype

- On the sign-in screen, **Continue with Google** opens a returning learner demo with sample progress.
- **Create an account** opens registration and the five-step survey. Enter any valid-looking email and a password of at least eight characters. No real account is created and the password is never stored.
- The four tabs retain separate navigation histories. The plus button opens Vey AI and Arcade.
- Practice supports Reading, Listening, Writing and Speaking, plus a short full-exam journey. The practice menu can finish a demo section immediately.
- Scores, forecasts, chat replies, playback and recording are demonstrations. The app makes no network requests and never requests microphone or notification permission.
- Profile choices, onboarding, drafts, answers, vocabulary and game scores persist in Application Support. **Profile → Privacy & account → Reset all demo data** clears this prototype's data.

The screens follow `design.pen`: Nunito Sans, skill-specific colours, native Liquid Glass, a large result score and contextual IELTS coaching. Motion responds to Reduce Motion; glass responds to Reduce Transparency. Content scrolls for larger text and smaller devices. iPad uses a centred content column.

## Build and test

Select **Veylo iOS** in the shared workspace and an iOS 27 simulator. This machine has Xcode 27 installed as `Xcode-beta.app`; CLI calls can select it without changing the global Xcode setting:

```sh
DEVELOPER_DIR=/Applications/Xcode-beta.app/Contents/Developer xcodebuild -workspace apps/Veylo.xcworkspace -scheme 'Veylo iOS' -destination 'platform=iOS Simulator,name=iPhone 17 Pro' test
```

`VeyloTests` covers onboarding validation, resumption, local persistence and the full exam sequence. `VeyloUITests` walks the visible flows and attaches screenshots. Swift formatting is configured in `.swift-format`. Xcode previews provide sign-in, returning Home and empty Progress examples without writing files.

Development launch arguments:

- `--uitesting`: isolated local storage for UI tests.
- `--reset-demo`: reset the selected demo storage before launch.
- `--demo-home`: open the populated returning learner demo.

No server contracts, shared web styles or macOS sources are changed by the prototype. Future backend adapters replace the local Application ports; UI navigation stays in Interfaces.
