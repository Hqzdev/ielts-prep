<p align="center">
  <img src="assets/readme/hero.svg" width="100%" alt="Veylo — Reading, Writing and Speaking in one workspace with Vey">
</p>

<p align="center">
  <a href="https://github.com/Hqzdev/ielts-prep/actions/workflows/check.yml"><img src="https://github.com/Hqzdev/ielts-prep/actions/workflows/check.yml/badge.svg?branch=main" alt="Verify CI status"></a>
  <img src="https://img.shields.io/badge/Next.js-16-3c315b?style=flat-square" alt="Next.js 16">
  <img src="https://img.shields.io/badge/TypeScript-5.9-65548e?style=flat-square" alt="TypeScript 5.9">
  <img src="https://img.shields.io/badge/pnpm-monorepo-ab9ff2?style=flat-square" alt="pnpm monorepo">
</p>

<p align="center">
  <a href="#how-to-install">Install</a> ·
  <a href="#inside-veylo">Features</a> ·
  <a href="#architecture">Architecture</a> ·
  <a href="#tech-stack">Tech stack</a> ·
  <a href="#documentation">Documentation</a>
</p>

**Veylo is a workspace for IELTS Academic preparation.** Practise with tasks, save drafts, build speaking confidence with Vey, and return each day to earn another flame. The web app runs locally; shared API contracts and design data are ready for future iOS and macOS apps.

<a href="assets/readme/reading-desktop.png"><img src="assets/readme/reading-desktop.png" width="100%" alt="Veylo catalogue: 46 Academic Reading tests, random task selection and workspace navigation"></a>

<sub>Real interface, Chrome, test account. Click a screenshot to view it at full size.</sub>

## Inside Veylo

| Area                  | What you can do                                                                                                                      |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Practice**          | Choose Reading, Writing and Speaking tasks; save drafts, resume after a reload, and review Reading results.                          |
| **Vey AI**            | Choose a conversation partner's personality and practise speaking. Vey listens, speaks, changes expressions and follows your cursor. |
| **Vocabulary**        | Review words by topic, take quizzes and build a personal word bank.                                                                  |
| **Daily flame**       | Complete activities and maintain a streak in your own time zone.                                                                     |
| **Progress & Arcade** | Track your practice history and train through short game rounds.                                                                     |

### One Vey, different personalities

<a href="assets/readme/vey-ai-desktop.png"><img src="assets/readme/vey-ai-desktop.png" width="100%" alt="Vey AI: Angry, Kind and Sarcastic personality cards with distinct facial expressions"></a>

<details>
<summary><strong>More screenshots: daily plan, vocabulary and mobile views</strong></summary>

#### Daily plan and learning flames

![Veylo dashboard: exam goal, practice plan and weekly learning flames](assets/readme/dashboard-desktop.png)

#### Vocabulary

![Vocabulary: daily review, themed decks and a 300-word dictionary](assets/readme/vocabulary-desktop.png)

<p align="center">
  <img src="assets/readme/reading-mobile.png" width="31%" alt="Reading catalogue on mobile">
  <img src="assets/readme/vocabulary-mobile.png" width="31%" alt="Vocabulary review on mobile">
  <img src="assets/readme/vey-ai-mobile.png" width="31%" alt="Angry personality card on mobile, with Vey's matching expression">
</p>

</details>

### Practice bank

<img src="assets/readme/content-bank.svg" width="100%" alt="146 tasks: 46 Reading, 40 Writing and 60 Speaking. Vocabulary: 300 words across 15 topics">

The repository includes **146 tasks: 46 Reading, 40 Writing and 60 Speaking**, plus **300 words across 15 topics**. Reading covers 14 question formats. These figures describe the local content bank. The [content validator](apps/web/scripts/validate-content.ts) checks structure, answer keys and supporting quotations.

### How a flame is earned

```mermaid
flowchart LR
    A[Complete an activity] --> B{Flame already earned today?}
    B -->|No| C[Record the learning day]
    B -->|Yes| D[Save the result only]
    C --> E[Update the streak]
    D --> E
    style A fill:#e2dffe,stroke:#65548e,color:#3c315b
    style B fill:#ffffc4,stroke:#74651f,color:#3c315b
    style C fill:#ffdadc,stroke:#864751,color:#3c315b
    style D fill:#fdfcfe,stroke:#b5a9c9,color:#3c315b
    style E fill:#ab9ff2,stroke:#65548e,color:#3c315b
```

Qualifying activities include a submitted practice attempt or quiz, a completed game round, or three nonempty learner replies in one conversation on the same day. A flame does not require successful AI grading. Missing an entire day resets the current streak; the best streak is preserved. [Read the full rules](docs/daily-streak.md).

## How to install

You need **Node.js 24.17.0**, **pnpm 11.19.0**, and a running **Docker Desktop or OrbStack**. Python, Swift and a Gemini key are optional for the initial setup.

```sh
git clone https://github.com/Hqzdev/ielts-prep.git
cd ielts-prep
pnpm install --frozen-lockfile
pnpm local:setup
pnpm dev
```

Open **[127.0.0.1:3000/login](http://127.0.0.1:3000/login)** → **Open local account** → **Tests** → **Reading**. Choose a task and save your first answer.

`local:setup` starts local Supabase, applies migrations, imports tasks and vocabulary, and creates `apps/web/.env.local`. Running it again preserves existing settings without duplicating the content bank. Quick local sign-in is available only in development with a local database.

<details>
<summary><strong>AI, Google sign-in and environment variables</strong></summary>

| Setting                                                     | Purpose                                                                                            |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `GEMINI_API_KEY`                                            | Server-side Gemini access for AI features.                                                         |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`                  | Google OAuth in the Supabase environment; requires your own credentials and allowed callback URLs. |
| `ASSESSMENT_WRITING_ENABLED`, `ASSESSMENT_SPEAKING_ENABLED` | Separately enable grading after expert calibration.                                                |

See [apps/web/.env.example](apps/web/.env.example) for the available settings. Keep secrets in your local environment; `.env.local` is excluded from Git.

Without Gemini, you can still save work and recordings, practise Reading, use vocabulary and maintain a learning streak. Writing/Speaking grading remains behind feature flags until its quality has been validated. Reading scores are estimates, not official IELTS results.

For a new Google configuration, follow the [environment setup guide](docs/runbooks/deployment.md). Google OAuth is optional for local development.

</details>

## Architecture

**A monorepo with layered architecture.** The main dependency direction is **Interfaces → Application → Domain**. Infrastructure implements Application ports, while Composition assembles use cases and adapters.

<img src="assets/readme/architecture.svg" width="100%" alt="Interfaces depend on Application, which depends on Domain. Infrastructure implements ports; Composition connects adapters and use cases">

Domain is independent of Next.js, React, Supabase and platform APIs. Browser audio, DOM and IndexedDB stay in web adapters. Run `pnpm architecture:check` to verify import boundaries and detect dependency cycles.

| Path                                                 | Responsibility                                             |
| ---------------------------------------------------- | ---------------------------------------------------------- |
| [`apps/web`](apps/web)                               | Next.js, pages, HTTP, Auth and browser adapters.           |
| [`packages/backend`](packages/backend)               | Domain, Application, Infrastructure and Composition.       |
| [`packages/contracts`](packages/contracts)           | Zod → OpenAPI 3.1: 46 operations under `/api/v1`.          |
| [`packages/api-client`](packages/api-client)         | A typed TypeScript HTTP client.                            |
| [`packages/design-tokens`](packages/design-tokens)   | Colours, typography, assets and Vey parameters.            |
| [`packages/ui-web`](packages/ui-web)                 | The SVG character, motion, gaze and shared web models.     |
| [`tools/content-generator`](tools/content-generator) | A Python generator for practice materials.                 |
| [`tools/api-compatibility`](tools/api-compatibility) | Swift client generation and compilation from the contract. |
| [`infra/supabase`](infra/supabase)                   | Database, Auth, Storage, SQL migrations and checks.        |

```mermaid
flowchart LR
    C[Zod contracts] --> O[OpenAPI 3.1]
    O --> T[TypeScript SDK]
    O --> S[Swift compatibility check]
    T --> W[Web application]
    S -. next phase .-> N[iOS / macOS]
    style C fill:#e2dffe,stroke:#65548e,color:#3c315b
    style O fill:#3c315b,stroke:#3c315b,color:#fdfcfe
    style T fill:#e2dffe,stroke:#65548e,color:#3c315b
    style S fill:#e2dffe,stroke:#65548e,color:#3c315b
    style W fill:#ab9ff2,stroke:#65548e,color:#3c315b
    style N fill:#fdfcfe,stroke:#b5a9c9,color:#3c315b
```

**The iOS and macOS apps have not been built yet.** Their API, Bearer authentication and shared design data are prepared; Swift client compatibility is verified through compilation. See the [architecture decision](docs/adr/001-layered-monorepo.md) and [native client contract](docs/adr/002-api-and-native-clients.md).

## Tech stack

| Area                    | Technologies                                                       |
| ----------------------- | ------------------------------------------------------------------ |
| Foundation              | Node.js 24 · pnpm 11 workspaces · TypeScript 5.9                   |
| Web                     | Next.js 16 App Router · React 19 · Tailwind CSS 4 · CSS · Radix UI |
| Visualisation           | SVG · Recharts · React Flow · Phosphor / Lucide                    |
| Data and authentication | PostgreSQL 17 · Supabase Auth · private Supabase Storage           |
| AI and background jobs  | Google Gemini · Workflow                                           |
| Voice and local data    | Web Audio · VAD / ONNX · WAV PCM · IndexedDB                       |
| API                     | Zod 4 · OpenAPI 3.1 · openapi-typescript · openapi-fetch           |
| Python                  | Python 3.13 · uv · Pydantic · google-genai · Black · Ruff          |
| Apple compatibility     | Swift 6.1+ · Swift OpenAPI Generator / Runtime / URLSession        |
| Quality                 | Vitest · Playwright · SQL · ESLint · Prettier · GitHub Actions     |

## Verification

<img src="assets/readme/verification.svg" width="100%" alt="Local verification on 6 September 2026: 105 unit, 14 integration, 57 browser and 4 Python tests passed, with 5 expected browser skips">

Local verification snapshot, **6 September 2026**: **105 unit**, **14 integration**, **57 browser** and **4 Python** tests passed, with **5 expected browser skips**. Two SQL suites, the production build, a clean installation and Swift compilation also passed. These are test counts, not coverage percentages. The Verify badge above shows the remote CI status. [Read the detailed report](docs/migration-report.md).

```sh
pnpm check
pnpm test:sql
pnpm test:integration
pnpm test:e2e
```

SQL checks require local Supabase; integration and E2E checks also need a running app. Before your first E2E run, install browsers with `pnpm exec playwright install chromium chrome webkit`. Audio tests use prepared recordings and AI stubs.

<details>
<summary><strong>Generation, Python, Swift and development rules</strong></summary>

| Command                                              | Purpose                                                        |
| ---------------------------------------------------- | -------------------------------------------------------------- |
| `pnpm api:generate`                                  | Update OpenAPI and the TypeScript SDK after a contract change. |
| `pnpm design:generate`                               | Update CSS and assets from shared design data.                 |
| `pnpm architecture:check`                            | Verify import directions and detect dependency cycles.         |
| `uv sync --project tools/content-generator --frozen` | Install the locked Python environment with uv.                 |
| `pnpm python:check`                                  | Run Black, Ruff, tests and the CLI check.                      |
| `pnpm swift:check`                                   | Generate and compile the client; requires Swift 6.1+.          |

Pre-commit checks formatting, layers, contracts, types and linting. Commit-msg enforces Conventional Commits. CI verifies that generated files match their source data. [Development guidelines](docs/contributing.md).

</details>

## Documentation

| Understand the project                                          | Prepare for operations                                 |
| --------------------------------------------------------------- | ------------------------------------------------------ |
| [Architecture and boundaries](docs/architecture.md)             | [Deployment and rollback](docs/runbooks/deployment.md) |
| [API and Apple clients](docs/adr/002-api-and-native-clients.md) | [Backup and recovery](docs/runbooks/recovery.md)       |
| [Veylo design system](docs/veylo-design-system.md)              | [Logs and diagnostics](docs/runbooks/observability.md) |
| [Learning flame streaks](docs/daily-streak.md)                  | [Assessment quality](docs/assessment-quality.md)       |
| [README visual sources](assets/readme/README.md)                | [Migration report](docs/migration-report.md)           |

Staging/production, branch protection and centralised metrics still need configuration. Publishing the repository does not deploy the website. A code licence has not been selected yet; third-party font licences are preserved alongside their assets.

<p align="center">
  <img src="packages/design-tokens/assets/veylo-flame.png" width="56" alt="Veylo daily learning flame"><br>
  <strong>One practice. One flame. See you tomorrow.</strong><br>
  <a href="#how-to-install">Run Veylo locally</a>
</p>
