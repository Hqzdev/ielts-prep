"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import { browserClient } from "@/client/supabase";
import { errorMessage } from "@/domain/errors";
import { Button, ErrorNotice } from "./ui";

export function AuthForm({
  invite,
  initialMode = "login",
}: {
  invite?: string;
  initialMode?: "login" | "signup" | "recover" | "password";
}) {
  const [mode, setMode] = useState(initialMode);
  const [method, setMethod] = useState<"code" | "password">("code");
  const [email, setEmail] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const router = useRouter();
  const next = invite ? `/access?invite=${encodeURIComponent(invite)}` : "/";
  const title = {
    login: codeSent ? "Check your email" : "Log in to your account",
    signup: "Your plan is ready!",
    recover: "Reset your password",
    password: "Choose a new password",
  }[mode];
  const usesPassword =
    mode === "password" || (method === "password" && mode !== "recover");
  function callback(path: string) {
    return `${window.location.origin}/auth/callback?next=${encodeURIComponent(path)}`;
  }
  function changeMode(value: typeof mode) {
    setMode(value);
    setCodeSent(false);
    setError(null);
    setNotice("");
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice("");
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    try {
      const auth = browserClient().auth;
      if (mode === "recover") {
        const { error } = await auth.resetPasswordForEmail(email, {
          redirectTo: callback("/password"),
        });
        if (error) throw error;
        setNotice("If this account exists, a reset link has been sent.");
      } else if (mode === "password") {
        const { error } = await auth.updateUser({ password });
        if (error) throw error;
        router.push(next);
        router.refresh();
      } else if (method === "code") {
        if (codeSent) {
          const { error } = await auth.verifyOtp({
            email,
            token: String(form.get("code") ?? "").trim(),
            type: "email",
          });
          if (error) throw error;
          router.push(next);
          router.refresh();
        } else {
          const { error } = await auth.signInWithOtp({
            email,
            options: {
              shouldCreateUser: mode === "signup",
              emailRedirectTo: callback(next),
            },
          });
          if (error) throw error;
          setCodeSent(true);
          setNotice(
            "Enter the code from your email, or follow the sign-in link in the message.",
          );
        }
      } else if (mode === "signup") {
        const { error } = await auth.signUp({
          email,
          password,
          options: { emailRedirectTo: callback(next) },
        });
        if (error) throw error;
        setNotice(
          "Check your inbox to verify your email. Then accept your invitation.",
        );
      } else {
        const { error } = await auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push(next);
        router.refresh();
      }
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  }
  async function google() {
    setBusy(true);
    setError(null);
    try {
      const { error } = await browserClient().auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: callback(next) },
      });
      if (error) throw error;
    } catch (caught) {
      setError(errorMessage(caught));
      setBusy(false);
    }
  }
  return (
    <>
      <h1>{title}</h1>
      <p className="auth-subtitle">
        {mode === "password"
          ? "Choose a password with at least 10 characters."
          : mode === "recover"
            ? "We'll send you a reset link."
            : codeSent
              ? email
              : mode === "signup"
                ? "Enter your email to save your personalized plan"
                : "Enter your email to log in"}
      </p>
      <form className="auth-form" onSubmit={submit}>
        {mode !== "password" && !codeSent && (
          <label className="field">
            <span className="sr-only">Email</span>
            <input
              name="email"
              type="email"
              autoFocus
              autoComplete="email"
              required
              placeholder="email@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
        )}
        {codeSent && (
          <label className="field">
            <span className="sr-only">Email code</span>
            <input
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              pattern="[0-9]{6,8}"
              minLength={6}
              maxLength={8}
              placeholder="Enter your code"
              autoFocus
            />
          </label>
        )}
        {usesPassword && (
          <label className="field">
            Password
            <input
              name="password"
              type="password"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              minLength={10}
              required
            />
          </label>
        )}
        <ErrorNotice message={error} />
        {notice && (
          <div className="notice success" role="status">
            {notice}
          </div>
        )}
        <Button
          type="submit"
          busy={busy}
          disabled={mode !== "password" && !email.trim()}
        >
          {mode === "recover"
            ? "Send reset link"
            : mode === "password"
              ? "Save password"
              : codeSent
                ? "Verify code"
                : method === "code"
                  ? mode === "signup"
                    ? "Create account"
                    : "Send Code"
                  : mode === "signup"
                    ? "Create account"
                    : "Sign in"}
        </Button>
      </form>
      {["login", "signup"].includes(mode) && (
        <>
          <div className="auth-divider">
            <span>OR</span>
          </div>
          <Button
            className="auth-google"
            variant="secondary"
            onClick={google}
            busy={busy}
          >
            <Image src="/reference/google.svg" alt="" width={20} height={20} />
            Sign in with Google
          </Button>
        </>
      )}
      <div className="auth-links">
        {["login", "signup"].includes(mode) ? (
          <>
            <button
              onClick={() => {
                setMethod(method === "code" ? "password" : "code");
                setCodeSent(false);
                setError(null);
                setNotice("");
              }}
            >
              {method === "code" ? "Use a password" : "Use an email code"}
            </button>
            {mode === "login" ? (
              <Link
                href={
                  invite
                    ? `/quiz?step=10&invite=${encodeURIComponent(invite)}`
                    : "/quiz?step=0"
                }
              >
                Create account
              </Link>
            ) : (
              <button onClick={() => changeMode("login")}>
                Log in instead
              </button>
            )}
            {method === "password" && (
              <button onClick={() => changeMode("recover")}>
                Forgot password?
              </button>
            )}
            {codeSent && (
              <button
                onClick={() => {
                  setCodeSent(false);
                  setNotice("");
                }}
              >
                Use another email
              </button>
            )}
          </>
        ) : (
          <button onClick={() => changeMode("login")}>Back to sign-in</button>
        )}
      </div>
      {invite && (
        <p className="small muted">
          Use the email address that received your invitation.
        </p>
      )}
      <div className="auth-support">
        <span>Login issues? Contact us</span>
        <a href="mailto:support@ielts-orbit.app">
          <Mail size={14} />
          support@ielts-orbit.app
        </a>
      </div>
    </>
  );
}
