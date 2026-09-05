import type { ProfileInput } from "../../domain/profile";
import type { IdentityStore, AuthenticatedIdentity } from "../ports/identity";
import type { ContentEncoding } from "../ports/runtime";

export class IdentityService {
  constructor(
    private readonly store: IdentityStore,
    private readonly encoding: ContentEncoding,
    private readonly betaLimit: number,
  ) {}

  profile(identity: AuthenticatedIdentity) {
    return this.store.profile(identity);
  }

  async bearer(token: string) {
    const identity = await this.store.verify(token);
    return identity ? this.store.profile(identity) : null;
  }

  async save(userId: string, input: ProfileInput) {
    await this.store.save(userId, {
      ...input,
      studyDays: [...new Set(input.studyDays)],
    });
    return { saved: true };
  }

  async deleteAccount(userId: string) {
    await this.store.deleteAccount(userId);
    return { deleted: true };
  }

  async redeemInvitation(userId: string, token: string) {
    await this.store.redeemInvitation(
      userId,
      this.encoding.fingerprint(token),
      this.betaLimit,
    );
    return { accepted: true };
  }
}
