import { z } from "zod";
import { requireAdmin } from "@/server/identity";
import { handle, readBody } from "@/server/http";
import { AdministrationService } from "@/server/services/administration";
import { ContentImporter } from "@/server/services/content-import";
import { adminClient } from "@/server/supabase";
import { AppError } from "@/domain/errors";
type Context = { params: Promise<{ action: string }> };
export async function POST(request: Request, { params }: Context) {
  return handle(async () => {
    const profile = await requireAdmin();
    const { action } = await params;
    const service = new AdministrationService();
    if (action === "invitations") {
      const { email } = await readBody(request, z.object({ email: z.email() }));
      return service.invite(profile.id, email);
    }
    if (action === "publish") {
      const body = await readBody(
        request,
        z.object({ id: z.string().max(100), published: z.boolean() }),
      );
      return service.publish(body.id, body.published);
    }
    if (action === "import") {
      const body = await readBody(
        request,
        z.object({ entries: z.array(z.unknown()).min(1).max(500) }),
        3000000,
      );
      return new ContentImporter(adminClient()).import(body.entries);
    }
    throw new AppError("NOT_FOUND", "Action not found", 404);
  });
}
