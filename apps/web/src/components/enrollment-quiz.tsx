"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  BriefcaseBusiness,
  GraduationCap,
  Globe,
  Languages,
  Mic,
  PenLine,
  Headphones,
  Clock3,
  Target,
  CalendarDays,
  CircleHelp,
  ShieldCheck,
} from "lucide-react";
import {
  EnrollmentDraft,
  type EnrollmentAnswers,
} from "@/client/enrollment-draft";
import { useStoredString } from "@/client/use-stored-string";
import { AuthForm } from "./auth-form";
import { VeyCharacter } from "@veylo/ui-web/components/vey-character";
import { ProductBrand } from "./product-brand";
import { Button } from "./ui";

const initial: EnrollmentAnswers = {
  name: "",
  reason: "",
  experience: "",
  targetBand: 7,
  weakness: "",
  examWindow: "No Date Yet",
  dailyMinutes: 30,
  concern: "",
};
const headings = [
  "Get your target score on the first try",
  "Why are you taking IELTS?",
  "Is this your first IELTS?",
  "What's your target Band Score?",
  "Which skill holds you back most?",
  "When do you plan to take IELTS?",
  "How much time can you study daily?",
  "What worries you most?",
  "What's your name?",
  "We already know what you need",
];
const subtitles = [
  "Answer a few questions — get your personalized plan",
  "Choose your main goal",
  "This helps us tailor your plan",
  "Choose your goal",
  "We'll build your plan around fixing it",
  "This helps us build your plan",
  "We'll adapt your plan",
  "Be honest — it helps",
  "To personalize your plan",
  "Save your plan and start preparing",
];

export function EnrollmentQuiz() {
  const router = useRouter();
  const params = useSearchParams();
  const step = Math.min(10, Math.max(0, Number(params.get("step")) || 0));
  const saved = useStoredString("ielts-orbit-enrollment");
  const [edited, setAnswers] = useState<EnrollmentAnswers | null>(null);
  const answers = edited ?? (saved ? EnrollmentDraft.decode(saved) : initial);
  function advance(patch: Partial<EnrollmentAnswers> = {}) {
    const updated = { ...answers, ...patch };
    setAnswers(updated);
    new EnrollmentDraft(localStorage).save(updated);
    router.push(`/quiz?step=${step + 1}`);
  }
  const choices =
    step === 1
      ? [
          { value: "Bachelor's", icon: GraduationCap },
          { value: "Master's", icon: GraduationCap },
          { value: "Work / Immigration", icon: BriefcaseBusiness },
          { value: "I Teach IELTS", icon: Languages },
        ]
      : step === 2
        ? [
            { value: "First Time", icon: BookOpen },
            { value: "Taken a Mock Test", icon: PenLine },
            { value: "Taken Real Exam", icon: ShieldCheck },
          ]
        : step === 4
          ? [
              { value: "Reading", icon: BookOpen },
              { value: "Listening", icon: Headphones },
              { value: "Writing", icon: PenLine },
              { value: "Speaking", icon: Mic },
            ]
          : step === 5
            ? [
                { value: "Less Than a Month", icon: CalendarDays },
                { value: "1–3 Months", icon: CalendarDays },
                { value: "3–6 Months", icon: CalendarDays },
                { value: "No Date Yet", icon: CircleHelp },
              ]
            : step === 7
              ? [
                  { value: "Fail the Exam", icon: Target },
                  { value: "Waste Money", icon: BriefcaseBusiness },
                  { value: "Not Enough Time", icon: Clock3 },
                  { value: "Lack Confidence", icon: Mic },
                ]
              : [];
  const field =
    step === 1
      ? "reason"
      : step === 2
        ? "experience"
        : step === 4
          ? "weakness"
          : step === 5
            ? "examWindow"
            : "concern";
  return (
    <div className="quiz-shell">
      <header className="auth-header">
        <div>
          {step > 0 && <span className="quiz-progress-count">{step} / 10</span>}
          <ProductBrand href="/welcome" />
          <span>
            <Globe size={16} />
            EN
          </span>
        </div>
        {step > 0 && (
          <progress value={step} max={10} aria-label="Registration progress" />
        )}
      </header>
      <main className="quiz-main">
        {step === 10 ? (
          <div className="auth-page quiz-auth">
            <AuthForm
              initialMode="signup"
              invite={params.get("invite") ?? undefined}
            />
          </div>
        ) : (
          <>
            <section className="quiz-content">
              {step === 0 && (
                <div className="quiz-art">
                  <BookOpen size={48} />
                </div>
              )}
              {step === 9 && (
                <div className="quiz-art">
                  <VeyCharacter state="success" size={100} />
                </div>
              )}
              <h1>{headings[step]}</h1>
              <p>{subtitles[step]}</p>
              {choices.length > 0 && (
                <div className="quiz-choices">
                  {choices.map(({ value, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => advance({ [field]: value })}
                      aria-pressed={answers[field] === value}
                    >
                      <Icon size={24} />
                      {value}
                    </button>
                  ))}
                </div>
              )}
              {step === 3 && (
                <div className="quiz-choices quiz-bands">
                  {[5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9].map((band) => (
                    <button
                      key={band}
                      aria-pressed={answers.targetBand === band}
                      onClick={() => advance({ targetBand: band })}
                    >
                      {band.toFixed(1)}
                    </button>
                  ))}
                </div>
              )}
              {step === 6 && (
                <div className="quiz-choices">
                  {[
                    { value: 15, label: "15 Mins", detail: "Quick Exercises" },
                    {
                      value: 30,
                      label: "30 Mins",
                      detail: "One Section at a Time",
                    },
                    { value: 60, label: "1 Hour", detail: "Full Practice" },
                    { value: 120, label: "2+ Hours", detail: "Intensive Prep" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      aria-pressed={answers.dailyMinutes === option.value}
                      onClick={() => advance({ dailyMinutes: option.value })}
                    >
                      <Clock3 size={24} />
                      {option.label}
                      <small>{option.detail}</small>
                    </button>
                  ))}
                </div>
              )}
              {step === 8 && (
                <form
                  id="quiz-name"
                  onSubmit={(event) => {
                    event.preventDefault();
                    advance();
                  }}
                >
                  <input
                    aria-label="Your name"
                    placeholder="Your name"
                    value={answers.name}
                    onChange={(event) =>
                      setAnswers({ ...answers, name: event.target.value })
                    }
                    maxLength={80}
                    autoComplete="given-name"
                    required
                  />
                </form>
              )}
              {step === 9 && (
                <div className="quiz-summary">
                  <div>
                    Goal<strong>Band {answers.targetBand.toFixed(1)}</strong>
                  </div>
                  <div>
                    Weakness<strong>{answers.weakness}</strong>
                  </div>
                  <div>
                    Time per day<strong>{answers.dailyMinutes} mins</strong>
                  </div>
                </div>
              )}
            </section>
            <div className="quiz-actions">
              {step > 0 && (
                <Button
                  variant="secondary"
                  onClick={() => router.push(`/quiz?step=${step - 1}`)}
                  aria-label="Previous question"
                >
                  <ArrowLeft size={18} />
                </Button>
              )}
              {[0, 8, 9].includes(step) && (
                <Button
                  onClick={() => advance()}
                  disabled={step === 8 && !answers.name.trim()}
                >
                  Continue
                </Button>
              )}
              {step === 8 && (
                <Button variant="ghost" onClick={() => advance({ name: "" })}>
                  Skip
                </Button>
              )}
            </div>
          </>
        )}
      </main>
      <footer className="auth-footer">
        Need help? Email{" "}
        <a href="mailto:support@ielts-orbit.app">support@ielts-orbit.app</a>
      </footer>
    </div>
  );
}
