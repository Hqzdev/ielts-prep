"use client";

import { useRef, useState } from "react";
import { personalitySchema } from "@veylo/contracts/schemas/preppy";
import {
  type PreppyPersonality,
  type PreppyPreferences,
} from "@veylo/backend/domain/preppy";
import { VoiceConversationController } from "@/client/voice-conversation-controller";
import { useStoredString } from "@/client/use-stored-string";
import { useReducedMotion } from "@veylo/ui-web/client/use-reduced-motion";
import { PreppyIntroduction } from "./preppy-introduction";
import { PreppyPersonalities } from "./preppy-personalities";
import { Tutor } from "./tutor";

export function PreppyExperience() {
  const hidden = useStoredString("preppy-intro-hidden");
  const savedPersonality = useStoredString("preppy-personality");
  const reduced = useReducedMotion();
  const saved = personalitySchema.safeParse(savedPersonality);
  const [dismissed, setDismissed] = useState(false);
  const [selected, setSelected] = useState<PreppyPersonality | null>(null);
  const [session, setSession] = useState<{
    id: string;
    controller: VoiceConversationController;
  } | null>(null);
  const heading = useRef<HTMLDivElement>(null);
  const select = (personality: PreppyPersonality) => {
    setSelected(personality);
    try {
      localStorage.setItem("preppy-personality", personality);
    } catch {}
  };
  const launch = (preferences: PreppyPreferences) => {
    select(preferences.personality);
    const controller = new VoiceConversationController();
    try {
      if (localStorage.getItem("preppy-input-mode") === "hold")
        controller.setMode("hold");
    } catch {}
    setSession({ id: crypto.randomUUID(), controller });
    void controller.start(preferences);
  };
  return (
    <div className="preppy-experience" data-session={!!session}>
      {session ? (
        <Tutor
          key={session.id}
          controller={session.controller}
          onClose={() => setSession(null)}
          onSwitch={launch}
        />
      ) : (
        <div className="preppy-select">
          {hidden !== "true" && !dismissed && (
            <PreppyIntroduction
              onDismiss={() => {
                try {
                  localStorage.setItem("preppy-intro-hidden", "true");
                } catch {}
                setDismissed(true);
              }}
              onContinue={() =>
                heading.current?.scrollIntoView({
                  behavior: reduced ? "auto" : "smooth",
                  block: "start",
                })
              }
            />
          )}
          <div className="preppy-selection-heading" ref={heading}>
            <h1>Vey AI</h1>
            <p>
              Your live AI speaking partner. Pick a personality and start
              talking.
            </p>
          </div>
          <PreppyPersonalities
            selected={selected ?? (saved.success ? saved.data : "classic")}
            onSelect={select}
            onLaunch={launch}
          />
        </div>
      )}
      <p className="preppy-disclaimer">
        Vey is an AI and can make mistakes or behave unpredictably. Don&apos;t
        rely on it for important decisions. The platform isn&apos;t liable for
        its responses.
      </p>
    </div>
  );
}
