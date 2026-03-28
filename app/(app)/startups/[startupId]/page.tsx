import { TopBar } from "@/components/layout/top-bar";
import { Badge } from "@/components/ui/badge";
import { StartupTasksPanel } from "@/components/tasks/startup-tasks-panel";
import { apiGet } from "@/lib/api";
import type { StartupDetailResponse } from "@/lib/api-types";

export default async function StartupDetailPage({
  params,
}: {
  params: Promise<{ startupId: string }>;
}) {
  const { startupId } = await params;
  const data = await apiGet<StartupDetailResponse>(`/api/startups/${startupId}`);

  return (
    <div className="flex flex-1 flex-col">
      <TopBar
        title={data.name}
        description={`${data.sector} · ${data.stage}`}
        actionLabel="Ajouter un signal externe"
      />

      <main className="flex-1 px-8 py-10">
        <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-border/70 bg-surface/70 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground font-display">
                  Alertes externes
                </h2>
                <Badge variant="danger">{data.alerts.length} actives</Badge>
              </div>
              {data.alerts.length > 0 ? (
                <div className="mt-6 space-y-4">
                  {data.alerts.map((alert) => (
                    <div
                      key={alert.title}
                      className="border-b border-border/60 pb-4 last:border-b-0 last:pb-0"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="min-w-0 break-words text-sm font-medium text-foreground">
                          {alert.title}
                        </p>
                        <Badge variant={alert.tone}>{alert.label}</Badge>
                      </div>
                      <p className="mt-2 break-words text-sm text-muted">
                        {alert.detail}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-6 text-sm text-muted">
                  Aucune alerte prioritaire détectée.
                </p>
              )}
            </section>

            <section className="rounded-2xl border border-border/70 bg-surface/70 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground font-display">
                  Intelligence dédiée
                </h2>
                <Badge variant="info">{data.intelligence.length} signaux</Badge>
              </div>
              {data.intelligence.length > 0 ? (
                <div className="mt-6 space-y-4">
                  {data.intelligence.map((item) => (
                    <div
                      key={item.title}
                      className="border-b border-border/60 pb-4 last:border-b-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3">
                        <p className="min-w-0 break-words text-sm font-medium text-foreground">
                          {item.title}
                        </p>
                        <Badge variant="neutral">{item.tag}</Badge>
                      </div>
                      <p className="mt-2 break-words text-sm text-muted">
                        {item.detail}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-6 text-sm text-muted">
                  Aucun signal ciblé pour cette startup.
                </p>
              )}
            </section>

            <section className="rounded-2xl border border-border/70 bg-surface/70 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground font-display">
                  Recommandations IA
                </h2>
                <Badge variant="accent">
                  {data.recommendations.length} actions
                </Badge>
              </div>
              {data.recommendations.length > 0 ? (
                <div className="mt-6 space-y-4">
                  {data.recommendations.map((reco) => (
                    <div
                      key={reco.title}
                      className="border-b border-border/60 pb-4 last:border-b-0 last:pb-0"
                    >
                      <p className="min-w-0 break-words text-sm font-medium text-foreground">
                        {reco.title}
                      </p>
                      <p className="mt-2 break-words text-sm text-muted">
                        {reco.detail}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-6 text-sm text-muted">
                  Pas de recommandations pour le moment.
                </p>
              )}
            </section>

            <section className="rounded-2xl border border-border/70 bg-surface/70 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground font-display">
                  Tâches stratégiques
                </h2>
                <Badge variant="secondary">{data.tasks.length} ouvertes</Badge>
              </div>
              <div className="mt-6">
                <StartupTasksPanel
                  startupSlug={startupId}
                  startupName={data.name}
                  initialTasks={data.tasks}
                />
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-border/70 bg-surface/70 p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-muted">
                Synthèse
              </p>
              <h2 className="mt-3 text-lg font-semibold text-foreground font-display">
                {data.name}
              </h2>
              <p className="mt-3 text-sm text-muted">{data.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="neutral">{data.sector}</Badge>
                <Badge variant="secondary">{data.stage}</Badge>
              </div>
            </section>

            <section className="rounded-2xl border border-border/70 bg-surface/70 p-6">
              <h3 className="text-lg font-semibold text-foreground font-display">
                Synergies détectées
              </h3>
              {data.synergies.length > 0 ? (
                <div className="mt-6 space-y-4">
                  {data.synergies.map((synergy) => (
                    <div
                      key={synergy.title}
                      className="border-b border-border/60 pb-4 last:border-b-0 last:pb-0"
                    >
                      <p className="text-sm font-medium text-foreground">
                        {synergy.title}
                      </p>
                      <p className="mt-2 text-sm text-muted">
                        {synergy.detail}
                      </p>
                      {synergy.tags.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {synergy.tags.map((tag) => (
                            <Badge key={tag} variant="ghost">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted">
                  Aucune synergie transversale pour le moment.
                </p>
              )}
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
