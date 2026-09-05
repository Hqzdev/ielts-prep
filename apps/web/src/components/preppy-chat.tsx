"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Mic, Send, Square, Volume2, X, LoaderCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { useControllerLifecycle } from "@/client/use-controller-lifecycle";
import { PreppyChatController } from "@/client/preppy-chat-controller";
import { VeyCharacter } from "@veylo/ui-web/components/vey-character";
import { preppyWelcome } from "@veylo/backend/domain/conversation";
import { veyConversationMotion } from "@veylo/ui-web/domain/vey-motion";

function PreppyChatPanel({
  controller,
  onClose,
}: {
  controller: PreppyChatController;
  onClose: () => void;
}) {
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  );
  const [text, setText] = useState("");
  const log = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    input.current?.focus();
  }, []);
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);
  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [state.messages, state.busy]);
  const send = () => {
    if (!text.trim() || state.busy) return;
    void controller.send(text);
    setText("");
  };
  return (
    <section className="preppy-chat" role="dialog" aria-label="Vey">
      <header>
        <VeyCharacter
          size={36}
          state={state.state}
          motion={veyConversationMotion(
            state.state,
            state.recording,
            state.error,
            state.messages.at(-1)?.content,
            state.expression,
          )}
          expression={state.expression}
          intensity={state.intensity}
          roundness={state.roundness}
        />
        <div>
          <strong>Vey</strong>
          <p>Always here to help</p>
        </div>
        <button aria-label="Close Vey chat" onClick={onClose}>
          <X size={18} />
        </button>
      </header>
      <div
        className="preppy-chat-log"
        ref={log}
        role="log"
        aria-label="Vey messages"
        aria-live="polite"
      >
        <div className="preppy-chat-message" data-role="assistant">
          <div className="preppy-chat-bubble">{preppyWelcome}</div>
          <button
            aria-label="Play welcome audio"
            disabled={state.busy}
            onClick={() => void controller.play("welcome")}
          >
            {state.playingId === "welcome" ? (
              <LoaderCircle className="preppy-spinner" size={14} />
            ) : (
              <Volume2 size={14} />
            )}
          </button>
        </div>
        {state.messages.map((message) => (
          <div
            className="preppy-chat-message"
            data-role={message.role}
            key={message.id}
          >
            <div className="preppy-chat-bubble">
              {message.content || (
                <span className="preppy-typing">
                  <i />
                  <i />
                  <i />
                </span>
              )}
            </div>
            {message.role === "assistant" && message.status === "complete" && (
              <button
                aria-label="Play audio"
                disabled={state.busy}
                onClick={() => void controller.play(message.id)}
              >
                {state.playingId === message.id ? (
                  <LoaderCircle className="preppy-spinner" size={14} />
                ) : (
                  <Volume2 size={14} />
                )}
              </button>
            )}
          </div>
        ))}
      </div>
      {state.error && (
        <div className="preppy-chat-error" role="alert">
          {state.error}
          <button onClick={() => void controller.retry()}>Retry</button>
        </div>
      )}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          send();
        }}
      >
        <textarea
          ref={input}
          rows={1}
          placeholder={state.recording ? "Recording…" : "Ask Vey…"}
          aria-label="Ask Vey"
          value={text}
          disabled={state.recording}
          maxLength={4000}
          onChange={(event) => {
            setText(event.target.value);
            event.target.style.height = "40px";
            event.target.style.height = `${Math.min(120, event.target.scrollHeight)}px`;
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              send();
            }
          }}
        />
        {state.recording ? (
          <button
            type="button"
            className="is-recording"
            aria-label="Send voice message"
            onClick={() => void controller.finishRecording()}
          >
            <Square size={16} fill="currentColor" />
          </button>
        ) : text.trim() ? (
          <button aria-label="Send message" disabled={state.busy}>
            <Send size={18} />
          </button>
        ) : (
          <button
            type="button"
            className="preppy-chat-microphone"
            aria-label="Record a voice message"
            disabled={state.busy}
            onClick={() => void controller.record()}
          >
            <Mic size={18} />
          </button>
        )}
      </form>
    </section>
  );
}

export function PreppyChat() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [controller] = useState(() => new PreppyChatController());
  const trigger = useRef<HTMLButtonElement>(null);
  useControllerLifecycle(controller);
  const close = () => {
    setOpen(false);
    void controller.suspend();
    trigger.current?.focus();
  };
  if (pathname.startsWith("/practice")) return null;
  return (
    <>
      {open && <PreppyChatPanel controller={controller} onClose={close} />}
      <button
        ref={trigger}
        className="orbit-assistant-button"
        data-open={open}
        tabIndex={open ? -1 : 0}
        aria-hidden={open}
        aria-label={open ? "Close Vey chat" : "Open Vey chat"}
        aria-expanded={open}
        onClick={() => (open ? close() : setOpen(true))}
      >
        <VeyCharacter size={88} gaze={!open} still={open} />
      </button>
    </>
  );
}
