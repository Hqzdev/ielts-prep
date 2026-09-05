import { z } from "zod";
import { handle } from "@/server/http";
import { requireProfile } from "@/server/identity";
import { backend } from "@/server/backend";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(_, async () =>
    backend().tutor.messages(
      (await requireProfile()).id,
      z.uuid().parse((await params).id),
    ),
  );
}
