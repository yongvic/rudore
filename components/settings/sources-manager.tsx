"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type SourceItem = {
  id: string;
  name: string;
  url: string;
  rssUrl?: string | null;
  type: string;
  reliability: number;
};

const sourceTypes = [
  { value: "Regulatory", label: "Réglementaire" },
  { value: "Media", label: "Media" },
  { value: "Trends", label: "Tendances" },
  { value: "Research", label: "Research" },
];

type Props = {
  initialSources: SourceItem[];
};

function toReliability(value: string) {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return 0.7;
  return Math.max(0, Math.min(1, parsed));
}

export function SourcesManager({ initialSources }: Props) {
  const [sources, setSources] = useState<SourceItem[]>(initialSources);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [newSource, setNewSource] = useState({
    name: "",
    url: "",
    rssUrl: "",
    type: "Regulatory",
    reliability: "0.8",
  });

  const hasSources = sources.length > 0;
  const sortedSources = useMemo(
    () => [...sources].sort((a, b) => a.name.localeCompare(b.name)),
    [sources]
  );

  async function handleCreate() {
    setStatus(null);
    setSaving("create");
    try {
      const res = await fetch("/api/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newSource.name,
          url: newSource.url,
          rssUrl: newSource.rssUrl || null,
          type: newSource.type,
          reliability: toReliability(newSource.reliability),
        }),
      });
      if (!res.ok) {
        throw new Error("Impossible de créer la source.");
      }
      const payload = (await res.json()) as { source: SourceItem };
      setSources((current) => [payload.source, ...current]);
      setNewSource({
        name: "",
        url: "",
        rssUrl: "",
        type: "Regulatory",
        reliability: "0.8",
      });
      setStatus("Source ajoutée.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Erreur de création.");
    } finally {
      setSaving(null);
    }
  }

  async function handleUpdate(sourceId: string, patch: Partial<SourceItem>) {
    setStatus(null);
    setSaving(sourceId);
    try {
      const target = sources.find((item) => item.id === sourceId);
      if (!target) return;
      const payload = {
        name: patch.name ?? target.name,
        url: patch.url ?? target.url,
        rssUrl: patch.rssUrl ?? target.rssUrl ?? null,
        type: patch.type ?? target.type,
        reliability: patch.reliability ?? target.reliability,
      };
      const res = await fetch(`/api/sources/${sourceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error("Impossible de mettre à jour la source.");
      }
      setSources((current) =>
        current.map((item) => (item.id === sourceId ? { ...item, ...payload } : item))
      );
      setStatus("Source mise à jour.");
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Erreur de mise à jour."
      );
    } finally {
      setSaving(null);
    }
  }

  async function handleDelete(sourceId: string) {
    setStatus(null);
    if (!window.confirm("Supprimer cette source ?")) return;
    setSaving(sourceId);
    try {
      const res = await fetch(`/api/sources/${sourceId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Suppression impossible.");
      }
      setSources((current) => current.filter((item) => item.id !== sourceId));
      setStatus("Source supprimée.");
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Erreur de suppression."
      );
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">Sources web</p>
          <p className="mt-1 text-xs text-muted">
            Connectez des flux RSS ou pages web pour alimenter l&apos;ingestion réelle.
          </p>
        </div>
        <Badge variant="neutral">{sources.length} actives</Badge>
      </div>

      <div className="grid gap-4 rounded-2xl border border-border/70 bg-surface/70 p-4 md:grid-cols-5">
        <label className="text-xs uppercase tracking-[0.2em] text-muted">
          Nom
          <input
            className="mt-2 w-full rounded-xl border border-border/60 bg-surface/80 px-3 py-2 text-sm text-foreground outline-none"
            value={newSource.name}
            onChange={(event) =>
              setNewSource((current) => ({ ...current, name: event.target.value }))
            }
            placeholder="Techpoint Africa"
          />
        </label>
        <label className="text-xs uppercase tracking-[0.2em] text-muted md:col-span-2">
          URL
          <input
            className="mt-2 w-full rounded-xl border border-border/60 bg-surface/80 px-3 py-2 text-sm text-foreground outline-none"
            value={newSource.url}
            onChange={(event) =>
              setNewSource((current) => ({ ...current, url: event.target.value }))
            }
            placeholder="https://techpoint.africa"
          />
        </label>
        <label className="text-xs uppercase tracking-[0.2em] text-muted">
          Type
          <select
            className="mt-2 w-full rounded-xl border border-border/60 bg-surface/80 px-3 py-2 text-sm text-foreground outline-none"
            value={newSource.type}
            onChange={(event) =>
              setNewSource((current) => ({ ...current, type: event.target.value }))
            }
          >
            {sourceTypes.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs uppercase tracking-[0.2em] text-muted">
          Fiabilité
          <input
            type="number"
            min={0}
            max={1}
            step={0.01}
            className="mt-2 w-full rounded-xl border border-border/60 bg-surface/80 px-3 py-2 text-sm text-foreground outline-none"
            value={newSource.reliability}
            onChange={(event) =>
              setNewSource((current) => ({
                ...current,
                reliability: event.target.value,
              }))
            }
          />
        </label>
        <label className="text-xs uppercase tracking-[0.2em] text-muted md:col-span-3">
          RSS (optionnel)
          <input
            className="mt-2 w-full rounded-xl border border-border/60 bg-surface/80 px-3 py-2 text-sm text-foreground outline-none"
            value={newSource.rssUrl}
            onChange={(event) =>
              setNewSource((current) => ({ ...current, rssUrl: event.target.value }))
            }
            placeholder="https://example.com/feed"
          />
        </label>
        <div className="flex items-end md:col-span-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleCreate}
            disabled={saving === "create"}
          >
            {saving === "create" ? "Création..." : "Ajouter la source"}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {hasSources ? (
          sortedSources.map((source) => (
            <div
              key={source.id}
              className="grid gap-4 rounded-2xl border border-border/70 bg-surface/70 p-4 md:grid-cols-6"
            >
              <input
                className="rounded-xl border border-border/60 bg-surface/80 px-3 py-2 text-sm text-foreground outline-none"
                value={source.name}
                onChange={(event) =>
                  setSources((current) =>
                    current.map((item) =>
                      item.id === source.id ? { ...item, name: event.target.value } : item
                    )
                  )
                }
              />
              <input
                className="md:col-span-2 rounded-xl border border-border/60 bg-surface/80 px-3 py-2 text-sm text-foreground outline-none"
                value={source.url}
                onChange={(event) =>
                  setSources((current) =>
                    current.map((item) =>
                      item.id === source.id ? { ...item, url: event.target.value } : item
                    )
                  )
                }
              />
              <select
                className="rounded-xl border border-border/60 bg-surface/80 px-3 py-2 text-sm text-foreground outline-none"
                value={source.type}
                onChange={(event) =>
                  setSources((current) =>
                    current.map((item) =>
                      item.id === source.id ? { ...item, type: event.target.value } : item
                    )
                  )
                }
              >
                {sourceTypes.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={0}
                max={1}
                step={0.01}
                className="rounded-xl border border-border/60 bg-surface/80 px-3 py-2 text-sm text-foreground outline-none"
                value={source.reliability}
                onChange={(event) =>
                  setSources((current) =>
                    current.map((item) =>
                      item.id === source.id
                        ? { ...item, reliability: toReliability(event.target.value) }
                        : item
                    )
                  )
                }
              />
              <input
                className="md:col-span-3 rounded-xl border border-border/60 bg-surface/80 px-3 py-2 text-sm text-foreground outline-none"
                value={source.rssUrl ?? ""}
                onChange={(event) =>
                  setSources((current) =>
                    current.map((item) =>
                      item.id === source.id ? { ...item, rssUrl: event.target.value } : item
                    )
                  )
                }
                placeholder="RSS (optionnel)"
              />
              <div className="flex flex-wrap gap-2 md:col-span-3">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleUpdate(source.id, source)}
                  disabled={saving === source.id}
                >
                  {saving === source.id ? "Sauvegarde..." : "Sauvegarder"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(source.id)}
                  disabled={saving === source.id}
                >
                  Supprimer
                </Button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted">
            Aucune source configurée pour le moment.
          </p>
        )}
      </div>

      {status ? <p className="text-sm text-muted">{status}</p> : null}
    </div>
  );
}
