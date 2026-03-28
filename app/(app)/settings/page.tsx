import { TopBar } from "@/components/layout/top-bar";
import { Badge } from "@/components/ui/badge";
import { AiGovernance } from "@/components/settings/ai-governance";
import { apiGet } from "@/lib/api";
import type { AiSettingsResponse, SettingsResponse } from "@/lib/api-types";

export default async function SettingsPage() {
  const data = await apiGet<SettingsResponse>("/api/settings");
  const aiData = await apiGet<AiSettingsResponse>("/api/settings/ai");

  return (
    <div className="flex flex-1 flex-col">
      <TopBar
        title="Paramètres"
        description="Gérez les accès, les sources et les intégrations du studio."
      />

      <main className="flex-1 px-8 py-10">
        <section className="rounded-2xl border border-border/70 bg-surface/70 p-6">
          <h2 className="text-lg font-semibold text-foreground font-display">
            Configuration
          </h2>
          {data.settings.length > 0 ? (
            <div className="mt-6 space-y-4">
              {data.settings.map((item) => (
                <div
                  key={item.title}
                  className="border-b border-border/60 pb-4 last:border-b-0 last:pb-0"
                >
                  <div className="flex items-center justify-between">
                    <p className="min-w-0 break-words text-sm font-medium text-foreground">
                      {item.title}
                    </p>
                    <Badge variant="neutral">Actif</Badge>
                  </div>
                  <p className="mt-2 break-words text-sm text-muted">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm text-muted">
              Aucun paramètre disponible actuellement.
            </p>
          )}
        </section>

        <section className="mt-8 rounded-2xl border border-border/70 bg-surface/70 p-6">
          <AiGovernance
            initialConfig={aiData.config}
            updatedAt={aiData.updatedAt}
          />
        </section>
      </main>
    </div>
  );
}
