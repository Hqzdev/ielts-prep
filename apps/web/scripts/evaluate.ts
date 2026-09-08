import { config } from "dotenv";
import { parseArgs } from "node:util";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { calibrationCorpusSchema } from "@veylo/contracts/schemas/calibration";
import {
  CalibrationEvaluator,
  type CalibrationMeasurement,
} from "@veylo/backend/domain/calibration";
import { GeminiProvider, type AudioInput } from "@veylo/backend/ai/gemini";
import { BandCalculator } from "@veylo/backend/domain/assessment";
import type { Attempt } from "@veylo/backend/domain/attempt";
import { WavCodec } from "@veylo/backend/domain/wav";
import { createClient } from "@supabase/supabase-js";
import { createNativeAi } from "@veylo/backend/composition/gigachat";

config({ path: ".env.local", quiet: true });
const { values } = parseArgs({
  options: {
    provider: { type: "string", default: "gemini" },
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
    "pnpm assessment:evaluate --provider gemini|gigachat --corpus /path/corpus.json [--live] [--output .local/report.json]\nWithout --live only validates the expert corpus; no AI requests are made. --schema prints its JSON schema.",
  );
else {
  const corpusPath = resolve(values.corpus);
  const evaluator = new CalibrationEvaluator();
  const corpus = evaluator.validate(
    calibrationCorpusSchema.parse(
      JSON.parse(await readFile(corpusPath, "utf8")),
    ),
  );
  if (!["gemini", "gigachat"].includes(values.provider))
    throw new Error("Choose gemini or gigachat");
  const native = values.provider === "gigachat";
  if (
    native &&
    corpus.some(
      (sample) => sample.task.skill !== "writing" || sample.audio.length,
    )
  )
    throw new Error(
      "GigaChat calibration accepts Writing only; no audio is sent",
    );
  const key = process.env.GEMINI_API_KEY ?? "";
  if (values.live && !native && !key)
    throw new Error(
      "Set GEMINI_API_KEY in apps/web/.env.local for an explicit live run",
    );
  const settings = {
    key,
    textModel: process.env.GEMINI_TEXT_MODEL ?? "gemini-3.5-flash",
    audioModel: process.env.GEMINI_AUDIO_MODEL ?? "gemini-3.5-flash",
    ttsModel: process.env.GEMINI_TTS_MODEL ?? "gemini-3.1-flash-tts-preview",
    voice: process.env.GEMINI_VOICE ?? "Kore",
  };
  const provider = values.live && !native ? new GeminiProvider(settings) : null;
  const nativeModel =
    process.env.IOS_GIGACHAT_WRITING_MODEL ?? "GigaChat-2-Max";
  if (values.live && native && !process.env.GIGACHAT_CREDENTIALS)
    throw new Error("Configure GIGACHAT_CREDENTIALS for the explicit live run");
  const nativeProvider =
    values.live && native
      ? createNativeAi(
          {
            gigachatCredentials: process.env.GIGACHAT_CREDENTIALS,
            gigachatScope: process.env.GIGACHAT_SCOPE,
            gigachatCertificatePath: process.env.GIGACHAT_CA_FILE,
            nativeTextModel: nativeModel,
          },
          createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SECRET_KEY!,
            { auth: { persistSession: false } },
          ),
        ).assessor(nativeModel)
      : null;
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
    if (provider || nativeProvider) {
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
          transcripts.push(await provider!.transcribe(recording));
        const grade = nativeProvider
          ? await nativeProvider.assessWriting(attempt)
          : await provider!.assess(attempt, audio, transcripts);
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
    provider: values.provider,
    models: {
      text: native ? nativeModel : settings.textModel,
      audio: native ? null : settings.audioModel,
    },
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
  if (
    values.live &&
    (report.groups.some((group) => !group.passed) ||
      (native &&
        !["writing-1", "writing-2"].every((group) =>
          report.groups.some(
            (result) => result.group === group && result.passed,
          ),
        )))
  )
    process.exitCode = 1;
}
