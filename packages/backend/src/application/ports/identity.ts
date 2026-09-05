import type { Profile, ProfileInput } from "../../domain/profile";

export interface AuthenticatedIdentity {
  id: string;
  email: string;
}

export interface IdentityStore {
  verify(token: string): Promise<AuthenticatedIdentity | null>;
  profile(identity: AuthenticatedIdentity): Promise<Profile | null>;
  save(userId: string, input: ProfileInput): Promise<void>;
  deleteAccount(userId: string): Promise<void>;
  redeemInvitation(
    userId: string,
    tokenHash: string,
    limit: number,
  ): Promise<void>;
}

export interface InvitationStore {
  create(
    email: string,
    tokenHash: string,
    expiresAt: string,
    createdBy: string | null,
  ): Promise<void>;
}

export interface InvitationTokens {
  create(): string;
}
