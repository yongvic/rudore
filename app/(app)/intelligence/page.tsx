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
        <form
          action="/api/ingest/manual"
          method="post"
          className="rounded-2xl border border-border/70 bg-surface/70 p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted">
                Import manuel
              </p>
              <p className="mt-2 text-sm text-foreground">
                Ajoutez un signal externe (texte ou URL) pour générer un insight.
              </p>
            </div>
            <Button size="sm" variant="secondary" type="submit">
              Générer un insight
            </Button>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <label className="text-xs uppercase tracking-[0.2em] text-muted">
              Titre
              <input
                name="title"
                required
                className="mt-2 w-full rounded-xl border border-border/60 bg-surface/80 px-3 py-2 text-sm text-foreground outline-none"
                placeholder="Nouveau signal marché"
              />
            </label>
            <label className="text-xs uppercase tracking-[0.2em] text-muted">
              URL (optionnel)
              <input
                name="url"
                className="mt-2 w-full rounded-xl border border-border/60 bg-surface/80 px-3 py-2 text-sm text-foreground outline-none"
                placeholder="https://source.com/article"
              />
            </label>
            <label className="text-xs uppercase tracking-[0.2em] text-muted lg:col-span-2">
              Résumé
              <textarea
                name="summary"
                required
                className="mt-2 min-h-[120px] w-full rounded-xl border border-border/60 bg-surface/80 px-3 py-2 text-sm text-foreground outline-none"
                placeholder="Résumé du signal externe et impacts potentiels."
              />
            </label>
            <label className="text-xs uppercase tracking-[0.2em] text-muted">
              Startup (slug optionnel)
              <input
                name="startupSlug"
                className="mt-2 w-full rounded-xl border border-border/60 bg-surface/80 px-3 py-2 text-sm text-foreground outline-none"
                placeholder="doasi | koodi | miame"
              />
            </label>
          </div>
        </form>

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
          {feed.length > 0 ? (
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
          ) : (
            <div className="px-6 py-8 text-sm text-muted">
              Aucun signal détecté pour le moment.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

