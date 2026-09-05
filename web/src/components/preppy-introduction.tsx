"use client";
import { useEffect, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { introductionBeats, expressionColor } from "@/domain/preppy";
import { useElementSize } from "@/client/use-element-size";
import { useReducedMotion } from "@/client/use-reduced-motion";
import { VeyCharacter } from "./vey-character";

export function PreppyIntroduction({
  onDismiss,
  onContinue,
}: {
  onDismiss: () => void;
  onContinue: () => void;
}) {
  const reduced = useReducedMotion();
  const { ref, width, height } = useElementSize();
  const [beat, setBeat] = useState(0);
  const [finished, setFinished] = useState(false);
  useEffect(() => {
    if (reduced) return;
    const timers = introductionBeats.map((_, index) =>
      setTimeout(() => setBeat(index), 620 + index * 1600),
    );
    timers.push(
      setTimeout(
        () => setFinished(true),
        620 + introductionBeats.length * 1600 + 150,
      ),
    );
    return () => timers.forEach(clearTimeout);
  }, [reduced]);
  const ready = reduced || finished;
  const current = introductionBeats[beat];
  const expression = ready ? "happy" : current.expression;
  const size = Math.round(
    Math.max(180, Math.min(width >= 640 ? 340 : 460, width * 0.92, height)),
  );
  return (
    <div
      ref={ref}
      className="preppy-introduction"
      style={{ aspectRatio: width >= 640 ? "1280 / 560" : "9 / 10" }}
    >
      <div className="preppy-intro-clouds" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </div>
      <h2>Meet the new Vey</h2>
      <div className="preppy-intro-stage">
        <div className="preppy-intro-entrance">
          <div
            className="preppy-intro-motion"
            data-motion={ready ? "ready" : current.motion}
          >
            <VeyCharacter
              live
              motion={ready ? "idle" : current.motion}
              expression={expression}
              position={ready ? "default" : current.position}
              size={size}
            />
          </div>
        </div>
      </div>
      {!ready && (
        <div
          className="preppy-intro-beat"
          key={current.caption}
          style={{ color: expressionColor(expression) }}
        >
          {current.caption}
        </div>
      )}
      {ready && (
        <div className="preppy-intro-ready">
          <strong>Ready when you are</strong>
          <p>Pick a personality and start talking</p>
        </div>
      )}
      <button
        className="preppy-dismiss-intro"
        onClick={onDismiss}
        aria-hidden={!ready}
        tabIndex={ready ? 0 : -1}
        data-ready={ready}
      >
        <X size={14} />
        Don&apos;t show again
      </button>
      <button
        className="preppy-intro-next"
        aria-label="Scroll down"
        onClick={onContinue}
        aria-hidden={!ready}
        tabIndex={ready ? 0 : -1}
        data-ready={ready}
      >
        <ChevronDown size={20} />
      </button>
    </div>
  );
}
