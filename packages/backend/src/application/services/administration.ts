import { AccessPolicy } from "../../domain/access-policy";
import type { Profile } from "../../domain/profile";
import type { ContentEntry } from "../../domain/task";
import type { AdministrationStore } from "../ports/administration";
import type { InvitationIssuer } from "./invitations";
import type { ContentImporter } from "./content-import";

export class AdministrationService {
  constructor(
    private readonly store: AdministrationStore,
    private readonly invitations: InvitationIssuer,
    private readonly content: ContentImporter,
  ) {}

  overview(profile: Profile) {
    new AccessPolicy().admin(profile);
    return this.store.overview();
  }

  invite(profile: Profile, email: string) {
    new AccessPolicy().admin(profile);
    return this.invitations.issue(email, profile.id);
  }

  async publish(profile: Profile, id: string, published: boolean) {
    new AccessPolicy().admin(profile);
    await this.store.publish(id, published);
    return { published };
  }

  import(profile: Profile, entries: ContentEntry[]) {
    new AccessPolicy().admin(profile);
    return this.content.import(entries);
  }
}
