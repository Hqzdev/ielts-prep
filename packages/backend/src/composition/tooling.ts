import type { SupabaseClient } from "@supabase/supabase-js";
import { InvitationIssuer } from "../application/services/invitations";
import { ContentImporter } from "../application/services/content-import";
import { SupabaseInvitationStore } from "../infrastructure/persistence/identity";
import { SupabaseContentStore } from "../infrastructure/persistence/administration";
import {
  SystemClock,
  NodeContentEncoding,
  SecureInvitationTokens,
} from "../infrastructure/runtime";

export function createTooling(db: SupabaseClient, appUrl: string) {
  const encoding = new NodeContentEncoding();
  return {
    content: new ContentImporter(new SupabaseContentStore(db), encoding),
    invitations: new InvitationIssuer(
      new SupabaseInvitationStore(db),
      new SecureInvitationTokens(),
      encoding,
      new SystemClock(),
      appUrl,
    ),
  };
}
