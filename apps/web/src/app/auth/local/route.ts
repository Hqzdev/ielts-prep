import { NextResponse } from "next/server";
import { config } from "@/server/config";
import { sessionClient } from "@/server/supabase";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const origin = request.headers.get("origin");
  if (
    !config.localDevelopment ||
    !["localhost", "127.0.0.1"].includes(url.hostname) ||
    (origin !== url.origin && origin !== config.appUrl) ||
    !process.env.LOCAL_BETA_EMAIL ||
    !process.env.LOCAL_BETA_PASSWORD
  )
    return new Response(null, { status: 404 });
  const { error } = await (
    await sessionClient()
  ).auth.signInWithPassword({
    email: process.env.LOCAL_BETA_EMAIL,
    password: process.env.LOCAL_BETA_PASSWORD,
  });
  return NextResponse.redirect(
    new URL(error ? "/login?error=local" : "/", origin ?? url.origin),
    303,
  );
}
