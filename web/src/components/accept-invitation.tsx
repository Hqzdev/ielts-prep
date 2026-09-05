"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/client/api";
import { errorMessage } from "@/domain/errors";
import { Button, ErrorNotice } from "./ui";
export function AcceptInvitation({ token }: { token: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function accept() {
    setBusy(true);
    try {
      await api("/api/invitations/accept", {
        method: "POST",
        body: JSON.stringify({ token }),
      });
      router.push("/onboarding");
      router.refresh();
    } catch (error) {
      setError(errorMessage(error));
      setBusy(false);
    }
  }
  return (
    <div className="stack">
      <ErrorNotice message={error} />
      <Button busy={busy} onClick={accept}>
        Accept invitation
      </Button>
    </div>
  );
}
