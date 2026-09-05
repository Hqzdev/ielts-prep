"use client";

import Image from "next/image";
import { useState } from "react";
import { Play } from "lucide-react";
import type { ArcadeGame } from "@/client/arcade-round-controller";
import { VeyCharacter } from "@veylo/ui-web/components/vey-character";
import { ArcadeGameDialog } from "./arcade-game";

export const arcadeGames = [
  {
    id: "challenge",
    name: "Speaking Challenge",
    description:
      "Spin the barrel, get a topic, and talk for 60 seconds without stopping.",
    detail: "The topic picks itself. Going quiet is not an option.",
  },
  {
    id: "survival",
    name: "Speak or Die",
    description: "Talk non-stop for 60 seconds — or the saw gets Vey.",
    detail: "Easy · Medium · Hard · Extra Hard",
  },
  {
    id: "runner",
    name: "IELTS Runner",
    description: "Three lanes, one right answer. How far can you get?",
    detail: "Dodge, jump, and run through the right answer.",
  },
] as const;

export function Arcade() {
  const [game, setGame] = useState<ArcadeGame | null>(null);
  return (
    <div className="orbit-page orbit-arcade-page">
      <header className="orbit-arcade-heading">
        <h1>Arcade</h1>
        <p>Mini-games that train your English under pressure.</p>
      </header>
      <section className="orbit-game-list">
        {arcadeGames.map((item) => (
          <article className={`orbit-game-card ${item.id}`} key={item.id}>
            {item.id === "runner" && (
              <>
                <span className="arcade-runner-glow" aria-hidden="true" />
              </>
            )}
            <div className="orbit-game-art">
              {item.id === "challenge" ? (
                <ArcadeTopicPreview />
              ) : (
                <Image
                  src={`/arcade/${item.id === "survival" ? "saw" : "runner"}.svg`}
                  width={96}
                  height={96}
                  alt=""
                />
              )}
            </div>
            <div className="orbit-game-copy">
              <span className="orbit-game-badge">NEW GAME</span>
              <h2>{item.name}</h2>
              <p>{item.description}</p>
              <div>
                <button
                  type="button"
                  className="arcade-play"
                  aria-label={`Play ${item.name}`}
                  onClick={() => setGame(item.id)}
                >
                  <Play size={16} fill="currentColor" />
                  Play
                </button>
                <small>{item.detail}</small>
              </div>
            </div>
            {item.id === "survival" && (
              <VeyCharacter
                className="arcade-card-preppy"
                expression="wince"
                size={112}
              />
            )}
          </article>
        ))}
      </section>
      {game && <ArcadeGameDialog game={game} onClose={() => setGame(null)} />}
    </div>
  );
}

function ArcadeTopicPreview() {
  const topics = [
    "Marriage is outdated",
    "Fame is a curse",
    "AI will take your job",
    "Cats are better than dogs",
    "Hard work beats talent",
    "Money can buy happiness",
  ];
  const roll = (
    <div className="arcade-topic-roll">
      {[...topics, ...topics].map((topic, index) => (
        <span key={index}>{topic}</span>
      ))}
    </div>
  );
  return (
    <div className="arcade-topic-mini" aria-hidden="true">
      <div className="arcade-topic-mask">
        {roll}
        <div className="arcade-topic-window">
          <div>{roll}</div>
        </div>
      </div>
      <i />
    </div>
  );
}
