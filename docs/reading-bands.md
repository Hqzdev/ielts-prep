# Reading practice bands

Reading results show an estimated band alongside earned marks, total marks and accuracy. The dashboard, catalogue and progress chart use that same band. Accuracy by question type remains a percentage.

The server sums the marks awarded by ReadingGrader, including partial credit for multiple selections, and projects them to 40 with `Math.round(earned / possible * 40)`. The projection is an application estimate for short exercises. It does not account for the difficulty or range of a complete examination.

The reference thresholds from band 2.5 to 9 follow [IDP's Academic Reading table](https://ielts.idp.com/vietnam/about/news-and-articles/article-ielts-reading-common-questions/en-gb). Two marks correspond to band 2 in [IDP's preparation guide](https://ielts.idp.com/prepare/article-how-to-prepare-ielts-reading). This application's practice scale has a floor of 1 for zero or one projected mark. Missing or invalid grading data remains unscored. Conversion thresholds can vary between exam versions; this fixed table is indicative.

| Projected marks / 40 | Estimated band |
| -------------------- | -------------- |
| 39–40                | 9.0            |
| 37–38                | 8.5            |
| 35–36                | 8.0            |
| 33–34                | 7.5            |
| 30–32                | 7.0            |
| 27–29                | 6.5            |
| 23–26                | 6.0            |
| 20–22                | 5.5            |
| 16–19                | 5.0            |
| 13–15                | 4.5            |
| 10–12                | 4.0            |
| 7–9                  | 3.5            |
| 5–6                  | 3.0            |
| 3–4                  | 2.5            |
| 2                    | 2.0            |
| 0–1                  | 1.0            |

For example, 7/8 projects to 35/40 and band 8.0. Two marks out of three project to 27/40 and band 6.5.

New assessments persist their band with rubric version `reading-academic-practice-v1`. Legacy completed Reading assessments without a stored band derive one from their saved verdicts when read; the original answers and rubric metadata stay unchanged. Existing non-null bands are preserved. Revisions remain excluded from independent progress, and the planner compares all three skills on the same band scale.
