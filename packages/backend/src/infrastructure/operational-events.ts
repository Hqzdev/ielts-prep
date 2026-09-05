import type { OperationalEvents } from "../application/ports/jobs";
import { recordMetric } from "./telemetry/context";

export class JsonOperationalEvents implements OperationalEvents {
  failed(event: string, identifiers: Record<string, string>) {
    recordMetric(event, { ...identifiers, success: false });
  }
  record(event: string, measurements: Record<string, number>) {
    recordMetric(event, measurements);
  }
}
