export { VeyCharacter } from "@veylo/ui-web/components/vey-character";
import {
  BookOpen,
  Headphones,
  Microphone,
  PencilLine,
  Translate,
} from "@phosphor-icons/react/dist/ssr";

export type OrbitSkill =
  "reading" | "listening" | "writing" | "speaking" | "vocabulary";

const skillLabels: Record<OrbitSkill, string> = {
  reading: "Reading",
  listening: "Listening",
  writing: "Writing",
  speaking: "Speaking",
  vocabulary: "Vocabulary",
};

export function SkillIcon({
  skill,
  size = 18,
}: {
  skill: OrbitSkill;
  size?: number;
}) {
  const props = { size, weight: "bold" as const };
  if (skill === "reading") return <BookOpen {...props} />;
  if (skill === "listening") return <Headphones {...props} />;
  if (skill === "writing") return <PencilLine {...props} />;
  if (skill === "speaking") return <Microphone {...props} />;
  return <Translate {...props} />;
}

export function SkillBadge({
  skill,
  compact = false,
}: {
  skill: OrbitSkill;
  compact?: boolean;
}) {
  return (
    <span
      className={`orbit-skill orbit-skill-${skill} ${compact ? "compact" : ""}`}
    >
      <SkillIcon skill={skill} size={compact ? 15 : 18} />
      {!compact && skillLabels[skill]}
    </span>
  );
}

export function OrbitProgress({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) {
  return (
    <span className={`orbit-progress ${className}`}>
      <span style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </span>
  );
}

export function PageHeading({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="orbit-page-heading">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="orbit-heading-side">{actions}</div>
    </header>
  );
}
