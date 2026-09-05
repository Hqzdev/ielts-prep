import Image from "next/image";

export function StreakFlame({
  size = 48,
  lit = true,
}: {
  size?: number;
  lit?: boolean;
}) {
  return (
    <Image
      src="/icons/veylo-flame.png"
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      sizes={`${size}px`}
      className="streak-flame"
      data-lit={lit}
    />
  );
}
