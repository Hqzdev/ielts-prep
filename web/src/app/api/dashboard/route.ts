import { handle } from "@/server/http";
import { requireProfile } from "@/server/identity";
import { LearningService } from "@/server/services/learning";
export async function GET() {
  return handle(async () =>
    new LearningService().dashboard(await requireProfile()),
  );
}
