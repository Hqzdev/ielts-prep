"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import {
  Captions,
  Check,
  LoaderCircle,
  PhoneOff,
  Settings2,
  X,
} from "lucide-react";
import { VeyCharacter } from "./vey-character";
import { veyConversationMotion } from "@/domain/vey-motion";
import { PreppyConsent } from "./preppy-personalities";
import { VoiceConversationController } from "@/client/voice-conversation-controller";
import {
  preppyStateFor,
  type MicrophoneMode,
} from "@/domain/voice-conversation";
import {
  personalities,
  personalityFor,
  type PreppyPersonality,
  type PreppyPreferences,
} from "@/domain/preppy";
import { useControllerLifecycle } from "@/client/use-controller-lifecycle";
import { useElementSize } from "@/client/use-element-size";
import { ConversationSummary } from "./preppy-conversation-summary";

export function Tutor({
  controller,
  onClose,
  onSwitch,
}: {
  controller: VoiceConversationController;
  onClose: () => void;
  onSwitch: (preferences: PreppyPreferences) => void;
}) {
  useControllerLifecycle(controller);
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  );
  const [captions, setCaptions] = useState(false);
  const [switching, setSwitching] = useState<PreppyPersonality | null>(null);
  const [consent, setConsent] = useState(false);
  const log = useRef<HTMLDivElement>(null);
  const { ref, width } = useElementSize();
  const personality = personalityFor(state.preferences.personality);
  useEffect(() => {
    controller.activate();
    const down = (event: KeyboardEvent) => controller.keyDown(event);
    const up = (event: KeyboardEvent) => controller.keyUp(event);
    const release = () => controller.release();
    const visibility = () => {
      if (document.hidden) controller.release();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", release);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", release);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [controller]);
  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [state.messages, captions]);
  const time = `${Math.floor(state.remaining / 60)
    .toString()
    .padStart(2, "0")}:${(state.remaining % 60).toString().padStart(2, "0")}`;
  const changeMode = (mode: MicrophoneMode) => {
    controller.setMode(mode);
    try {
      localStorage.setItem("preppy-input-mode", mode);
    } catch {}
  };
  const changePersonality = (explicit = false) => {
    if (!switching) return;
    void controller.end();
    void controller.destroy();
    onSwitch({ personality: switching, explicit });
  };
  if (state.state === "ended")
    return (
      <ConversationSummary
        threadId={state.threadId}
        messages={state.messages}
        onClose={onClose}
      />
    );
  const busy = ["setup", "transcribing", "thinking"].includes(state.state);
  const status =
    state.state === "error"
      ? "Something went wrong"
      : state.state === "setup"
        ? "Connecting…"
        : state.state === "transcribing"
          ? "Processing…"
          : state.state === "thinking"
            ? "Vey is thinking…"
            : state.state === "speaking"
              ? "Vey is speaking…"
              : state.recording
                ? "Listening…"
                : "Your turn";
  return (
    <div className="preppy-conversation" ref={ref}>
      <header className="preppy-session-header">
        <div>
          <h1>Vey AI</h1>
          <p>{personality.label}</p>
        </div>
        <div className="preppy-session-tools">
          <span className="preppy-timer" aria-label={`${time} remaining`}>
            <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
              <circle
                cx="8"
                cy="8"
                r="6"
                fill="none"
                stroke="currentColor"
                opacity=".2"
                strokeWidth="1.5"
              />
              <circle
                cx="8"
                cy="8"
                r="6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                pathLength="100"
                strokeDasharray={`${state.remaining / 6} 100`}
                transform="rotate(-90 8 8)"
              />
            </svg>
            {time}
          </span>
          <Dropdown.Root>
            <Dropdown.Trigger
              className="preppy-icon-button"
              aria-label="Conversation settings"
            >
              <Settings2 size={18} />
            </Dropdown.Trigger>
            <Dropdown.Portal>
              <Dropdown.Content
                className="preppy-settings"
                align="end"
                sideOffset={8}
              >
                <Dropdown.Label>Change personality</Dropdown.Label>
                {personalities.map((item) => (
                  <Dropdown.Item
                    key={item.id}
                    aria-label={item.label}
                    disabled={item.id === personality.id}
                    onSelect={() => setSwitching(item.id)}
                  >
                    <VeyCharacter
                      expression={item.expression}
                      size={30}
                      still
                    />
                    <span>{item.label}</span>
                    {item.id === personality.id && <Check size={14} />}
                  </Dropdown.Item>
                ))}
              </Dropdown.Content>
            </Dropdown.Portal>
          </Dropdown.Root>
        </div>
      </header>
      <section className="preppy-stage">
        <button
          className="preppy-live-character"
          aria-label={
            state.mode === "hold" ? "Hold to talk" : "Vey is listening"
          }
          aria-pressed={state.recording}
          disabled={state.mode !== "hold" || state.state !== "listening"}
          data-recording={state.recording}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            controller.press();
          }}
          onPointerUp={() => controller.release()}
          onPointerCancel={() => controller.release()}
          onLostPointerCapture={() => controller.release()}
          onBlur={() => controller.release()}
          onKeyDown={(event) => {
            if (["Space", "Enter"].includes(event.code)) {
              event.preventDefault();
              if (!event.repeat) controller.press();
            }
          }}
          onKeyUp={(event) => {
            if (["Space", "Enter"].includes(event.code)) {
              event.preventDefault();
              controller.release();
            }
          }}
        >
          <VeyCharacter
            live
            size={Math.min(600, width)}
            state={preppyStateFor(state.state)}
            motion={veyConversationMotion(
              preppyStateFor(state.state),
              state.recording,
              state.error,
              state.messages.at(-1)?.content,
              state.expression,
            )}
            expression={state.expression}
            position={state.position}
            intensity={state.intensity}
            roundness={state.roundness}
          />
        </button>
        <div className="preppy-stage-status">
          <h2 aria-live="polite">
            {busy && <LoaderCircle size={15} className="preppy-spinner" />}
            {status}
          </h2>
          <p>
            {state.mode === "hands-free" ? (
              "Just start speaking — Vey is listening."
            ) : (
              <>
                Hold <kbd>Space</kbd> or the circle to talk
              </>
            )}
          </p>
        </div>
      </section>
      {state.error && (
        <div className="preppy-error" role="alert">
          <span>{state.error}</span>
          <button
            className="preppy-primary"
            onClick={() => void controller.retry()}
          >
            Retry
          </button>
        </div>
      )}
      {captions && (
        <div
          className="preppy-captions"
          ref={log}
          role="log"
          aria-label="Conversation subtitles"
          aria-live="off"
        >
          {state.messages.length ? (
            state.messages.map((message) => (
              <p
                className="preppy-caption"
                data-role={message.role}
                key={message.id}
              >
                <strong>{message.role === "user" ? "You" : "Vey"}</strong>
                {message.content || "…"}
              </p>
            ))
          ) : (
            <p className="preppy-caption-empty">
              Your conversation will appear here
            </p>
          )}
        </div>
      )}
      <div className="preppy-controls">
        <div className="preppy-mode-switch" aria-label="Microphone mode">
          <button
            aria-pressed={state.mode === "hands-free"}
            onClick={() => changeMode("hands-free")}
          >
            Hands-free
          </button>
          <button
            aria-pressed={state.mode === "hold"}
            onClick={() => changeMode("hold")}
          >
            Hold to talk
          </button>
        </div>
        <div className="preppy-call-actions">
          <button
            className="preppy-subtitles-toggle"
            aria-label={captions ? "Hide subtitles" : "Show subtitles"}
            aria-pressed={captions}
            onClick={() => setCaptions(!captions)}
          >
            <Captions size={16} />
            {captions ? "Hide subtitles" : "Subtitles"}
          </button>
          <button
            className="preppy-end"
            onClick={() => void controller.end()}
            aria-label="End conversation"
          >
            <PhoneOff size={16} />
            End session
          </button>
        </div>
      </div>
      <Dialog.Root
        open={!!switching && !consent}
        onOpenChange={(open) => {
          if (!open) setSwitching(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="preppy-dialog-overlay" />
          <Dialog.Content className="preppy-dialog">
            <Dialog.Close className="preppy-dialog-close" aria-label="Close">
              <X size={18} />
            </Dialog.Close>
            <Dialog.Title>Start a new session?</Dialog.Title>
            <Dialog.Description>
              Changing the personality ends the current conversation and starts
              a new one.
            </Dialog.Description>
            <div className="preppy-dialog-actions">
              <button onClick={() => setSwitching(null)}>Stay here</button>
              <button
                className="preppy-primary"
                onClick={() =>
                  switching === "angry" ? setConsent(true) : changePersonality()
                }
              >
                Yes, switch
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      {consent && (
        <PreppyConsent
          open
          onClose={() => {
            setConsent(false);
            setSwitching(null);
          }}
          onContinue={changePersonality}
        />
      )}
    </div>
  );
}
