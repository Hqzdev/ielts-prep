import Link from "next/link";
export default function NotFound() {
  return (
    <main className="auth-page">
      <p className="eyebrow">Veylo · 404</p>
      <h1>Page not found</h1>
      <p className="muted">
        The link may have changed, or this task may no longer be available.
      </p>
      <Link href="/" className="button">
        Go to dashboard
      </Link>
    </main>
  );
}
