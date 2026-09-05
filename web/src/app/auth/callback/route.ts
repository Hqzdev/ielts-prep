import { NextResponse } from "next/server";
import { sessionClient } from "@/server/supabase";
import { config } from "@/server/config";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const host = request.headers.get("host") ?? "";
  const origin =
    config.localDevelopment && /^(localhost|127\.0\.0\.1):\d+$/.test(host)
      ? `http://${host}`
      : new URL(config.appUrl).origin;
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";
  const safeNext =
    next.startsWith("/") && !next.startsWith("//") && !next.includes("\\")
      ? next
      : "/";
  if (code) {
    const { error } = await (
      await sessionClient()
    ).auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(safeNext, origin));
  }
  return NextResponse.redirect(new URL("/login?error=callback", origin));
}
