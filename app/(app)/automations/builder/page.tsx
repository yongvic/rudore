import { TopBar } from "@/components/layout/top-bar";
import { Badge } from "@/components/ui/badge";
import { apiGet } from "@/lib/api";
import type { AutomationsResponse } from "@/lib/api-types";

export default async function AutomationsBuilderIndex() {
  const data = await apiGet<AutomationsResponse>("/api/automations");

  return (
    <div className="flex flex-1 flex-col">
      <TopBar
        title="Builder d'automations"
        description="Sélectionnez un workflow à éditer ou créez-en un nouveau."
      />

      <main className="flex-1 px-8 py-10">
        <section className="rounded-2xl border border-border/70 bg-surface/70 p-6">
          <h2 className="text-lg font-semibold text-foreground font-display">
            Workflows disponibles
          </h2>
          {data.workflows.length > 0 ? (
            <div className="mt-6 space-y-4">
              {data.workflows.map((workflow) => (
                <div
                  key={workflow.name}
                  className="border-b border-border/60 pb-4 last:border-b-0 last:pb-0"
                >
                  <div className="flex items-center justify-between">
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
                    <Badge variant="neutral">{workflow.status}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted">
                    Trigger: {workflow.trigger} · Action: {workflow.action}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm text-muted">
              Aucun workflow disponible pour le moment.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
