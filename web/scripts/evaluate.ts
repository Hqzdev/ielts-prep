import { config } from "dotenv";
import { parseArgs } from "node:util";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  calibrationCorpusSchema,
  CalibrationEvaluator,
  type CalibrationMeasurement,
} from "../src/domain/calibration";
import { GeminiProvider, type AudioInput } from "../src/server/services/gemini";
import { BandCalculator } from "../src/domain/assessment";
import type { Attempt } from "../src/domain/attempt";
import { WavCodec } from "../src/domain/wav";

config({ path: ".env.local", quiet: true });
const { values } = parseArgs({
  options: {
    corpus: { type: "string" },
    output: { type: "string", default: ".local/assessment-evaluation.json" },
    live: { type: "boolean", default: false },
    schema: { type: "boolean", default: false },
  },
});
if (values.schema)
  console.log(JSON.stringify(z.toJSONSchema(calibrationCorpusSchema), null, 2));
else if (!values.corpus)
  console.log(
    "pnpm assessment:evaluate --corpus /path/corpus.json [--live] [--output .local/report.json]\nWithout --live only validates the expert corpus; no AI requests are made. --schema prints its JSON schema.",
  );
else {
  const corpusPath = resolve(values.corpus);
  const evaluator = new CalibrationEvaluator();
  const corpus = evaluator.validate(
    calibrationCorpusSchema.parse(
      JSON.parse(await readFile(corpusPath, "utf8")),
    ),
  );
  const key = process.env.GEMINI_API_KEY ?? "";
  if (values.live && !key)
    throw new Error(
      "Set GEMINI_API_KEY in web/.env.local for an explicit live run",
    );
  const settings = {
    key,
    textModel: process.env.GEMINI_TEXT_MODEL ?? "gemini-3.5-flash",
    audioModel: process.env.GEMINI_AUDIO_MODEL ?? "gemini-3.5-flash",
    ttsModel: process.env.GEMINI_TTS_MODEL ?? "gemini-3.1-flash-tts-preview",
    voice: process.env.GEMINI_VOICE ?? "Kore",
  };
  const provider = values.live ? new GeminiProvider(settings) : null;
  const measurements: CalibrationMeasurement[] = [];
  for (const sample of corpus) {
    const audio: AudioInput[] = [];
    for (const input of sample.audio) {
      const bytes = await readFile(resolve(dirname(corpusPath), input.path));
      const info = new WavCodec().inspect(Uint8Array.from(bytes).buffer);
      if (info.sampleRate !== 16000)
        throw new Error(`Audio must use 16 kHz: ${sample.id}`);
      audio.push({
        id: randomUUID(),
        questionIndex: input.questionIndex,
        duration: info.duration,
        base64: bytes.toString("base64"),
      });
    }
    const bands: (number | null)[] = [];
    if (provider) {
      const now = new Date().toISOString();
      const attempt: Attempt = {
        id: randomUUID(),
        userId: "calibration",
        taskId: sample.task.id,
        taskVersion: 1,
        taskSnapshot: sample.task,
        mode: "strict",
        status: "submitted",
        answer: {
          text: sample.answer,
          reading: {},
          audioIds: audio.map((a) => a.id),
        },
        revision: 1,
        parentAttemptId: null,
        startedAt: now,
        deadlineAt: now,
        submittedAt: now,
        elapsedSeconds: sample.task.durationSeconds,
        activeSince: null,
        createdAt: now,
        updatedAt: now,
      };
      for (let run = 0; run < (sample.split === "holdout" ? 2 : 1); run++) {
        const transcripts = [];
        for (const recording of audio)
          transcripts.push(await provider.transcribe(recording));
        const grade = await provider.assess(attempt, audio, transcripts);
        bands.push(
          grade.sufficientEvidence
            ? new BandCalculator().calculate(grade.criteria.map((c) => c.score))
            : null,
        );
      }
    }
    measurements.push({
      id: sample.id,
      group: `${sample.task.skill}-${sample.task.part}`,
      split: sample.split,
      expertBand: sample.expertBand,
      bands,
    });
  }
  const report = {
    mode: values.live ? "live" : "corpus-validation",
    createdAt: new Date().toISOString(),
    rubricVersion: "ielts-academic-practice-v1",
    models: { text: settings.textModel, audio: settings.audioModel },
    cases: measurements,
    groups: values.live ? evaluator.summarize(measurements) : [],
  };
  await mkdir(dirname(resolve(values.output)), { recursive: true });
  await writeFile(values.output, JSON.stringify(report, null, 2), {
    mode: 0o600,
  });
  console.log(
    `${corpus.length} expert cases validated. Report: ${values.output}`,
  );
  if (values.live && report.groups.some((group) => !group.passed))
    process.exitCode = 1;
}
