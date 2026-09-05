import {
  issueInvitationSchema,
  publishTaskSchema,
  importContentSchema,
} from "@veylo/contracts/schemas/requests";

import { requireAdmin } from "@/server/identity";
import { handle, readBody } from "@/server/http";
import { backend } from "@/server/backend";

import { AppError } from "@veylo/backend/domain/errors";
type Context = { params: Promise<{ action: string }> };
export async function POST(request: Request, { params }: Context) {
  return handle(request, async () => {
    const profile = await requireAdmin();
    const { action } = await params;
    const service = backend().administration;
    if (action === "invitations") {
      const { email } = await readBody(request, issueInvitationSchema);
      return service.invite(profile, email);
    }
    if (action === "publish") {
      const body = await readBody(request, publishTaskSchema);
      return service.publish(profile, body.id, body.published);
    }
    if (action === "import") {
      const body = await readBody(request, importContentSchema, 3000000);
      return service.import(profile, body.entries);
    }
    throw new AppError("NOT_FOUND", "Action not found", "not_found");
  });
}
