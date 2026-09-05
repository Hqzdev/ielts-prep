"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Menu,
  X,
  CircleUserRound,
  ChartColumn,
  FileText,
  TrendingUp,
  Languages,
  Gamepad2,
  CalendarCheck,
  ChevronRight,
} from "lucide-react";
import type { Profile } from "@veylo/backend/domain/profile";
import { VeyCharacter } from "./orbit-ui";
import { ProductBrand } from "./product-brand";
import { DailyStreakBadge } from "./daily-streak";

const navigation = [
  { href: "/", label: "Home", icon: ChartColumn },
  { href: "/tests/reading", label: "Tests", icon: FileText },
  { href: "/statistics?tab=overview", label: "Progress", icon: TrendingUp },
  { href: "/vocabulary", label: "Vocabulary", icon: Languages },
  { href: "/ai", label: "Vey AI", icon: ChartColumn },
  { href: "/arcade", label: "Arcade", icon: Gamepad2 },
];

function pathMatches(pathname: string, href: string) {
  const route = href.split("?")[0];
  if (route === "/tests/reading")
    return pathname.startsWith("/tests") || pathname.startsWith("/practice");
  return pathname === route;
}

function NavigationLinks({
  profile,
  onNavigate,
}: {
  profile: Profile;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const links =
    profile.role === "admin"
      ? [
          ...navigation,
          { href: "/admin", label: "Master Tool", icon: CalendarCheck },
        ]
      : navigation;
  return links.map(({ href, label, icon: Icon }) => (
    <Link
      key={href}
      href={href}
      prefetch={false}
      onClick={onNavigate}
      className={`orbit-nav-link ${href === "/admin" ? "orbit-nav-admin" : ""}`}
      aria-label={label}
      title={label}
      aria-current={pathMatches(pathname, href) ? "page" : undefined}
    >
      {href === "/ai" ? (
        <span className="preppy-nav-face">
          <VeyCharacter size={18} expression="neutral" still />
        </span>
      ) : (
        <Icon size={16} aria-hidden="true" />
      )}
      <span>{label}</span>
      {href === "/admin" && <ChevronRight size={16} />}
    </Link>
  ));
}

export function SiteNavigation({ profile }: { profile: Profile }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  return (
    <aside className="orbit-sidebar">
      <a href="#main-content" className="orbit-skip-link">
        Skip to content
      </a>
      <ProductBrand />
      <nav className="orbit-desktop-nav" aria-label="Main navigation">
        <NavigationLinks profile={profile} />
      </nav>
      <DailyStreakBadge />
      <Link
        href="/account"
        className="orbit-account-link"
        aria-label="My account"
        aria-current={pathname === "/account" ? "page" : undefined}
      >
        <CircleUserRound size={16} />
        <span>Profile</span>
      </Link>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger asChild>
          <button className="orbit-menu-trigger" aria-label="Open navigation">
            <Menu size={22} />
          </button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content
            className="orbit-mobile-menu"
            aria-describedby={undefined}
          >
            <div className="spread">
              <Dialog.Title>Veylo</Dialog.Title>
              <Dialog.Close asChild>
                <button className="icon-button" aria-label="Close navigation">
                  <X size={22} />
                </button>
              </Dialog.Close>
            </div>
            <nav aria-label="Mobile navigation">
              <NavigationLinks
                profile={profile}
                onNavigate={() => setOpen(false)}
              />
              <Link
                href="/account"
                className="orbit-nav-link"
                onClick={() => setOpen(false)}
              >
                My account
              </Link>
            </nav>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </aside>
  );
}

export { PreppyChat as PreppyAssistantButton } from "./preppy-chat";
