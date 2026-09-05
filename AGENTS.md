# Veylo development rules

- Before a non-trivial task, present a concise plan covering architecture, steps and edge cases, and wait for approval. Non-trivial means more than one class, a new dependency or an ambiguous requirement. An existing approval remains valid for its scope.
- Do not add comments in owned code. Use clear names and put decision rationale in ADRs. Required tool directives and third-party licenses must remain intact.
- Use single responsibility, encapsulation and composition over inheritance. Do not create dead code, placeholders or unused abstraction layers.
- Keep dependencies Interfaces → Application → Domain. Infrastructure implements application ports; Composition constructs adapters. Core must not import Next.js, React, Zod, Supabase or platform globals.
- Keep browser audio, DOM and IndexedDB in web adapters. Native applications are separate work; shared contracts and design data are prepared here.
- Use the root pnpm workspace and frozen lockfiles. Never print or commit environment secrets, database dumps, learner text or recordings.
- Do not reset a working Supabase database. Preserve applied migration files and the local project ID; introduce schema changes with new migrations.
- Run checks appropriate to the change. Architecture/API changes require `pnpm check`, SQL/integration tests and relevant E2E; public contract changes require `pnpm swift:check`. Python changes require `pnpm python:check`.
- New code follows root formatting, lint and TypeScript configurations. Use Conventional Commits. Keep ordinary PRs small and reviewable.
- Follow the Next.js guide in apps/web/AGENTS.md before changing framework behavior.

See docs/architecture.md, docs/contributing.md and docs/runbooks for ownership and operations.
