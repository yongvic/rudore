import { notFound } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiGet } from "@/lib/api";
import type { StartupDetailResponse } from "@/lib/api-types";

export default async function StartupDetailPage({
  params,
}: {
  params: { startupId: string };
}) {
  let startup: StartupDetailResponse | null = null;

  try {
    startup = await apiGet<StartupDetailResponse>(
      `/api/startups/${params.startupId}`
    );
  } catch {
    startup = null;
  }

  if (!startup) {
    notFound();
  }

  return (
    <div className="flex flex-1 flex-col">
      <TopBar
        title={startup.name}
        description={startup.description}
        actionLabel="Ouvrir un brief IA"
      />

      <main className="flex-1 px-8 py-10">
        <section className="flex flex-wrap items-center gap-3">
          <Badge variant="accent">{startup.sector}</Badge>
          <Badge variant="neutral">Phase: {startup.stage}</Badge>
          <Badge variant="info">Confiance data: 0,84</Badge>
        </section>

        <section className="mt-8 rounded-2xl border border-border/70 bg-surface/70 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground font-display">
              Indicateurs clés
            </h2>
            <Button size="sm" variant="ghost">
              Exporter
            </Button>
          </div>
          {startup.metrics.length > 0 ? (
            <div className="mt-6 grid gap-5 md:grid-cols-4">
              {startup.metrics.map((metric) => (
                <div key={metric.label} className="border-b border-border/60 pb-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted">
                    {metric.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-foreground font-display">
                    {metric.value}
                  </p>
                  <p className="break-words text-sm text-muted">
                    {metric.delta}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm text-muted">
              Aucun indicateur clé disponible pour cette startup.
            </p>
          )}
        </section>

        <div className="mt-8 grid gap-6 xl:grid-cols-12">
          <section className="rounded-2xl border border-border/70 bg-surface/70 p-6 xl:col-span-6">
            <h2 className="text-lg font-semibold text-foreground font-display">
              Activité récente
            </h2>
            {startup.timeline.length > 0 ? (
              <div className="mt-6 space-y-4">
                {startup.timeline.map((item) => (
                  <div key={item.title} className="space-y-2 border-b border-border/60 pb-4 last:border-b-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <p className="min-w-0 break-words text-sm font-medium text-foreground">
                        {item.title}
                      </p>
                      <span className="text-xs text-muted">{item.date}</span>
                    </div>
                    <p className="break-words text-sm text-muted">{item.detail}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-6 text-sm text-muted">
                Aucune activité récente signalée.
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-border/70 bg-surface/70 p-6 xl:col-span-6">
            <h2 className="text-lg font-semibold text-foreground font-display">
              Recommandations IA
            </h2>
            {startup.recommendations.length > 0 ? (
              <div className="mt-6 space-y-4">
                {startup.recommendations.map((item) => (
                  <div key={item.title} className="space-y-2 border-b border-border/60 pb-4 last:border-b-0 last:pb-0">
                    <p className="min-w-0 break-words text-sm font-medium text-foreground">
                      {item.title}
                    </p>
                    <p className="break-words text-sm text-muted">{item.detail}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-6 text-sm text-muted">
                Pas de recommandations IA disponibles.
              </p>
            )}
          </section>
        </div>

        <section className="mt-8 rounded-2xl border border-border/70 bg-surface/70 p-6">
          <h2 className="text-lg font-semibold text-foreground font-display">
            Intelligence marché
          </h2>
          {startup.intelligence.length > 0 ? (
            <div className="mt-6 space-y-4">
              {startup.intelligence.map((item) => (
                <div key={item.title} className="flex items-start justify-between gap-6 border-b border-border/60 pb-4 last:border-b-0 last:pb-0">
                  <div>
                    <p className="min-w-0 break-words text-sm font-medium text-foreground">
                      {item.title}
                    </p>
                    <p className="break-words text-sm text-muted">
                      {item.detail}
                    </p>
                  </div>
                  <Badge variant="neutral">{item.tag}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm text-muted">
              Aucune intelligence marché disponible.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}

