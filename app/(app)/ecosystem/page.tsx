import { TopBar } from "@/components/layout/top-bar";
import { Badge } from "@/components/ui/badge";
import { apiGet } from "@/lib/api";
import type { EcosystemResponse } from "@/lib/api-types";

export default async function EcosystemPage() {
  const data = await apiGet<EcosystemResponse>("/api/ecosystem");
  const { nodes, relations, stats, suggestions, summary } = data;
  const normalizedNodes = nodes.map((node) => {
    const x = Number.isFinite(Number.parseFloat(node.x))
      ? Math.min(95, Math.max(5, Number.parseFloat(node.x)))
      : 50;
    const y = Number.isFinite(Number.parseFloat(node.y))
      ? Math.min(95, Math.max(5, Number.parseFloat(node.y)))
      : 50;
    return { ...node, xValue: x, yValue: y };
  });
  const nodePositions = new Map(
    normalizedNodes.map((node) => [node.id, { x: node.xValue, y: node.yValue }])
  );
  const relationLines = relations.flatMap((relation) => {
    if (!relation.fromId || !relation.toId) return [];
    const from = nodePositions.get(relation.fromId);
    const to = nodePositions.get(relation.toId);
    if (!from || !to) return [];
    const rawStrength = relation.strength ?? 0.55;
    const strength = rawStrength > 1 ? rawStrength / 100 : rawStrength;
    return [{ ...relation, from, to, strength }];
  });
  const avgStrengthLabel = Number.isFinite(stats.avgStrength)
    ? `${Math.round((stats.avgStrength > 1 ? stats.avgStrength : stats.avgStrength * 100))}%`
    : "0%";
  const strengthTone = (value: number) => {
    if (value >= 0.75) return "accent";
    if (value >= 0.6) return "info";
    if (value >= 0.45) return "warning";
    return "neutral";
  };

  return (
    <div className="flex flex-1 flex-col">
      <TopBar
        title="Graphe d'écosystème"
        description="Cartographie dynamique des relations, acteurs et synergies externes du Venture Studio."
        actionLabel="Exporter la carte"
      />

      <main className="flex-1 px-8 py-10">
        <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
          <section className="rounded-2xl border border-border/70 bg-surface/70 p-6">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-muted">
                  Résumé
                </p>
                <h2 className="mt-2 text-lg font-semibold text-foreground font-display">
                  Vue réseau
                </h2>
                <p className="mt-3 text-sm text-muted">{summary}</p>
              </div>
              <Badge variant="accent">{nodes.length} entités</Badge>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/60 bg-surface/80 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.3em] text-muted">
                  Relations
                </p>
                <p className="mt-1 text-xl font-semibold text-foreground">
                  {stats.relationCount}
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-surface/80 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.3em] text-muted">
                  Force moyenne
                </p>
                <p className="mt-1 text-xl font-semibold text-foreground">
                  {avgStrengthLabel}
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-surface/80 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.3em] text-muted">
                  Nodes
                </p>
                <p className="mt-1 text-xl font-semibold text-foreground">
                  {stats.nodeCount}
                </p>
              </div>
            </div>
            {nodes.length > 0 ? (
              <div className="relative mt-6 h-[420px] w-full overflow-hidden rounded-2xl border border-border/60 bg-grid">
                <svg
                  className="absolute inset-0 h-full w-full"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  aria-hidden
                >
                  {relationLines.map((relation) => (
                    <line
                      key={`${relation.fromId}-${relation.toId}-${relation.title}`}
                      x1={relation.from.x}
                      y1={relation.from.y}
                      x2={relation.to.x}
                      y2={relation.to.y}
                      stroke="var(--border)"
                      strokeWidth={0.4 + relation.strength * 1.2}
                      strokeOpacity={0.25 + relation.strength * 0.55}
                      strokeDasharray={relation.kind === "derived" ? "2 2" : undefined}
                    />
                  ))}
                </svg>
                {normalizedNodes.map((node) => (
                  <div
                    key={node.id}
                    className="absolute z-10 flex flex-col items-start gap-2"
                    style={{ left: `${node.xValue}%`, top: `${node.yValue}%` }}
                    title={
                      node.tags?.length
                        ? `${node.label} · ${node.tags.join(", ")}`
                        : node.label
                    }
                  >
                    <span className="h-3 w-3 rounded-full bg-accent shadow-[0_0_0_4px_rgba(252,83,42,0.15)]" />
                    <span className="max-w-[120px] break-words text-xs text-foreground">
                      {node.label}
                    </span>
                    {node.sector ? (
                      <span className="text-[10px] uppercase tracking-[0.25em] text-muted">
                        {node.sector}
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-6 text-sm text-muted">
                Aucune entité cartographiée pour le moment.
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-border/70 bg-surface/70 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground font-display">
                Relations prioritaires
              </h2>
              <Badge variant="secondary">{relations.length} liens</Badge>
            </div>
            {relations.length > 0 ? (
              <div className="mt-6 space-y-4">
                {relations.map((item) => (
                  <div key={item.title} className="border-b border-border/60 pb-4 last:border-b-0 last:pb-0">
                    <p className="min-w-0 break-words text-sm font-medium text-foreground">
                      {item.title}
                    </p>
                    <p className="mt-2 break-words text-sm text-muted">
                      {item.detail}
                    </p>
                    {(item.kind || item.strength !== undefined) && (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {item.kind ? (
                          <Badge variant="ghost">{item.kind}</Badge>
                        ) : null}
                        {item.strength !== undefined ? (
                          <Badge
                            variant={strengthTone(
                              item.strength > 1
                                ? item.strength / 100
                                : item.strength
                            )}
                          >
                            Force{" "}
                            {Math.round(
                              (item.strength > 1
                                ? item.strength / 100
                                : item.strength) * 100
                            )}
                            %
                          </Badge>
                        ) : null}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-6 text-sm text-muted">
                Aucune relation prioritaire identifiée.
              </p>
            )}
            <h3 className="mt-8 text-sm font-semibold text-foreground font-display">
              Suggestions IA
            </h3>
            {suggestions.length > 0 ? (
              <div className="mt-4 space-y-3">
                {suggestions.map((suggestion) => (
                  <div
                    key={suggestion.title}
                    className="rounded-xl border border-border/60 bg-surface/80 p-4 transition hover:border-accent/70"
                  >
                    <p className="text-xs uppercase tracking-[0.3em] text-muted">
                      {suggestion.type === "opportunity" ? "Opportunité" : "Synergie"}
                    </p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {suggestion.title}
                    </p>
                    <p className="mt-2 text-xs text-muted">{suggestion.detail}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {suggestion.tags?.map((tag) => (
                        <Badge key={tag} variant="ghost">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted">
                Ajouter des entités ou des talents pour générer des suggestions.
              </p>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

