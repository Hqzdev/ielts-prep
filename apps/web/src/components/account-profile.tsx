"use client";

import { useState } from "react";
import {
  CalendarDays,
  Clock3,
  Mail,
  Pencil,
  Target,
  UserRound,
} from "lucide-react";
import type { Profile } from "@veylo/backend/domain/profile";
import { api, apiData } from "@/client/api";
import { errorMessage } from "@veylo/backend/domain/errors";
import { Button, ErrorNotice } from "./ui";
import { ProfileForm } from "./profile-form";

type EditableField = "name" | "targetBand" | "dailyMinutes" | "examDate";

export function AccountProfile({
  profile,
  onSaved,
}: {
  profile: Profile;
  onSaved: (profile: Profile) => void;
}) {
  const [editing, setEditing] = useState<EditableField | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fields = [
    {
      key: "name" as const,
      label: "Name",
      icon: UserRound,
      value: profile.name,
    },
    { key: "email" as const, label: "Email", icon: Mail, value: profile.email },
    {
      key: "targetBand" as const,
      label: "Target IELTS Band",
      icon: Target,
      value: profile.targetBand.toFixed(1),
    },
    {
      key: "dailyMinutes" as const,
      label: "Daily Study Time",
      icon: Clock3,
      value:
        profile.dailyMinutes >= 120
          ? "2+ hours"
          : `${profile.dailyMinutes} minutes`,
    },
    {
      key: "examDate" as const,
      label: "IELTS Exam Date",
      icon: CalendarDays,
      value: profile.examDate
        ? new Date(`${profile.examDate}T00:00:00`).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })
        : "Not set",
    },
  ];

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const raw = String(new FormData(event.currentTarget).get(editing) ?? "");
    const value =
      editing === "targetBand" || editing === "dailyMinutes"
        ? Number(raw)
        : raw || null;
    const updated = { ...profile, [editing]: value };
    setBusy(true);
    setError(null);
    try {
      await apiData(
        api.PATCH("/profile", {
          body: {
            name: updated.name,
            targetBand: updated.targetBand,
            selfReportedBand: updated.selfReportedBand,
            examDate: updated.examDate,
            dailyMinutes: updated.dailyMinutes,
            studyDays: updated.studyDays,
            timezone: updated.timezone,
          },
        }),
      );
      onSaved(updated);
      setEditing(null);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {fields.map(({ key, label, icon: Icon, value }) => (
        <div className="orbit-profile-row" key={key}>
          <div className="orbit-profile-label">
            <Icon size={16} />
            {label}
          </div>
          {editing === key ? (
            <form className="orbit-profile-edit" onSubmit={save}>
              <label className="field">
                <span className="sr-only">{label}</span>
                {key === "targetBand" ? (
                  <select name={key} defaultValue={profile.targetBand}>
                    {Array.from({ length: 17 }, (_, i) => 1 + i / 2).map(
                      (band) => (
                        <option key={band} value={band}>
                          {band.toFixed(1)}
                        </option>
                      ),
                    )}
                  </select>
                ) : (
                  <input
                    name={key}
                    autoFocus
                    required={key !== "examDate"}
                    type={
                      key === "examDate"
                        ? "date"
                        : key === "dailyMinutes"
                          ? "number"
                          : "text"
                    }
                    min={key === "dailyMinutes" ? 10 : undefined}
                    max={key === "dailyMinutes" ? 180 : undefined}
                    maxLength={key === "name" ? 80 : undefined}
                    defaultValue={profile[key] ?? ""}
                  />
                )}
              </label>
              <div className="row">
                <Button type="submit" busy={busy}>
                  Save
                </Button>
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setEditing(null)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="orbit-profile-value">
              <span
                className={key === "targetBand" ? "orbit-profile-band" : ""}
              >
                {value}
              </span>
              {key === "email" ? (
                <small>Used for login, cannot change</small>
              ) : (
                <button
                  aria-label={`Edit ${label}`}
                  onClick={() => {
                    setError(null);
                    setEditing(key);
                  }}
                >
                  <Pencil size={14} />
                </button>
              )}
            </div>
          )}
        </div>
      ))}
      <ErrorNotice message={error} />
      <details className="orbit-profile-extra">
        <summary>Study schedule and current level</summary>
        <ProfileForm profile={profile} onSaved={onSaved} />
      </details>
    </>
  );
}
