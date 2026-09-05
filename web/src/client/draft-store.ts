import { openDB } from "idb";
import type { Answer } from "@/domain/attempt";

export interface LocalDraft {
  answer: Answer;
  revision: number;
  savedAt: number;
}
export class DraftStore {
  private async database() {
    return openDB("ielts-prep-drafts", 1, {
      upgrade(db) {
        db.createObjectStore("drafts");
        db.createObjectStore("recordings");
      },
    });
  }
  async get(key: string): Promise<LocalDraft | undefined> {
    return (await this.database()).get("drafts", key);
  }
  async save(key: string, draft: LocalDraft) {
    await (await this.database()).put("drafts", draft, key);
  }
  async remove(key: string) {
    await (await this.database()).delete("drafts", key);
  }
  async saveRecording(key: string, blob: Blob) {
    await (await this.database()).put("recordings", blob, key);
  }
  async recording(key: string): Promise<Blob | undefined> {
    return (await this.database()).get("recordings", key);
  }
  async removeRecording(key: string) {
    await (await this.database()).delete("recordings", key);
  }
  async removeUser(userId: string) {
    const db = await this.database();
    const transaction = db.transaction(["drafts", "recordings"], "readwrite");
    for (const name of ["drafts", "recordings"] as const) {
      const store = transaction.objectStore(name);
      let cursor = await store.openCursor();
      while (cursor) {
        if (String(cursor.key).startsWith(`${userId}:`)) await cursor.delete();
        cursor = await cursor.continue();
      }
    }
    await transaction.done;
  }
}
