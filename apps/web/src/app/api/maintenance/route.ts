import { jobServices } from "@/server/jobs";
import { timingSafeEqual } from "node:crypto";
import { handle } from "@/server/http";
import { AppError } from "@veylo/backend/domain/errors";

export const maxDuration = 300;
export async function GET(request: Request) {
  return handle(request, async () => {
    const secret = process.env.CRON_SECRET;
    const supplied = request.headers.get("authorization") ?? "";
    const expected = `Bearer ${secret}`;
    if (
      !secret ||
      supplied.length !== expected.length ||
      !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))
    )
      throw new AppError(
        "FORBIDDEN",
        "You don't have permission to do this",
        "forbidden",
      );
    return jobServices().maintenance.run();
  });
}
