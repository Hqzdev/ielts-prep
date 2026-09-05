import Link from "next/link";
import { ProductBrand } from "./product-brand";

export function LegalPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="legal-shell">
      <header>
        <ProductBrand href="/welcome" />
        <Link href="/account">Profile</Link>
      </header>
      <main>
        <h1>{title}</h1>
        {children}
        <Link className="button secondary" href="/welcome">
          Back to Veylo
        </Link>
      </main>
    </div>
  );
}
