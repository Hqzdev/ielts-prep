import { backend } from "@/server/backend";
import { preppyPreferencesSchema } from "@veylo/contracts/schemas/preppy";
import { handle, readBody } from "@/server/http";
import { requireProfile } from "@/server/identity";

export const maxDuration = 180;
export async function POST(request: Request) {
  return handle(request, async () => {
    const profile = await requireProfile();
    const preferences = await readBody(
      request,
      preppyPreferencesSchema.strict(),
    );
    return backend().voice.start(profile, preferences);
  });
}
