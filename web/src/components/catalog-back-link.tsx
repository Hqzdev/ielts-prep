"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import type { Skill } from "@/domain/task";

export function CatalogBackLink({
  skill,
  children,
}: {
  skill: Skill;
  children: ReactNode;
}) {
  const router = useRouter();
  const base = `/tests/${skill}`;
  return (
    <Link
      href={base}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
          return;
        const saved = sessionStorage.getItem(`catalog:${skill}`);
        if (!saved || !(saved === base || saved.startsWith(`${base}?`))) return;
        event.preventDefault();
        router.push(saved);
      }}
    >
      {children}
    </Link>
  );
}
