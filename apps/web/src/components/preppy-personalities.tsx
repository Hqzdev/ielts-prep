"use client";
import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle, ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  personalities,
  PreppyCarouselLayout,
} from "@veylo/ui-web/domain/preppy";
import {
  type PreppyPersonality,
  type PreppyPreferences,
} from "@veylo/backend/domain/preppy";
import { useElementSize } from "@/client/use-element-size";
import { VeyCharacter } from "@veylo/ui-web/components/vey-character";

export function PreppyConsent({
  open,
  onClose,
  onContinue,
}: {
  open: boolean;
  onClose: () => void;
  onContinue: (explicit: boolean) => void;
}) {
  const [explicit, setExplicit] = useState(false);
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="preppy-dialog-overlay" />
        <Dialog.Content className="preppy-dialog preppy-consent">
          <Dialog.Close className="preppy-dialog-close" aria-label="Close">
            <X size={18} />
          </Dialog.Close>
          <span className="preppy-consent-icon">
            <AlertTriangle size={20} />
          </span>
          <Dialog.Title>Heads up before you start</Dialog.Title>
          <Dialog.Description>
            This personality can be blunt and harsh. It&apos;s meant as
            tough-love practice, not a real insult. If that&apos;s not for you,
            pick another personality.
          </Dialog.Description>
          <label className="preppy-explicit">
            <span>
              <strong>Explicit Mode (18+)</strong>
              <small>
                Allows stronger, unfiltered language. You must be 18 or older.
              </small>
            </span>
            <button
              type="button"
              role="switch"
              aria-label="Explicit Mode (18+)"
              aria-checked={explicit}
              onClick={() => setExplicit(!explicit)}
            >
              <i />
            </button>
          </label>
          <div className="preppy-dialog-actions">
            <button onClick={onClose}>Back</button>
            <button
              className="preppy-primary"
              onClick={() => onContinue(explicit)}
            >
              I understand, continue
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function PreppyPersonalities({
  selected,
  onSelect,
  onLaunch,
}: {
  selected: PreppyPersonality;
  onSelect: (personality: PreppyPersonality) => void;
  onLaunch: (preferences: PreppyPreferences) => void;
}) {
  const { ref, width } = useElementSize();
  const [consent, setConsent] = useState(false);
  const [touch, setTouch] = useState<number | null>(null);
  const layout = new PreppyCarouselLayout(width);
  const index = personalities.findIndex(
    (personality) => personality.id === selected,
  );
  const select = (next: number) =>
    onSelect(
      personalities[(next + personalities.length) % personalities.length].id,
    );
  const launch = () =>
    selected === "angry"
      ? setConsent(true)
      : onLaunch({ personality: selected, explicit: false });
  const previous = (
    <button
      type="button"
      aria-label="Previous personality"
      onClick={() => select(index - 1)}
    >
      <ChevronLeft size={20} />
    </button>
  );
  const next = (
    <button
      type="button"
      aria-label="Next personality"
      onClick={() => select(index + 1)}
    >
      <ChevronRight size={20} />
    </button>
  );
  return (
    <div className="preppy-personalities">
      <div
        className="preppy-carousel"
        ref={ref}
        role="group"
        aria-roledescription="carousel"
        aria-label="Choose a personality"
        tabIndex={0}
        style={{ height: layout.height + 40 }}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            select(index + (event.key === "ArrowLeft" ? -1 : 1));
          }
        }}
        onTouchStart={(event) => setTouch(event.touches[0].clientX)}
        onTouchEnd={(event) => {
          if (
            touch !== null &&
            Math.abs(event.changedTouches[0].clientX - touch) > 45
          )
            select(index + (event.changedTouches[0].clientX < touch ? 1 : -1));
          setTouch(null);
        }}
      >
        {personalities.map((personality, cardIndex) => {
          const card = layout.card(cardIndex, index);
          const mascot = Math.round(layout.width * 0.62);
          return (
            <button
              type="button"
              className="preppy-personality-card"
              key={personality.id}
              aria-label={
                card.active
                  ? `${personality.label} — Start talking`
                  : personality.label
              }
              aria-hidden={!card.visible}
              tabIndex={card.visible ? 0 : -1}
              data-active={card.active}
              style={{
                width: layout.width,
                height: layout.height,
                backgroundColor: personality.color,
                opacity: card.opacity,
                zIndex: card.z,
                transform: `translate(-50%, -50%) translate(${card.x}px, ${card.y}px) scale(${card.scale})`,
                pointerEvents: card.visible ? undefined : "none",
                transition: card.visible ? undefined : "none",
              }}
              onClick={() =>
                card.active ? launch() : onSelect(personality.id)
              }
            >
              <div className="preppy-personality-label">
                <strong>{personality.label}</strong>
                {personality.id === "angry" && <span>18+</span>}
              </div>
              <p>{personality.description}</p>
              <blockquote>{personality.sample}</blockquote>
              <div className="preppy-card-character">
                <VeyCharacter
                  size={mascot}
                  expression={personality.expression}
                  still={!card.visible}
                  subdued={!card.active}
                />
              </div>
            </button>
          );
        })}
        {!layout.compact && (
          <div className="preppy-carousel-arrows">
            {previous}
            {next}
          </div>
        )}
      </div>
      <div className="preppy-carousel-pagination">
        {layout.compact && previous}
        <div>
          {personalities.map((personality) => (
            <button
              key={personality.id}
              aria-label={`Go to ${personality.label}`}
              aria-current={selected === personality.id}
              onClick={() => onSelect(personality.id)}
            />
          ))}
        </div>
        {layout.compact && next}
      </div>
      <button
        className="preppy-launch"
        style={{ backgroundColor: personalities[index].color }}
        onClick={launch}
      >
        Start talking
        <ChevronRight size={20} />
      </button>
      {consent && (
        <PreppyConsent
          open
          onClose={() => setConsent(false)}
          onContinue={(explicit) => {
            setConsent(false);
            onLaunch({ personality: selected, explicit });
          }}
        />
      )}
    </div>
  );
}
