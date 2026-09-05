import type { ContentEntry } from "../../domain/task";

export interface AdministrationOverview {
  invitations: {
    id: string;
    email: string;
    expires_at: string;
    accepted_at: string | null;
    created_at: string;
  }[];
  tasks: {
    id: string;
    skill: string;
    published: boolean;
    current_version: number;
  }[];
  jobs: {
    id: string;
    assessment_id: string;
    state: string;
    tries: number;
    updated_at: string;
  }[];
  userCount: number;
}

export interface AdministrationStore {
  overview(): Promise<AdministrationOverview>;
  publish(id: string, published: boolean): Promise<void>;
}

export interface ContentStore {
  import(
    entry: ContentEntry,
    contentHash: string,
  ): Promise<"created" | "updated" | "unchanged">;
}
