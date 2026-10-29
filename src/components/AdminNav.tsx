"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export const adminNav = [
  { href: "/admin", label: "Dashboard", icon: "⌂" },
  { href: "/admin/applications", label: "Applications", short: "Apps", icon: "✎" },
  { href: "/admin/angels", label: "Angels & Lists", short: "Angels", icon: "✦" },
  { href: "/admin/prices", label: "Gift Prices", icon: "¢" },
  { href: "/admin/sponsors", label: "Givers", icon: "♡" },
  { href: "/admin/donations", label: "Money & Gifts", short: "Money", icon: "$" },
  { href: "/admin/partners", label: "Business Partners", icon: "★" },
  { href: "/admin/needs", label: "Ministry Needs", icon: "☰" },
  { href: "/admin/thank-yous", label: "Thank-You Notes", icon: "✉" },
  { href: "/admin/families", label: "Family History", icon: "⌘" },
  { href: "/admin/statements", label: "Giving Statements", icon: "▤" },
  { href: "/admin/tags", label: "Gift Tags", icon: "⎙" },
  { href: "/admin/pickup", label: "Pickup Day", short: "Pickup", icon: "✓" },
  { href: "/admin/seasons", label: "Seasons & Deadlines", icon: "◷" },
];

const testModeItem = { href: "/admin/sandbox", label: "Test Mode & Outbox", icon: "🧪" };

const navFor = (testMode?: boolean) => (testMode ? [...adminNav, testModeItem] : adminNav);

// The five pages the owner uses most get a spot in the phone tab bar.
const tabs = ["/admin", "/admin/applications", "/admin/angels", "/admin/donations", "/admin/pickup"];

function useActive() {
  const path = usePathname();
  return (href: string) => (href === "/admin" ? path === "/admin" : path.startsWith(href));
}

export function SidebarNav({ testMode }: { testMode?: boolean }) {
  const active = useActive();
  return (
    <nav className="flex flex-col gap-0.5 px-3 pb-4">
      {navFor(testMode).map((n) => (
        <Link
          key={n.href}
          href={n.href}
          className={`rounded-lg px-3 py-2 text-sm no-underline ${active(n.href) ? "bg-white/15 font-semibold text-white" : "text-white/80 hover:bg-white/10"}`}
        >
          {n.label}
        </Link>
      ))}
    </nav>
  );
}

/** Phone header: brand, current page, and a menu with every page plus the season switcher. */
export function MobileHeader({
  seasonSwitcher,
  signOut,
  testMode,
}: {
  seasonSwitcher: React.ReactNode;
  signOut: React.ReactNode;
  testMode?: boolean;
}) {
  const active = useActive();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  // Also close when the page changes some other way (back button, tab bar).
  useEffect(() => setOpen(false), [path]);
  const items = navFor(testMode);
  const current = items.filter((n) => active(n.href)).pop();

  return (
    <div className="no-print sticky top-0 z-40 lg:hidden">
      <div className="flex items-center justify-between gap-3 bg-dusk-900 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 text-white">
        <Link href="/admin" className="flex items-center gap-2 text-white no-underline">
          <span className="text-gold-300">✦</span>
          <span className="font-display text-lg">LIFT Admin</span>
        </Link>
        <span className="truncate text-sm text-white/70">{current?.label}</span>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="rounded-full border border-white/40 px-3 py-1.5 text-sm font-semibold"
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>
      {open && (
        <div className="max-h-[calc(100dvh-8rem)] overflow-y-auto bg-dusk-800 px-4 pt-3 pb-6 text-white shadow-xl">
          <div className="mb-3">{seasonSwitcher}</div>
          <nav className="grid grid-cols-2 gap-2">
            {items.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className={`rounded-xl px-3 py-3 text-sm no-underline ${active(n.href) ? "bg-white text-dusk-800" : "bg-white/10 text-white"}`}
              >
                <span aria-hidden className="mr-1.5 text-gold-300">{n.icon}</span>
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex items-center justify-between text-sm">
            <Link href="/" className="text-white/70">View public site ↗</Link>
            {signOut}
          </div>
        </div>
      )}
    </div>
  );
}

export function MobileTabBar() {
  const active = useActive();
  return (
    <nav
      aria-label="Admin shortcuts"
      className="no-print fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-black/10 bg-white pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-2px_10px_rgba(0,0,0,0.05)] lg:hidden"
    >
      {tabs.map((href) => {
        const n = adminNav.find((x) => x.href === href)!;
        const on = active(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex min-w-0 flex-col items-center gap-1 px-0.5 pt-3 pb-2 text-[0.8rem] leading-tight no-underline ${on ? "font-semibold text-dusk-700" : "text-black/60"}`}
          >
            <span aria-hidden className={`text-2xl leading-none ${on ? "text-gold-500" : ""}`}>{n.icon}</span>
            <span className="max-w-full truncate">{n.short ?? n.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
