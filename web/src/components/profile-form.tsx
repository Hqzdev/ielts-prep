"use client";
import { useEffect, useRef, useState } from "react";
import { EnrollmentDraft } from "@/client/enrollment-draft";
import { useRouter } from "next/navigation";
import { ArrowRight } from "@phosphor-icons/react";
import type { Profile } from "@/domain/profile";
import { api } from "@/client/api";
import { errorMessage } from "@/domain/errors";
import { Button, ErrorNotice } from "./ui";

export function ProfileForm({
  profile,
  onboarding = false,
  onSaved,
}: {
  profile: Profile;
  onboarding?: boolean;
  onSaved?: (profile: Profile) => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (!onboarding || !formRef.current) return;
    const enrollment = new EnrollmentDraft(localStorage);
    if (!enrollment.exists()) return;
    const draft = enrollment.read();
    for (const [key, value] of Object.entries({
      name: draft.name || profile.name,
      targetBand: draft.targetBand,
      dailyMinutes: draft.dailyMinutes,
    })) {
      const control = formRef.current.elements.namedItem(key);
      if (
        control instanceof HTMLInputElement ||
        control instanceof HTMLSelectElement
      )
        control.value = String(value);
    }
  }, [onboarding, profile.name]);
  const [days, setDays] = useState(profile.studyDays);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const router = useRouter();
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setSaved(false);
    setError(null);
    const form = new FormData(event.currentTarget);
    const updated = {
      ...profile,
      name: String(form.get("name")),
      targetBand: Number(form.get("targetBand")),
      selfReportedBand: form.get("selfReportedBand")
        ? Number(form.get("selfReportedBand"))
        : null,
      examDate: String(form.get("examDate") || "") || null,
      dailyMinutes: Number(form.get("dailyMinutes")),
      studyDays: days,
      timezone: String(
        form.get("timezone") ||
          Intl.DateTimeFormat().resolvedOptions().timeZone,
      ),
    };
    try {
      await api("/api/profile", {
        method: "PATCH",
        body: JSON.stringify(updated),
      });
      if (onboarding) {
        new EnrollmentDraft(localStorage).clear();
        router.push("/");
        router.refresh();
      } else {
        onSaved?.(updated);
        setSaved(true);
      }
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  const bands = Array.from({ length: 17 }, (_, i) => 1 + i * 0.5);
  return (
    <form ref={formRef} className="settings-form" onSubmit={submit}>
      <label className="field">
        What should we call you?
        <input
          name="name"
          defaultValue={profile.name}
          required
          maxLength={80}
          autoComplete="given-name"
        />
      </label>
      <div className="grid-two">
        <label className="field">
          Target IELTS band
          <select name="targetBand" defaultValue={profile.targetBand}>
            {bands.map((band) => (
              <option key={band} value={band}>
                Band {band.toFixed(1)}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Current level, if known
          <select
            name="selfReportedBand"
            defaultValue={profile.selfReportedBand ?? ""}
          >
            <option value="">I&apos;m not sure yet</option>
            {bands.map((band) => (
              <option key={band} value={band}>
                Band {band.toFixed(1)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid-two">
        <label className="field">
          Exam date · optional
          <input
            type="date"
            name="examDate"
            defaultValue={profile.examDate ?? ""}
          />
        </label>
        <label className="field">
          Study time per day
          <input
            name="dailyMinutes"
            type="number"
            min={10}
            max={180}
            step={5}
            defaultValue={profile.dailyMinutes}
            required
          />
        </label>
      </div>
      <div>
        <p className="small">Study days</p>
        <div className="days">
          {[1, 2, 3, 4, 5, 6, 0].map((day, index) => (
            <label className="day" key={day}>
              <input
                type="checkbox"
                checked={days.includes(day)}
                onChange={(event) =>
                  setDays(
                    event.target.checked
                      ? [...days, day]
                      : days.filter((value) => value !== day),
                  )
                }
              />
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index]}
            </label>
          ))}
        </div>
      </div>
      {!onboarding && (
        <label className="field">
          Time zone
          <input name="timezone" defaultValue={profile.timezone} required />
        </label>
      )}
      <ErrorNotice message={error} />
      {saved && (
        <div className="notice success">
          Settings saved. Sessions you have started stay in place.
        </div>
      )}
      <div>
        <Button busy={busy} disabled={!days.length} type="submit">
          {onboarding ? "Start learning" : "Save settings"}
          <ArrowRight size={17} weight="bold" />
        </Button>
      </div>
    </form>
  );
}
