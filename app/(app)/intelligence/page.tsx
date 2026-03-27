import { TopBar } from "@/components/layout/top-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiGet } from "@/lib/api";
import type { IntelligenceResponse } from "@/lib/api-types";

export default async function IntelligencePage() {
  const data = await apiGet<IntelligenceResponse>("/api/intelligence");
  const { feed, filters } = data;

  return (
    <div className="flex flex-1 flex-col">
      <TopBar
        title="Intelligence marché"
        description="Flux multi-sources consolidé, filtré et priorisé par l'IA."
        actionLabel="Ajouter une source"
      />

      <main className="flex-1 px-8 py-10">
        <section className="flex flex-wrap items-center gap-3">
          {filters.map((filter) => (
            <Button
              key={filter.label}
              variant={filter.active ? "secondary" : "ghost"}
              size="sm"
            >
              {filter.label}
            </Button>
          ))}
        </section>

        <section className="mt-8 rounded-2xl border border-border/70 bg-surface/70">
          <div className="hidden grid-cols-[2fr_1fr_1fr] gap-6 border-b border-border/60 px-6 py-4 text-xs uppercase tracking-[0.2em] text-muted md:grid">
            <span>Signal</span>
            <span>Source</span>
            <span>Score</span>
          </div>
          <div className="divide-y divide-border/60">
            {feed.map((item) => (
              <div
                key={item.title}
                className="flex min-w-0 flex-col gap-3 px-6 py-5 text-sm md:grid md:grid-cols-[2fr_1fr_1fr] md:gap-6"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <p className="min-w-0 break-words text-sm font-medium text-foreground">
                      {item.title}
                    </p>
                    <Badge variant="neutral">{item.tag}</Badge>
                  </div>
                  <p className="mt-2 break-words text-sm text-muted">
                    {item.summary}
                  </p>
                </div>
                <span className="min-w-0 break-words text-sm text-muted">
                  {item.source}
                </span>
                <span className="text-sm text-muted">{item.score}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
