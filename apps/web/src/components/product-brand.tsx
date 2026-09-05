import Link from "next/link";
import Image from "next/image";

export function ProductBrand({
  className = "orbit-brand",
  href = "/",
}: {
  className?: string;
  href?: string;
}) {
  return (
    <Link href={href} className={className} aria-label="Veylo home">
      <span className="veylo-brand-mark" aria-hidden="true">
        <Image src="/brand/vey.png" alt="" width={52} height={52} />
      </span>
      <span className="veylo-brand-name">Veylo</span>
    </Link>
  );
}
