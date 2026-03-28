"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type ScanTarget = {
  label: string;
  endpoint: string;
  successMessage: string;
  description: string;
};

const targets: ScanTarget[] = [
  {
    label: "Cross-intelligence",
    endpoint: "/api/cross-intelligence/scan",
    successMessage: "Synergies recalculées",
    description: "Détecte les liens logiques entre startups.",
  },
  {
    label: "Studio",
    endpoint: "/api/studio/scan",
    successMessage: "Opportunités détectées",
    description: "Genère des blueprints basés sur les nouveaux signaux.",
  },
];

type StatusMap = Record<string, { state: "idle" | "running" | "success" | "error"; message?: string }>;

export function ScanControls() {
  const [statusMap, setStatusMap] = useState<StatusMap>(() => {
    const map: StatusMap = {};
    targets.forEach((target) => {
      map[target.label] = { state: "idle" };
    });
    return map;
  });

  const runTarget = async (target: ScanTarget) => {
    setStatusMap((current) => ({
      ...current,
      [target.label]: { state: "running", message: "Calcul en cours..." },
    }));
    try {
      const res = await fetch(target.endpoint, { method: "POST" });
      if (!res.ok) {
        throw new Error("Erreur réseau");
      }
      setStatusMap((current) => ({
        ...current,
        [target.label]: { state: "success", message: target.successMessage },
      }));
    } catch (error) {
      setStatusMap((current) => ({
        ...current,
        [target.label]: {
          state: "error",
          message: error instanceof Error ? error.message : "La commande a échoué",
        },
      }));
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {targets.map((target) => {
        const status = statusMap[target.label];
        return (
          <div
            key={target.label}
            className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-surface/60 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{target.label}</p>
                <p className="text-xs text-muted">{target.description}</p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => runTarget(target)}
                disabled={status?.state === "running"}
              >
                {status?.state === "running" ? "Exécution..." : "Exécuter"}
              </Button>
            </div>
            {status?.message ? (
              <p
                className={`text-xs ${
                  status.state === "error"
                    ? "text-danger"
                    : status.state === "success"
                    ? "text-success"
                    : "text-muted"
                }`}
              >
                {status.message}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
