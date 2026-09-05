import { authoredBank } from "../src/content/bank";
import { ContentValidator } from "@veylo/backend/validation/content-validator";
const entries = new ContentValidator().validate(authoredBank());
console.log(
  JSON.stringify(
    {
      tasks: entries.length,
      reading: entries.filter((e) => e.task.skill === "reading").length,
      formats: [
        ...new Set(
          entries
            .filter((e) => e.task.skill === "reading")
            .map((e) => e.task.format),
        ),
      ].length,
      evidence: "validated",
    },
    null,
    2,
  ),
);
