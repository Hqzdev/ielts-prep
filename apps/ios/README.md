# Veylo for iOS

Open `../Veylo.xcworkspace` and choose **Veylo iOS**. The application targets **iPhone, iOS 27**, with an English light interface. macOS keeps separate sources, assets and a starter scheme.

## Connect the app

Run these commands from the repository root:

```sh
pnpm install --frozen-lockfile
pnpm local:setup
pnpm dev
pnpm native:configure
```

`native:configure` reads the public Supabase URL/key and `APP_URL` from `apps/web/.env.local`. It creates the ignored `Veylo/Resources/BackendConfiguration.plist`. If the development server uses another port, pass `pnpm native:configure --api http://127.0.0.1:3001/api/v1`. Rebuild after changing configuration.

Only the Supabase publishable/anon key belongs in this bundle. Service credentials and GigaChat keys stay on the server. Simulator builds allow loopback HTTP; release builds require HTTPS. A physical iPhone needs reachable HTTPS API and Supabase endpoints.

Create an email account, verify the email, then sign in and complete the five questions. Local confirmation mail is available in Supabase's mail viewer, shown by `pnpm exec supabase status --workdir infra`. Google uses Supabase OAuth and needs configured Google credentials. Allow `veylo://auth/callback` and `veylo://auth/recovery` in Supabase redirect URLs.

## Connected flows

- Email/password, Google OAuth, password recovery and Keychain session restoration.
- Revisioned onboarding, editable confirmation, profile, goals and notification preferences.
- Home tasks, Reading and Writing catalogue, practice/timed attempts, private local drafts and server resumption.
- Reading answer-key feedback; Writing submission and asynchronous assessment when enabled.
- Per-skill progress and forecasts based on comparable results, vocabulary and server-scored Word Sprint.
- GigaChat text tutoring, contextual prompts, hints and word assistance when the server has credentials.

New accounts have no invented results or streak. Demo data is never migrated into real accounts. Writing assessment remains disabled until an expert calibration run passes. Missing AI credentials produce an explicit unavailable state.

Listening, public Speaking, full exams and voice AI are outside this release. A **DEBUG-only recording lab**, additionally gated by the server's `IOS_RECORDING_TESTER_IDS`, uses the microphone to save WAV PCM mono 16 kHz recordings. It supports private upload, playback and deletion. No speech AI, transcription or synthesis is called.

## Layers

- **Domain:** native value models and pure validation.
- **Application:** identity, remote data, draft, notification and audio ports.
- **Infrastructure:** generated Swift API client, Supabase Auth/Storage, local drafts, microphone and local notifications.
- **Interfaces:** SwiftUI screens, observation state, independent tab histories and animations.
- **Composition:** configuration and dependency assembly.

`Packages/VeyloAPI` pins Supabase Swift and Apple's OpenAPI packages. `pnpm api:generate` updates the specification and native operation adapter. Xcode generates the typed client during its build. Layer boundaries follow [ADR 003](../../docs/adr/003-native-app-layers.md); the layers share an app target.

## Home Screen quick actions

Touch and hold the Veylo icon to continue practice, keep your streak, talk to Vey or review saved words. Each action has a short subtitle and an SF Symbol. The system controls the menu layout and the Remove App action.

Actions wait for sign-in, password recovery and onboarding to finish. Continue practice resumes the most recently active unfinished task; otherwise it opens an incomplete daily task. Keep your streak opens progress when today is already complete. An empty plan falls back to the catalogue, and an offline request offers Retry. Talk to Vey opens the text coach; saved words opens the personal vocabulary filter.

`QuickActionTests` covers deferred routing, recent practice, daily-plan fallback and network failure. `QuickActionUITests` checks the real SpringBoard menu and warm/cold launches; use a fresh simulator with a configured native build and a signed-out account.

## Build and test

Install the iOS 27 runtime in Xcode and choose an available iPhone simulator. On a machine with Xcode installed as `Xcode-beta.app`:

```sh
DEVELOPER_DIR=/Applications/Xcode-beta.app/Contents/Developer xcodebuild test -workspace apps/Veylo.xcworkspace -scheme 'Veylo iOS' -destination 'platform=iOS Simulator,name=iPhone 17 Pro Max' -skipPackagePluginValidation CODE_SIGNING_ALLOWED=YES CODE_SIGN_IDENTITY=-
```

The pinned Apple OpenAPI build plugin must be trusted in Xcode or explicitly enabled for CLI builds. Ad-hoc signing is required for Keychain-backed simulator sessions.

`VeyloTests` covers native validation, nullable payloads, per-account storage and the existing visual demo rules. To exercise the real local API in `NativeJourneyUITests`:

```sh
pnpm native:prepare-tests
```

This creates an isolated verified local account and an ignored test-bundle fixture. Add `--recording` to include the microphone lifecycle and temporarily allowlist only this test account. Run the native UI test while the local API and Supabase are running, then remove the account and its allowlist entry with `pnpm native:prepare-tests --cleanup`. Prepare a fresh account for each new onboarding run. Screenshots are attached to the Xcode test result; failed UI runs also include a video.

Use `-parallel-testing-enabled NO` when granting simulator permissions to a particular device. For an automated recording run, grant that app's microphone permission with `xcrun simctl privacy <device-id> grant microphone yaroslavstrelkov.Veylo.ios`. A physical iPhone must display and accept its own permission prompt. No audio is sent to AI.

Development launch arguments:

- `--uitesting`: opens the isolated visual demo for the original design tests.
- `--reset-demo`: resets that demo storage.
- `--demo-home`: opens the populated visual reference.
- `--native-test-signout`: starts a native auth test from the sign-in screen.

These switches are compiled only in DEBUG. Normal launches always use the real backend. See [backend setup and release gates](../../docs/ios-backend.md).
