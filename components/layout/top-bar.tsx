import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";

export function TopBar({
  title,
  description,
  actionLabel,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
}) {
  return (
    <header className="flex flex-col gap-6 border-b border-border px-8 py-6">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.3em] text-muted">
            Rudore OS
          </p>
          <h1 className="mt-3 text-balance text-3xl font-semibold text-foreground font-display">
            {title}
          </h1>
          {description ? (
            <p className="mt-3 text-balance text-sm text-muted">
              {description}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {actionLabel ? (
            <Button size="sm" variant="secondary">
              {actionLabel}
            </Button>
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
        <span className="rounded-full border border-border px-3 py-1">
          Période: 30 derniers jours
        </span>
        <span className="rounded-full border border-border px-3 py-1">
          Zone: Afrique francophone + Nigeria
        </span>
        <span className="rounded-full border border-border px-3 py-1">
          Confiance IA: 0,82
        </span>
      </div>
    </header>
  );
}
