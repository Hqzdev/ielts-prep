"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowRight,
  CaretDown,
  Crown,
  EnvelopeSimple,
  Globe,
  LockKey,
  SignOut,
  Trash,
  UserCircle,
} from "@phosphor-icons/react";
import type { Profile } from "@/domain/profile";
import type { Attempt } from "@/domain/attempt";
import { browserClient } from "@/client/supabase";
import { DraftStore } from "@/client/draft-store";
import { api } from "@/client/api";
import { errorMessage } from "@/domain/errors";
import { AccountProfile } from "./account-profile";
import { Button, ErrorNotice, Modal } from "./ui";
import { VeyCharacter } from "./orbit-ui";

export function Account({
  profile: initialProfile,
  history,
  audio,
}: {
  profile: Profile;
  history: Attempt[];
  audio: { id: string; duration: number; expires_at: string }[];
}) {
  const [profile, setProfile] = useState(initialProfile);
  const [deleting, setDeleting] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function logout() {
    await browserClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      await api("/api/profile", {
        method: "DELETE",
        body: JSON.stringify({ confirmation }),
      });
      await new DraftStore().removeUser(profile.id);
      router.push("/login");
      router.refresh();
    } catch (caught) {
      setError(errorMessage(caught));
      setBusy(false);
    }
  }

  return (
    <div className="orbit-page orbit-account-page">
      <section className="orbit-account-hero">
        <VeyCharacter expression="happy" size={100} />
        <div>
          <span className="orbit-kicker">YOUR ACCOUNT</span>
          <h1>{profile.name}</h1>
          <p>{profile.email}</p>
          <div>
            <span>Target {profile.targetBand.toFixed(1)}</span>
            <span>Active</span>
          </div>
        </div>
      </section>

      <div className="orbit-account-grid">
        <section>
          <h2 className="orbit-account-title">
            <UserCircle size={23} weight="fill" /> Profile
          </h2>
          <div className="orbit-account-panel">
            <AccountProfile profile={profile} onSaved={setProfile} />
          </div>
        </section>
        <aside className="orbit-account-side">
          <section>
            <h2 className="orbit-account-title">
              <Globe size={23} weight="fill" /> Preferences
            </h2>
            <div className="orbit-account-panel orbit-language-panel">
              <strong>Language</strong>
              <span>
                <b>EN</b>
                <i>RU</i>
              </span>
            </div>
          </section>
          <section>
            <h2 className="orbit-account-title">
              <EnvelopeSimple size={23} weight="fill" /> Support
            </h2>
            <div className="orbit-account-panel orbit-support-panel">
              <a href="mailto:support@ielts-orbit.app">
                <span>
                  <EnvelopeSimple size={21} weight="bold" />
                  <b>
                    Email<small>support@ielts-orbit.app</small>
                  </b>
                </span>
                <ArrowRight size={17} weight="bold" />
              </a>
              <div>
                <Link href="/privacy">Privacy Policy</Link>
                <Link href="/terms">Terms of Service</Link>
              </div>
            </div>
          </section>
        </aside>
      </div>

      <div className="orbit-account-rows">
        <details>
          <summary>
            <span>
              <Crown size={21} weight="fill" /> Subscription
            </span>
            <b>Active</b>
            <CaretDown size={17} weight="bold" />
          </summary>
          <p>Your Veylo access is active.</p>
        </details>
        <details>
          <summary>
            <span>
              <LockKey size={21} weight="fill" /> Practice history
            </span>
            <b>{history.length} attempts</b>
            <CaretDown size={17} weight="bold" />
          </summary>
          <div className="orbit-account-history">
            {history.slice(0, 6).map((attempt) => (
              <Link href={`/results/${attempt.id}`} key={attempt.id}>
                <span>{attempt.taskSnapshot.title}</span>
                <ArrowRight size={16} weight="bold" />
              </Link>
            ))}
            {!history.length && (
              <p>Your completed attempts will appear here.</p>
            )}
          </div>
        </details>
        <details>
          <summary>
            <span>
              <EnvelopeSimple size={21} weight="fill" /> Recordings
            </span>
            <b>{audio.length} saved</b>
            <CaretDown size={17} weight="bold" />
          </summary>
          <p>Speaking recordings are stored for 30 days.</p>
        </details>
      </div>

      <div className="orbit-account-actions">
        <section className="orbit-signout-card">
          <Button variant="secondary" onClick={logout}>
            <SignOut size={18} weight="bold" /> Log out
          </Button>
          <small>Your account data stays safe.</small>
        </section>
        <section className="orbit-delete-card">
          <div>
            <Trash size={22} weight="fill" />
            <span>
              <h2>Delete account</h2>
              <p>Your data will be permanently removed after confirmation.</p>
            </span>
          </div>
          <button type="button" onClick={() => setDeleting(true)}>
            Delete account
          </button>
        </section>
      </div>

      <Modal
        open={deleting}
        onOpenChange={setDeleting}
        title="Delete your account?"
        description="Your profile, history, personal vocabulary, chats and recordings will be permanently deleted."
      >
        <label className="field">
          Type DELETE
          <input
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
          />
        </label>
        <ErrorNotice message={error} />
        <div className="modal-actions">
          <Button variant="secondary" onClick={() => setDeleting(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={remove}
            busy={busy}
            disabled={confirmation !== "DELETE"}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
