import { TopBar } from "@/components/layout/top-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiGet } from "@/lib/api";
import type { CrossIntelligenceResponse } from "@/lib/api-types";

export default async function SynergiesPage() {
  const data = await apiGet<CrossIntelligenceResponse>(
    "/api/cross-intelligence"
  );

  return (
    <div className="flex flex-1 flex-col">
      <TopBar
        title="Synergies transverses"
        description="Reliez les signaux qui impactent plusieurs startups et priorisez les actions communes."
      />

      <main className="flex-1 px-8 py-10">
        <form
          action="/api/cross-intelligence/scan"
          method="post"
          className="flex items-center justify-between gap-4 rounded-2xl border border-border/70 bg-surface/70 px-6 py-4"
        >
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted">
              Scan rapide
            </p>
            <p className="mt-2 text-sm text-foreground">
              Lancez une détection multi-startups sur les 14 derniers jours.
            </p>
          </div>
          <Button size="sm" variant="secondary" type="submit">
            Lancer un scan
          </Button>
        </form>

        <section className="mt-8 rounded-2xl border border-border/70 bg-surface/70 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground font-display">
              Synergies actives
            </h2>
            <Badge variant="accent">{data.signals.length} signaux</Badge>
          </div>
          {data.signals.length > 0 ? (
            <div className="mt-6 space-y-5">
              {data.signals.map((signal) => (
                <div
                  key={signal.title}
                  className="space-y-3 border-b border-border/60 pb-5 last:border-b-0 last:pb-0"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <p className="min-w-0 break-words text-sm font-medium text-foreground">
                      {signal.title}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="neutral">
                        Impact {signal.impactScore}
                      </Badge>
                      <Badge variant="info">
                        Confiance {signal.confidenceScore}
                      </Badge>
                    </div>
                  </div>
                  <p className="break-words text-sm text-muted">
                    {signal.summary}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {signal.startups.map((startup) => (
                      <Badge key={startup} variant="secondary">
                        {startup}
                      </Badge>
                    ))}
                  </div>
                  {signal.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {signal.tags.map((tag) => (
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
            <p className="mt-6 text-sm text-muted">
              Aucune synergie détectée pour le moment.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
