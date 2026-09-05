"use client";
import { Button, EmptyState } from "@/components/ui";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="page">
      <EmptyState
        title="Could not load this page"
        action={<Button onClick={reset}>Try again</Button>}
      >
        Check your connection. Your saved answers are still in your account.
      </EmptyState>
    </div>
  );
}
