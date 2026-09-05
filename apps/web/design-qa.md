# Veylo theme verification

Date: 5 September 2026

## Accepted design

The approved Veylo palette and supplied Phantom reference now apply throughout the workspace and public screens. Aubergine supplies headings and dark banners; Ghost Lavender supplies primary controls; the five learning skills retain distinct blue, lavender, blush, butter and periwinkle surfaces. Text on these surfaces uses darker semantic inks. Vey retains the previously approved shaded lavender artwork, expressions, motion and cursor tracking.

The design system is documented in `docs/veylo-design-system.md`. `src/app/styles/theme.css` is the source of palette, role, font-weight, tracking, radius and elevation tokens. The earlier QA report is archived locally in `.local/design-qa/before-veylo-theme.md`.

## Implementation

- The shared theme replaces the old coral, orange, magenta and cool-neutral literals in workspace, public, chat, landing and arcade styles.
- Red primary actions, dark promotional banners and error states are assigned separate roles. Pastel controls use dark text. Destructive actions and recording use berry with near-white text.
- The original local Nunito Sans and OrbitDisplay fonts, component font weights, letter spacing and line heights were restored at the user’s request after the palette update.
- Cards use soft radii, navigation and action controls use capsules, and interface decoration uses borders plus a restrained lavender button glow. Mascot rendering and motion are preserved.
- Inline charts, process diagrams, personality colors, introduction captions and game canvas drawing consume the theme. The arcade SVG icons use matching brand colors.
- Sidebar, dashboard, statistics, history, vocabulary, account, tests, exercises, results, chat, registration, authentication and public pages were reviewed. Public feature-gallery captures now show the themed workspace.

## Verification

- TypeScript and ESLint passed.
- Unit suite: 84 tests passed in 9 files.
- Production build passed. Existing ONNX Runtime dynamic-require warnings remain unchanged.
- Chrome and WebKit: 22 browser scenarios passed, covering desktop and mobile layouts, profile saving, statistics filters, vocabulary search, keyboard navigation, administrator routes, reduced motion, authentication, registration, public assets, game controls, assessments and all Reading/Task 1 visualizations.
- After the final contrast corrections, four additional Chrome runs passed: preview capture, visualization rendering, introduction/carousel/consent and floating chat with a network retry and completed audio reply.
- Main workspace screens were checked at 390, 768, 1280 and 1920 px without horizontal document overflow. The public gallery contains fourteen refreshed 1440 px desktop and 390 px phone captures.
- A browser audit checked computed foreground/background contrast on ten routes, including the dashboard, statistics, vocabulary, account, AI, arcade, catalog, landing and quiz. It found pale weekday labels and muted text on tinted surfaces; these were corrected. The final audit reported no failing visible HTML text pairs in those inspected states.

Representative text contrast ratios: primary action 9.10:1; Vocabulary 5.03:1; Reading 5.71:1; Writing 5.38:1; Speaking 5.62:1; success 5.79:1; error 4.80:1; dark banners 11.52:1.

The contrast audit excludes hidden/disabled elements, decorative SVG artwork and translucent animation states. It is a targeted check, not a full accessibility certification. Existing live-AI configuration requirements are unchanged; the chat scenario uses local test responses.

## Local environment

The updated production build is running at `http://127.0.0.1:3000`. The preliminary dev-server run on port 3001 hit the screenshot test's original one-minute limit and the configured API origin guard when saving a profile. Re-running against the production origin with a suitable screenshot timeout passed; no origin restrictions were weakened.
