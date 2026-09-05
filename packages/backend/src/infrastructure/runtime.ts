import type { InvitationTokens } from "../application/ports/identity";
import { randomInt, randomUUID, createHash, randomBytes } from "node:crypto";
import type {
  Clock,
  IdentifierSource,
  RandomSource,
  ContentEncoding,
} from "../application/ports/runtime";

export class SystemClock implements Clock {
  now() {
    return new Date();
  }
}

export class SecureIdentifiers implements IdentifierSource {
  create() {
    return randomUUID();
  }
}

export class SecureRandom implements RandomSource {
  integer(upperBound: number) {
    return randomInt(upperBound);
  }
}

export class NodeContentEncoding implements ContentEncoding {
  fingerprint(value: string) {
    return createHash("sha256").update(value).digest("hex");
  }
  base64(bytes: Uint8Array) {
    return Buffer.from(bytes).toString("base64");
  }
}

export class SecureInvitationTokens implements InvitationTokens {
  create() {
    return randomBytes(32).toString("hex");
  }
}
