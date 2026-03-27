import { TopBar } from "@/components/layout/top-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiGet } from "@/lib/api";
import type { DashboardResponse } from "@/lib/api-types";

export default async function DashboardPage() {
  const data = await apiGet<DashboardResponse>("/api/dashboard");
  const { kpis, alerts, insights, watchlist, marketSignals, execution } = data;

  return (
    <div className="flex flex-1 flex-col">
      <TopBar
        title="Tableau de bord global"
        description="Vue stratégique consolidée sur l'écosystème Rudore et ses signaux critiques."
        actionLabel="Lancer un brief IA"
      />

      <main className="flex-1 px-8 py-10">
        <section className="border-y border-border py-6">
          {kpis.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-4">
              {kpis.map((kpi) => (
                <div key={kpi.label} className="flex flex-col gap-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted">
                    {kpi.label}
                  </p>
                  <p className="text-3xl font-semibold text-foreground font-display">
                    {kpi.value}
                  </p>
                  <p className="text-sm text-muted">{kpi.delta}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">
              Aucun KPI disponible pour le moment.
            </p>
          )}
        </section>

        <div className="mt-10 grid gap-6 xl:grid-cols-12">
          <section className="rounded-2xl border border-border/70 bg-surface/70 p-6 xl:col-span-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground font-display">
                Portefeuille en bref
              </h2>
              <Badge variant="accent">Synthèse</Badge>
            </div>
            {watchlist.length > 0 ? (
              <div className="mt-6 space-y-4">
                {watchlist.map((item) => (
                  <div key={item.name} className="space-y-2 border-b border-border/60 pb-4 last:border-b-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <span className="min-w-0 break-words text-base font-medium text-foreground">
                        {item.name}
                      </span>
                      <Badge variant="neutral">{item.status}</Badge>
                    </div>
                    <p className="break-words text-sm text-muted">{item.note}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-6 text-sm text-muted">
                Aucun portefeuille prioritaire pour l’instant.
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-border/70 bg-surface/70 p-6 xl:col-span-7">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground font-display">
                Insights IA prioritaires
              </h2>
              <Button size="sm" variant="ghost">
                Explorer tous les insights
              </Button>
            </div>
            {insights.length > 0 ? (
              <div className="mt-6 space-y-5">
                {insights.map((insight) => (
                  <div key={insight.title} className="space-y-2 border-b border-border/60 pb-5 last:border-b-0 last:pb-0">
                    <div className="flex items-center justify-between gap-4">
                      <p className="min-w-0 break-words text-base font-medium text-foreground">
                        {insight.title}
                      </p>
                      <span className="text-xs text-muted">
                        Confiance {insight.confidence}
                      </span>
                    </div>
                    <p className="break-words text-sm text-muted">
                      {insight.summary}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-6 text-sm text-muted">
                Aucun insight prioritaire disponible.
              </p>
            )}
          </section>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-12">
          <section className="rounded-2xl border border-border/70 bg-surface/70 p-6 xl:col-span-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground font-display">
                Alertes prioritaires
              </h2>
              <Badge variant="danger">{alerts.length} actives</Badge>
            </div>
            {alerts.length > 0 ? (
              <div className="mt-6 space-y-4">
                {alerts.map((alert) => (
                  <div key={alert.title} className="space-y-2 border-b border-border/60 pb-4 last:border-b-0 last:pb-0">
                    <div className="flex items-center justify-between gap-3">
                      <p className="min-w-0 break-words text-sm font-medium text-foreground">
                        {alert.title}
                      </p>
                      <Badge variant={alert.tone}>
                        {alert.label}
                      </Badge>
                    </div>
                    <p className="break-words text-xs text-muted">{alert.detail}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-6 text-sm text-muted">
                Aucune alerte active pour le moment.
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-border/70 bg-surface/70 p-6 xl:col-span-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground font-display">
                Signaux marché
              </h2>
              <Badge variant="info">Veille en direct</Badge>
            </div>
            {marketSignals.length > 0 ? (
              <div className="mt-6 space-y-4">
                {marketSignals.map((signal) => (
                  <div
                    key={signal.title}
                    className="flex items-start justify-between gap-6 border-b border-border/60 pb-4 last:border-b-0 last:pb-0"
                  >
                    <div>
                      <p className="min-w-0 break-words text-sm font-medium text-foreground">
                        {signal.title}
                      </p>
                      <p className="mt-2 break-words text-sm text-muted">
                        {signal.summary}
                      </p>
                    </div>
                    <Badge variant="neutral">{signal.tag}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-6 text-sm text-muted">
                Aucun signal marché prioritaire.
              </p>
            )}
          </section>
        </div>

        <section className="mt-8 rounded-2xl border border-border/70 bg-surface/70 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground font-display">
              Exécution automatisée
            </h2>
            <Button size="sm" variant="secondary">
              Voir le moteur
            </Button>
          </div>
          {execution.length > 0 ? (
            <div className="mt-6 space-y-4">
              {execution.map((item) => (
                <div
                  key={item.title}
                  className="border-b border-border/60 pb-4 last:border-b-0 last:pb-0"
                >
                  <div className="flex items-center justify-between">
                    <p className="min-w-0 break-words text-sm font-medium text-foreground">
                      {item.title}
                    </p>
                    <Badge variant={item.tone}>{item.status}</Badge>
                  </div>
                  <p className="mt-2 break-words text-sm text-muted">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm text-muted">
              Aucune exécution automatisée récente.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
