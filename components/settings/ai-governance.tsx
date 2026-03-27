"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { defaultAiConfig, type AiScoringConfig } from "@/lib/ai-config";

type Props = {
  initialConfig: AiScoringConfig;
  updatedAt: string | null;
};

function listToText(list: string[]) {
  return list.join("\n");
}

function parseList(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function AiGovernance({ initialConfig, updatedAt }: Props) {
  const [impactKeywords, setImpactKeywords] = useState(
    listToText(initialConfig.impactKeywords)
  );
  const [urgencyKeywords, setUrgencyKeywords] = useState(
    listToText(initialConfig.urgencyKeywords)
  );
  const [slowdownKeywords, setSlowdownKeywords] = useState(
    listToText(initialConfig.slowdownKeywords)
  );
  const [sectorBoosts, setSectorBoosts] = useState(
    JSON.stringify(initialConfig.sectorBoosts, null, 2)
  );
  const [typeBoosts, setTypeBoosts] = useState(
    JSON.stringify(initialConfig.typeBoosts, null, 2)
  );
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const lastUpdatedLabel = useMemo(() => {
    if (!updatedAt) return "Non défini";
    return new Date(updatedAt).toLocaleString("fr-FR");
  }, [updatedAt]);

  async function handleSave() {
    setSaving(true);
    setStatus(null);
    try {
      const payload: AiScoringConfig = {
        impactKeywords: parseList(impactKeywords),
        urgencyKeywords: parseList(urgencyKeywords),
        slowdownKeywords: parseList(slowdownKeywords),
        sectorBoosts: JSON.parse(sectorBoosts || "{}"),
        typeBoosts: JSON.parse(typeBoosts || "{}"),
      };

      const res = await fetch("/api/settings/ai", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Impossible d'enregistrer la configuration IA.");
      }

      setStatus("Configuration IA mise à jour.");
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Erreur de sauvegarde."
      );
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setImpactKeywords(listToText(defaultAiConfig.impactKeywords));
    setUrgencyKeywords(listToText(defaultAiConfig.urgencyKeywords));
    setSlowdownKeywords(listToText(defaultAiConfig.slowdownKeywords));
    setSectorBoosts(JSON.stringify(defaultAiConfig.sectorBoosts, null, 2));
    setTypeBoosts(JSON.stringify(defaultAiConfig.typeBoosts, null, 2));
    setStatus("Valeurs par défaut chargées.");
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">
            Gouvernance IA
          </p>
          <p className="mt-1 text-xs text-muted">
            Ajustez les mots-clés et les pondérations pour calibrer le scoring
            d'impact et d'urgence.
          </p>
        </div>
        <Badge variant="neutral">MAJ {lastUpdatedLabel}</Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <label className="space-y-2 text-sm text-muted">
          <span className="text-xs uppercase tracking-[0.2em] text-muted">
            Impact
          </span>
          <textarea
            className="min-h-[160px] w-full rounded-xl border border-border/60 bg-surface/80 px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary/50"
            value={impactKeywords}
            onChange={(event) => setImpactKeywords(event.target.value)}
          />
        </label>
        <label className="space-y-2 text-sm text-muted">
          <span className="text-xs uppercase tracking-[0.2em] text-muted">
            Urgence
          </span>
          <textarea
            className="min-h-[160px] w-full rounded-xl border border-border/60 bg-surface/80 px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary/50"
            value={urgencyKeywords}
            onChange={(event) => setUrgencyKeywords(event.target.value)}
          />
        </label>
        <label className="space-y-2 text-sm text-muted">
          <span className="text-xs uppercase tracking-[0.2em] text-muted">
            Long terme
          </span>
          <textarea
            className="min-h-[160px] w-full rounded-xl border border-border/60 bg-surface/80 px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary/50"
            value={slowdownKeywords}
            onChange={(event) => setSlowdownKeywords(event.target.value)}
          />
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="space-y-2 text-sm text-muted">
          <span className="text-xs uppercase tracking-[0.2em] text-muted">
            Boosts sectoriels (JSON)
          </span>
          <textarea
            className="min-h-[180px] w-full rounded-xl border border-border/60 bg-surface/80 px-3 py-2 font-mono text-xs text-foreground outline-none transition focus:border-primary/50"
            value={sectorBoosts}
            onChange={(event) => setSectorBoosts(event.target.value)}
          />
        </label>
        <label className="space-y-2 text-sm text-muted">
          <span className="text-xs uppercase tracking-[0.2em] text-muted">
            Boosts par type (JSON)
          </span>
          <textarea
            className="min-h-[180px] w-full rounded-xl border border-border/60 bg-surface/80 px-3 py-2 font-mono text-xs text-foreground outline-none transition focus:border-primary/50"
            value={typeBoosts}
            onChange={(event) => setTypeBoosts(event.target.value)}
          />
        </label>
      </div>

      {status ? <p className="text-sm text-muted">{status}</p> : null}

      <div className="flex flex-wrap gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Sauvegarde..." : "Sauvegarder"}
        </Button>
        <Button variant="ghost" onClick={handleReset} disabled={saving}>
          Restaurer par défaut
        </Button>
      </div>
    </div>
  );
}
