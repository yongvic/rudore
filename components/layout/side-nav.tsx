"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const navItems = [
  { label: "Tableau de bord", href: "/dashboard" },
  { label: "Startups", href: "/startups" },
  { label: "Tâches", href: "/tasks" },
  { label: "Intelligence", href: "/intelligence" },
  { label: "Synergies", href: "/synergies" },
  { label: "Studio", href: "/studio" },
  { label: "Assistant IA", href: "/assistant" },
  { label: "Automatisations", href: "/automations" },
  { label: "Écosystème", href: "/ecosystem" },
  { label: "Journal IA", href: "/action-logs" },
  { label: "Paramètres", href: "/settings" },
];

export function SideNav() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full flex-col gap-10 border-r border-border bg-surface/80 px-6 py-8">
      <div className="flex flex-col gap-3">
        <span className="text-xs uppercase tracking-[0.3em] text-muted">
          Rudore OS
        </span>
        <div className="text-lg font-semibold text-foreground">
          Venture Studio
        </div>
        <p className="text-sm text-muted">
          Intelligence opérationnelle pour un portefeuille panafricain.
        </p>
      </div>

      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-[color-mix(in_oklab,var(--accent),transparent_86%)] text-foreground"
                  : "text-muted hover:text-foreground"
              )}
            >
              {item.label}
              {active ? (
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-2xl border border-border/70 bg-elevated/70 p-4">
        <div className="text-xs uppercase tracking-[0.25em] text-muted">
          Pulse
        </div>
        <div className="mt-3 text-2xl font-semibold text-foreground">
          4 signaux critiques
        </div>
        <p className="mt-2 text-sm text-muted">
          Deux alertes marché, une tension réglementaire, une opportunité sectorielle.
        </p>
      </div>
    </aside>
  );
}
