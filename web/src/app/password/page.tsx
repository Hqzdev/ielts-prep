import { AuthForm } from "@/components/auth-form";
export default function PasswordPage() {
  return (
    <main className="auth-page">
      <AuthForm initialMode="password" />
    </main>
  );
}
