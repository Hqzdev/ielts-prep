import { ProductBrand } from "./product-brand";
import { Globe } from "lucide-react";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-shell">
      <header className="auth-header">
        <div>
          <ProductBrand />
          <span>
            <Globe size={16} />
            EN
          </span>
        </div>
      </header>
      <main className="auth-page">
        {children}
        <p className="auth-disclaimer">
          Independent platform — not affiliated with or endorsed by IELTS.
          IELTS® is a registered trademark of its owners.
        </p>
      </main>
      <footer className="auth-footer">
        <span>
          Need help? Email{" "}
          <a href="mailto:support@ielts-orbit.app">support@ielts-orbit.app</a>
        </span>
      </footer>
    </div>
  );
}
