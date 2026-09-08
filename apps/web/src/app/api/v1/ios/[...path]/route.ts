import { after } from "next/server";
import { handle } from "@/server/http";
import { requireProfile } from "@/server/identity";
import { nativeBackend } from "@/server/native";
import { NativeQueryController } from "@/server/native-get";
import { NativeCommandController } from "@/server/native-write";
import { dispatchAssessments } from "@/server/services/dispatch";

export const maxDuration = 180;
type Context = { params: Promise<{ path: string[] }> };

export async function GET(request: Request, context: Context) {
  return handle(request, async () => {
    const profile = await requireProfile();
    const { path } = await context.params;
    const result = await new NativeQueryController(nativeBackend()).handle(
      profile,
      path,
      new URL(request.url),
    );
    if (path[0] === "attempts") after(dispatchAssessments);
    return result;
  });
}

async function mutate(request: Request, context: Context) {
  return handle(request, async () => {
    const profile = await requireProfile();
    const { path } = await context.params;
    const result = await new NativeCommandController(nativeBackend()).handle(
      profile,
      path,
      request,
    );
    if (path[0] === "attempts") after(dispatchAssessments);
    return result;
  });
}

export const POST = mutate;
export const PATCH = mutate;
export const DELETE = mutate;
