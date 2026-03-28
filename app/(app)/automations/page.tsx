import { TopBar } from "@/components/layout/top-bar";
import { Badge } from "@/components/ui/badge";
import { CreateWorkflowButton } from "@/components/automations/create-workflow-button";
import { apiGet } from "@/lib/api";
import type { AutomationsResponse } from "@/lib/api-types";

export default async function AutomationsPage() {
  const data = await apiGet<AutomationsResponse>("/api/automations");
  const { workflows, history } = data;

  return (
    <div className="flex flex-1 flex-col">
      <TopBar
        title="Moteur d'automatisation"
        description="Construisez des workflows intelligents pour orchestrer l'exécution."
      />

      <main className="flex-1 px-8 py-10">
        <section className="rounded-2xl border border-border/70 bg-surface/70 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground font-display">
              Workflows actifs
            </h2>
            <div className="flex items-center gap-2">
              <CreateWorkflowButton />
              <a
                href="/automations/builder"
                className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-transparent bg-transparent px-3 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-[color-mix(in_oklab,var(--border),transparent_55%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Voir le builder
              </a>
            </div>
          </div>
          {workflows.length > 0 ? (
            <div className="mt-6 space-y-4">
              {workflows.map((workflow) => (
                <div
                  key={workflow.name}
                  className="border-b border-border/60 pb-4 last:border-b-0 last:pb-0"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex min-w-0 flex-col">
                      <a
                        href={
                          workflow.id
                            ? `/automations/builder/${workflow.id}`
                            : "#"
                        }
                        className="min-w-0 break-words text-sm font-medium text-foreground hover:underline"
                      >
                        {workflow.name}
                      </a>
                      {workflow.lastRun ? (
                        <span className="text-xs text-muted">
                          Dernière exécution: {workflow.lastRun}
                        </span>
                      ) : null}
                    </div>
                    <Badge variant="neutral">{workflow.status}</Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted">
                    <span className="min-w-0 break-words">
                      Trigger: {workflow.trigger}
                    </span>
                    <span className="min-w-0 break-words">
                      Action: {workflow.action}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm text-muted">
              Aucun workflow actif. Créez un premier scénario.
            </p>
          )}
        </section>

        <section className="mt-8 rounded-2xl border border-border/70 bg-surface/70 p-6">
          <h2 className="text-lg font-semibold text-foreground font-display">
            Historique d'exécution
          </h2>
          {history.length > 0 ? (
            <div className="mt-6 space-y-4">
              {history.map((item) => (
                <div
                  key={item.title}
                  className="border-b border-border/60 pb-4 last:border-b-0 last:pb-0"
                >
                  <div className="flex items-center justify-between">
                    <p className="min-w-0 break-words text-sm font-medium text-foreground">
                      {item.title}
                    </p>
                    <span className="text-xs text-muted">{item.time}</span>
                  </div>
                  <p className="mt-2 break-words text-sm text-muted">
                    {item.detail}
                  </p>
                  {item.status ? (
                    <div className="mt-2 text-xs text-muted">
                      Statut: {item.status}
                      {item.error ? ` • ${item.error}` : ""}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm text-muted">
              Aucun historique d’exécution disponible.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
