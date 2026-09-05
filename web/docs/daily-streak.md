# Daily learning flame

One completed activity earns one flame for the learner's local calendar day. Consecutive days extend the current streak; yesterday remains active until the end of today. Missing an entire day resets the current streak while the best streak remains. Saved day boundaries retain the time zone used when the activity was completed.

Qualifying activities: a submitted practice attempt with a nonempty answer or a ready recording, a submitted vocabulary quiz with an answer, a completed Arcade round with speech or Runner answers, or three nonempty learner replies in one conversation on the same local day. AI grading success is not required.

Database triggers save one row per learner and date in learning_days. Only the server writes these records. Existing qualifying practice, vocabulary, Arcade and conversation history is imported by migration 202609050002_daily_streak.sql. Current and best streaks use the complete day history, independently of statistics filters. The shared provider refreshes on navigation, successful activity, focus, visibility and every minute while visible.

Runner completion requires all eight answers, or the full timer with at least one answer. Speaking games require the full timer and detected speech. Arcade rounds are created on the server before starting and saved on completion; a failed save can be retried.

## Asset

Built-in image_gen tool. Transparent PNG: public/icons/veylo-flame.png. The shared StreakFlame component supplies this image to the dashboard, statistics, sidebar, weekly calendar, completion notification and Arcade result. Next Image serves appropriately sized versions. Inactive states use CSS; the source alpha is preserved.

Final generation prompt:

Use case: stylized-concept. Asset type: custom daily learning streak icon for Veylo, a lavender educational web app. Create ONE beautifully polished, soft inflated 3D flame icon, isolated on a genuinely transparent alpha background. A bold readable rounded flame silhouette, with a curved tall central tip and two smaller softly rounded side flicks, thick soft body. Outer flame is blush pink #ffdadc shading into pastel lilac #ab9ff2 around the cool edges, inner flame is warm buttercream #ffffc4 with an ivory core. Glossy candy-like material, tasteful bright specular highlights from upper left, dimensional soft lavender shading, gently luminous center. Front-facing with very slight 3D depth, strong legibility when used at 24px or 80px in a UI. Centered square composition, icon occupies about 85% of the square with enough transparent padding around tips. No face, eyes, text, letters, numbers, badge, frame, pedestal, floor, ground shadow, other objects, particles, checkerboard or background color. Preserve real transparency. This is the final production-ready icon, not a presentation sheet.

## Verification

Unit cases: tests/daily-streak.test.ts. Transactional database checks: supabase/tests/daily_streak.sql. Browser and API checks: tests/e2e/daily-streak.spec.ts and tests/e2e/arcade-round.spec.ts. The SQL checks run inside a transaction and roll back all fixtures.
