import { TopBar } from "@/components/layout/top-bar";
import { Badge } from "@/components/ui/badge";
import { apiGet } from "@/lib/api";
import type { EcosystemResponse } from "@/lib/api-types";

export default async function EcosystemPage() {
  const data = await apiGet<EcosystemResponse>("/api/ecosystem");
  const { nodes, relations } = data;

  return (
    <div className="flex flex-1 flex-col">
      <TopBar
        title="Graphe d'écosystème"
        description="Cartographie dynamique des relations, talents et synergies du Venture Studio."
        actionLabel="Exporter la carte"
      />

      <main className="flex-1 px-8 py-10">
        <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
          <section className="rounded-2xl border border-border/70 bg-surface/70 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground font-display">
                Vue réseau
              </h2>
              <Badge variant="accent">{nodes.length} entités</Badge>
            </div>
            <div className="relative mt-6 h-[420px] w-full bg-grid">
              <svg
                className="absolute inset-0 h-full w-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                aria-hidden
              >
                <line x1="15" y1="30" x2="45" y2="20" stroke="var(--border)" strokeWidth="0.4" />
                <line x1="45" y1="20" x2="70" y2="35" stroke="var(--border)" strokeWidth="0.4" />
                <line x1="45" y1="20" x2="30" y2="65" stroke="var(--border)" strokeWidth="0.4" />
                <line x1="30" y1="65" x2="65" y2="70" stroke="var(--border)" strokeWidth="0.4" />
                <line x1="15" y1="30" x2="65" y2="70" stroke="var(--border)" strokeWidth="0.4" />
              </svg>
              {nodes.map((node) => (
                <div
                  key={node.id}
                  className="absolute flex flex-col items-start gap-2"
                  style={{ left: node.x, top: node.y }}
                >
                  <span className="h-3 w-3 rounded-full bg-accent" />
                  <span className="max-w-[120px] break-words text-xs text-foreground">
                    {node.label}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border/70 bg-surface/70 p-6">
            <h2 className="text-lg font-semibold text-foreground font-display">
              Relations prioritaires
            </h2>
            <div className="mt-6 space-y-4">
              {relations.map((item) => (
                <div key={item.title} className="border-b border-border/60 pb-4 last:border-b-0 last:pb-0">
                  <p className="min-w-0 break-words text-sm font-medium text-foreground">
                    {item.title}
                  </p>
                  <p className="mt-2 break-words text-sm text-muted">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

