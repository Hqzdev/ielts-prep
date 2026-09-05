import "server-only";
import { createJobServices } from "@veylo/backend/composition/jobs";
import { backend } from "./backend";
import { adminClient } from "./supabase";
import { WorkflowAssessmentRunner } from "./workflow-runner";

export function jobServices() {
  return createJobServices(
    adminClient(),
    new WorkflowAssessmentRunner(),
    backend().practice,
  );
}
