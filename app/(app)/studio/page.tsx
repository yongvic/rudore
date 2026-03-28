import { TopBar } from "@/components/layout/top-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiGet } from "@/lib/api";
import type { StudioResponse } from "@/lib/api-types";

export default async function StudioPage() {
  const data = await apiGet<StudioResponse>("/api/studio");

  return (
    <div className="flex flex-1 flex-col">
      <TopBar
        title="Studio d'innovation"
        description="Détection d'opportunités et génération de venture blueprints."
      />

      <main className="flex-1 px-8 py-10">
        <form
          action="/api/studio/scan"
          method="post"
          className="flex items-center justify-between gap-4 rounded-2xl border border-border/70 bg-surface/70 px-6 py-4"
        >
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted">
              Scan studio
            </p>
            <p className="mt-2 text-sm text-foreground">
              Lancez une génération de blueprints basée sur les signaux récents.
            </p>
          </div>
          <Button size="sm" variant="secondary" type="submit">
            Générer un blueprint
          </Button>
        </form>

        <section className="mt-8 rounded-2xl border border-border/70 bg-surface/70 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground font-display">
              Blueprints stratégiques
            </h2>
            <Badge variant="accent">{data.blueprints.length} concepts</Badge>
          </div>
          {data.blueprints.length > 0 ? (
            <div className="mt-6 space-y-6">
              {data.blueprints.map((blueprint) => (
                <div
                  key={blueprint.title}
                  className="space-y-3 border-b border-border/60 pb-6 last:border-b-0 last:pb-0"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <p className="min-w-0 break-words text-sm font-medium text-foreground">
                      {blueprint.title}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="neutral">
                        Impact {blueprint.impactScore}
                      </Badge>
                      <Badge variant="info">
                        Confiance {blueprint.confidenceScore}
                      </Badge>
                    </div>
                  </div>
                  <p className="break-words text-sm text-muted">
                    {blueprint.problem}
                  </p>
                  <div className="rounded-xl border border-border/60 bg-surface/80 p-4 text-sm text-muted">
                    {blueprint.solution}
                  </div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted">
                    Marché cible
                  </p>
                  <p className="text-sm text-foreground">
                    {blueprint.targetMarket}
                  </p>
                  {blueprint.validationSignals.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {blueprint.validationSignals.map((signal) => (
                        <Badge key={signal} variant="secondary">
                          {signal}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                  {blueprint.riskFactors.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {blueprint.riskFactors.map((risk) => (
                        <Badge key={risk} variant="ghost">
                          {risk}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm text-muted">
              Aucun blueprint généré pour le moment.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
