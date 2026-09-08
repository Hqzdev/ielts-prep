# iOS backend

The native application uses the shared Supabase accounts, task bank, results and vocabulary through versioned `/api/v1/ios` routes. Web routes keep their Gemini provider. Native text AI uses GigaChat. No demo state is imported into real accounts.

## Release scope

| Area        | Behaviour                                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------------------ |
| Identity    | Verified email signup, password login/recovery, Google through Supabase PKCE, Keychain session refresh       |
| Onboarding  | Five persisted steps, explicit unknown answers, revision conflicts, editable confirmation, completion events |
| Home        | Stable daily tasks, actual completions and timezone-aware streak                                             |
| Reading     | Published task snapshots, answer-key grading, draft revisions, highlights, question flags, timed practice    |
| Writing     | Private drafts, word count, submission, queued assessment, structured feedback and revisions                 |
| Progress    | Reading/Writing filters, comparable per-skill trends, insufficient-data states, no invented overall score    |
| Text tutor  | GigaChat personalities, IELTS prompts, attempt context, streaming, persisted messages and retries            |
| Vocabulary  | Search, topics, saved words, quizzes and GigaChat word assistance                                            |
| Word Sprint | Server-owned rounds, ten questions, three hearts and idempotent answers                                      |
| Profile     | Goals, timezone, study preferences, local reminders, sign-out and account deletion                           |
| Microphone  | DEBUG UI plus server allowlist; record/upload/play/delete only, no AI                                        |

Listening, public Speaking, full exams, voice AI, Speaking Shuffle and Listen & Match are not exposed in this release.

## Data and concurrency

Domain owns onboarding and forecast rules. Application services use persistence and AI ports. Supabase repositories and GigaChat transport implement those ports; Composition selects the provider. API response schemas strip internal fields before data reaches the strict generated Swift client.

The native migrations add revisioned onboarding/preferences, attempt notes, daily plans, onboarding events, provider provenance, a distributed GigaChat request lease and Word Sprint state. User-owned tables use RLS; mutation RPCs execute through the authenticated server and are not available directly to anonymous/authenticated clients.

Drafts use optimistic revisions. A conflict preserves local edits and asks the learner which version to keep. Retry-safe attempt creation and sprint submission prevent repeated taps from creating duplicate results. Timed attempts keep the server deadline when the app backgrounds.

Swift stores draft files by account and attempt with file protection and excludes them from backup. Passwords are not persisted by the app. Supabase manages tokens in Keychain. Local recordings are protected and cleared on sign-out. Server recordings use private Storage and short-lived playback URLs.

Forecasts require at least three separate study days spanning a week and comparable skill/task formats. A flat trend, excessive horizon or insufficient evidence yields an explicit reason instead of a date. Forecasts and bands are practice estimates.

## Local setup

```sh
pnpm install --frozen-lockfile
pnpm local:setup
pnpm dev
pnpm native:configure
```

The last command writes the ignored native public configuration. If port 3000 is occupied, set `APP_URL` to the actual development origin and pass `--api http://127.0.0.1:3001/api/v1`. Do not place service-role or GigaChat secrets in the app. See the [iPhone guide](../apps/ios/README.md) for Xcode and simulator commands.

Supabase must allow the native redirect URLs `veylo://auth/callback` and `veylo://auth/recovery`. Email confirmation stays enabled. Configure Google in Supabase before testing its browser redirect.

## GigaChat configuration

Configure the server environment from [the example](../apps/web/.env.example):

| Variable                         | Purpose                                                             |
| -------------------------------- | ------------------------------------------------------------------- |
| `GIGACHAT_CREDENTIALS`           | Server-only authorization credentials                               |
| `GIGACHAT_SCOPE`                 | API scope; default `GIGACHAT_API_PERS`                              |
| `GIGACHAT_CA_FILE`               | Absolute path to the trusted CA PEM bundle required by the provider |
| `IOS_GIGACHAT_TEXT_MODEL`        | Text tutor and assistance model; default `GigaChat-2-Pro`           |
| `IOS_GIGACHAT_WRITING_MODEL`     | Writing model; default `GigaChat-2-Max`                             |
| `IOS_WRITING_ASSESSMENT_ENABLED` | Remains `false` until calibration passes                            |
| `IOS_RECORDING_TESTER_IDS`       | Comma-separated Supabase UUIDs allowed into the recording lab       |

OAuth tokens are cached and refreshed. A database lease serializes provider requests for the personal API scope. Requests have bounded timeouts; authentication retries are bounded. TLS validation stays enabled with provider-specific certificate trust.

Writing uses a strict structured response, validates criteria and exact quotations against the submitted answer and allows one repair attempt. Malformed or unsupported output is never turned into a fabricated grade. The chosen provider/model is retained for assessments and assistant-message retries.

Tutor requests use the learner's actual task context. Active timed attempts reject hints. No Speaking audio is sent to GigaChat. Streaming disconnects and provider errors leave a retryable conversation state. Logs contain operation identifiers, timing, status and usage counts rather than essays, audio or credentials.

Provider references: [REST API](https://developers.sber.ru/docs/ru/gigachat/api/reference/rest/gigachat-api), [structured output](https://developers.sber.ru/docs/ru/gigachat/guides/structured-output).

## Calibration before enabling Writing

Prepare an expert-scored Writing corpus with separate Task 1 and Task 2 samples. Each needs at least five tuning and ten holdout examples. Holdout examples run twice.

```sh
pnpm assessment:evaluate --schema
pnpm assessment:evaluate --provider gigachat --corpus /absolute/path/writing-corpus.json
pnpm assessment:evaluate --provider gigachat --corpus /absolute/path/writing-corpus.json --live
```

The validation-only command makes no provider requests. The explicit live command requires credentials and incurs provider usage. Both task groups must pass: mean absolute error at most 0.5, at least 80% within 0.5, repeat-run variation at most 0.5, no missing assessable results, and valid evidence. An expert must review the feedback itself. Recalibrate after a model or rubric change.

There is no expert corpus or live GigaChat credential configured in the current local environment, so Writing grading remains off. Work can still be submitted and saved.

## Verification commands

```sh
pnpm check
pnpm test:sql
NATIVE_API_BASE=http://127.0.0.1:3001 pnpm test:integration
PLAYWRIGHT_CHROME_CHANNEL=chromium PLAYWRIGHT_BASE_URL=http://127.0.0.1:3001 pnpm test:e2e
pnpm swift:check
pnpm native:prepare-tests
```

SQL and integration tests use disposable local accounts and rolled-back SQL transactions. Browser tests require installed Playwright browsers. Native journey tests use the real local HTTP API and attach screenshots to the Xcode result bundle. Native rules include nullable answer serialization and account-isolated drafts.

## Verified locally on 8 September 2026

- `pnpm check`: formatting, 275-module architecture validation, 86 API operations, design assets, lint, TypeScript, 118 unit tests, content validation and production build passed.
- Twenty integration tests and three SQL suites passed, including account isolation, onboarding revisions, deterministic Reading results, provider provenance and retry-safe Word Sprint answers.
- Fifty-seven browser scenarios passed across the full run and targeted reruns; five environment-dependent scenarios were skipped.
- The generated Swift contract client compiled. The current native suite passed 29 unit tests.
- The complete small-iPhone UI journey passed: onboarding, session restoration, Writing submission without a fabricated grade, Reading results, progress, vocabulary, Word Sprint results, profile editing and the AI capability state.
- The recording UI test passed on the large iPhone simulator: real WAV capture, private upload, playback, submission and deletion. A second pass verified asynchronous audio-session activation and recorder preparation outside the main actor. Silence or unavailable meter values do not produce invalid animation sizes.

The additional native Release build was stopped at the user's request before completion. Debug builds and the native tests above passed.

Live Google OAuth, a physical-device recording, GigaChat responses and cloud deployment require their respective configured external environments. Writing calibration has not run because provider credentials and the expert corpus are absent.

## Cloud staging

Cloud deployment is not configured by these local changes. It needs a Veylo Supabase project, HTTPS API hosting, server secrets, email delivery, Google OAuth credentials and the native redirect URLs. Apply migrations, seed the published content, configure private Storage and schedule the existing maintenance worker. The host must support the required background-work and maintenance frequency; a once-daily-only scheduler is insufficient for a minute-based configuration.

Point a signed iPhone build at staging with `native:configure`, verify two-account isolation and callback flows, then test a real GigaChat request before starting calibration. Enable Writing grading only after the calibration report passes. Keep the recording allowlist restricted to test accounts.
