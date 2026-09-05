import { jobServices } from "../jobs";

export function dispatchAssessments() {
  return jobServices().dispatch.dispatch();
}
