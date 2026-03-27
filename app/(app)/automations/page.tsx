import { TopBar } from "@/components/layout/top-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
        actionLabel="Créer un workflow"
      />

      <main className="flex-1 px-8 py-10">
        <section className="rounded-2xl border border-border/70 bg-surface/70 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground font-display">
              Workflows actifs
            </h2>
            <Button size="sm" variant="ghost">
              Voir le builder
            </Button>
          </div>
          <div className="mt-6 space-y-4">
            {workflows.map((workflow) => (
              <div key={workflow.name} className="border-b border-border/60 pb-4 last:border-b-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <p className="min-w-0 break-words text-sm font-medium text-foreground">
                    {workflow.name}
                  </p>
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
        </section>

        <section className="mt-8 rounded-2xl border border-border/70 bg-surface/70 p-6">
          <h2 className="text-lg font-semibold text-foreground font-display">
            Historique d'exécution
          </h2>
          <div className="mt-6 space-y-4">
            {history.map((item) => (
              <div key={item.title} className="border-b border-border/60 pb-4 last:border-b-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <p className="min-w-0 break-words text-sm font-medium text-foreground">
                    {item.title}
                  </p>
                  <span className="text-xs text-muted">{item.time}</span>
                </div>
                <p className="mt-2 break-words text-sm text-muted">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
