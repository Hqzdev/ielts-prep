import { AppError } from "./errors";
import type { Profile } from "./profile";

export class AccessPolicy {
  require(profile: Profile | null): Profile {
    if (!profile)
      throw new AppError(
        "UNAUTHENTICATED",
        "Please sign in",
        "unauthenticated",
      );
    if (!profile.betaAccess)
      throw new AppError(
        "INVITATION_REQUIRED",
        "You need an invitation to access the app",
        "forbidden",
      );
    return profile;
  }

  admin(profile: Profile | null): Profile {
    const member = this.require(profile);
    if (member.role !== "admin")
      throw new AppError(
        "FORBIDDEN",
        "You don't have permission to do this",
        "forbidden",
      );
    return member;
  }
}
