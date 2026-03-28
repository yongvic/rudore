import Link from "next/link";
import { TopBar } from "@/components/layout/top-bar";
import { Badge } from "@/components/ui/badge";
import { apiGet } from "@/lib/api";
import type { StartupsResponse } from "@/lib/api-types";

export default async function StartupsPage() {
  const data = await apiGet<StartupsResponse>("/api/startups");

  return (
    <div className="flex flex-1 flex-col">
      <TopBar
        title="Portefeuille startups"
        description="Analysez chaque entité, ses signaux externes et les recommandations prioritaires."
        actionLabel="Ajouter au suivi"
      />

      <main className="flex-1 px-8 py-10">
        <section className="rounded-2xl border border-border/70 bg-surface/70">
          <div className="hidden grid-cols-[2fr_2fr_1fr_2fr_1fr] gap-6 border-b border-border/60 px-6 py-4 text-xs uppercase tracking-[0.2em] text-muted md:grid">
            <span>Startup</span>
            <span>Secteur</span>
            <span>Phase</span>
            <span>Priorité</span>
            <span>État</span>
          </div>
          {data.startups.length > 0 ? (
            <div className="divide-y divide-border/60">
              {data.startups.map((startup) => (
                <Link
                  key={startup.id}
                  href={`/startups/${startup.id}`}
                  className="flex min-w-0 flex-col gap-2 px-6 py-5 text-sm transition-colors hover:bg-[color-mix(in_oklab,var(--border),transparent_75%)] md:grid md:grid-cols-[2fr_2fr_1fr_2fr_1fr] md:gap-6"
                >
                  <div className="flex items-center justify-between gap-3 md:contents">
                    <span className="min-w-0 break-words text-foreground font-medium">
                      {startup.name}
                    </span>
                    <Badge
                      className="md:hidden"
                      variant={startup.health.tone}
                    >
                      {startup.health.label}
                    </Badge>
                  </div>
                  <span className="min-w-0 break-words text-muted">
                    {startup.sector}
                  </span>
                  <span className="min-w-0 break-words text-muted">
                    {startup.stage}
                  </span>
                  <span className="min-w-0 break-words text-muted">
                    {startup.focus}
                  </span>
                  <span className="hidden md:inline-flex">
                    <Badge variant={startup.health.tone}>
                      {startup.health.label}
                    </Badge>
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="px-6 py-8 text-sm text-muted">
              Aucune startup enregistrée pour le moment.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
