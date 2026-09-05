import type { InvitationStore, InvitationTokens } from "../ports/identity";
import type { Clock, ContentEncoding } from "../ports/runtime";

export class InvitationIssuer {
  constructor(
    private readonly store: InvitationStore,
    private readonly tokens: InvitationTokens,
    private readonly encoding: ContentEncoding,
    private readonly clock: Clock,
    private readonly appUrl: string,
  ) {}

  async issue(email: string, createdBy: string | null = null) {
    const token = this.tokens.create();
    const expiresAt = new Date(
      this.clock.now().getTime() + 7 * 86400000,
    ).toISOString();
    await this.store.create(
      email.trim().toLowerCase(),
      this.encoding.fingerprint(token),
      expiresAt,
      createdBy,
    );
    return {
      url: `${this.appUrl.replace(/\/$/, "")}/access?invite=${token}`,
      expiresAt,
    };
  }
}
