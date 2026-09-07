# iOS onboarding specification

Status: editable design in `design.pen`. Runtime validation, persistence and analytics are not implemented by this design change.

## Route

New account: Register → A → B → C → D → E → 04 Review → Home.

Existing account: Sign in → Home. An account with unfinished onboarding resumes its saved step. Password recovery is a separate branch back to sign-in.

Back preserves every answer. Editing from review returns to the chosen question, then back to review without repeating later steps. No global Skip is available.

## Questions

| Step             | Answer                                                                                                   | Validation                                                                                    |
| ---------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| A: starting band | Below 5.5; 5.5–6.0; 6.5–7.0; 7.5+; Not sure yet                                                          | Exactly one. Unknown stays unknown; a range is not converted into an exact score.             |
| B: target band   | 6.5; 7.0; 7.5; 8.0                                                                                       | Exactly one. Reuses the former screen 04 selector as component `J0cB19`.                      |
| C: exam date     | Calendar date or Haven’t booked yet                                                                      | Explicit answer. Default wheel position is not an answer. Dates before today are unavailable. |
| D: focus skills  | Reading; Listening; Writing; Speaking                                                                    | One or two. After two selections, unselected cards are disabled until one is deselected.      |
| E: main barrier  | Not enough time; unsure where to start; test-day anxiety; previous missed goal; Other; Prefer not to say | Exactly one. Other and Prefer not to say do not require free text.                            |

The continuous progress bar is distinct from the daily-plan indicator. It displays 20%, 40%, 60%, 80% and 100%. Every question has Back and a fixed bottom Next button. Next remains disabled until the current answer is valid.

The date uses an iOS wheel picker at implementation time. Store a calendar date, not a UTC timestamp. Choosing Haven’t booked yet clears the submitted date and enables Next.

A close-gap hint may appear when the starting range and target are close. It must not promise a specific month of success. An unknown starting band has no numeric gap. A target already within the starting range leads to confirmation through practice rather than an invented improvement requirement.

## Review and personalization

Screen 04 confirms starting band, target, date, focus skills and main barrier. Each edit affordance routes to its source question. Unknown score is shown as To be assessed; absent date as Not booked yet. Prefer not to say produces neutral guidance without inferring a barrier.

The displayed example selects 6.5–7.0, target 8.0, 9 March 2027, Listening and Speaking, and not enough time. Review proposes short sessions; Home shows 10 minutes remaining and Listening/Speaking activities. Actual results subsequently refine the plan and forecast.

The first Home after signup starts with no invented completed tasks or streak. Existing Home 05/06 illustrate a later returning session.

## Analytics to implement

| Event                      | Trigger                                                                                                           |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `account_created`          | Successful creation of an eligible new account, including Google signup. Existing-account login does not emit it. |
| `onboarding_started`       | First presentation of question A.                                                                                 |
| `onboarding_step_viewed`   | A question becomes visible; include its step and entry reason: forward, back, resume or review edit.              |
| `onboarding_answer_saved`  | A valid answer is persisted by Next or Save & review.                                                             |
| `onboarding_review_viewed` | Screen 04 is visible after the questionnaire.                                                                     |
| `onboarding_completed`     | The initial plan has persisted and the first Home is visible. Emit once per account and flow version.             |

Use a pseudonymous account ID, flow version, variant, step ID and timestamp to deduplicate and join events. Analytics needs progress metadata, not email, exam date, free text or the psychological answer. Personalization answers belong in the account data, with the implementation’s normal access controls.

Primary metric: unique eligible newly created accounts reaching `onboarding_completed` within seven days of signup, divided by all eligible newly created accounts in the same mature cohort. The seven-day window is the working measurement choice for this design; report it explicitly. Exclude internal/test accounts and do not mix cohorts with less than seven days of observation into the final rate.

Also inspect Register → A loss, A→B→C→D→E→Review→Home conversion, resume rate and time to completion. Keep review edits and repeated views from inflating unique-user conversion.

The requested 60% threshold triggers investigation and an experiment with A → B → D. It does not by itself prove that questionnaire length caused abandonment. In the shorter variant, request C and E after the first day inside the app or through a permitted push. Compare completion together with first-practice activation and later engagement, not completion alone.

No real completion rate is available from static mockups. Analytics wiring and runtime checks belong to the approved implementation stage.
