"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { AutomationWorkflowItem } from "@/lib/api-types";

type StatusMap = Record<string, { state: "idle" | "running" | "success" | "error"; message?: string }>;

type Props = {
  workflows: AutomationWorkflowItem[];
};

export function WorkflowRunner({ workflows }: Props) {
  const [statusMap, setStatusMap] = useState<StatusMap>(() => {
    const map: StatusMap = {};
    workflows.forEach((workflow) => {
      if (workflow.id) {
        map[workflow.id] = { state: "idle" };
      }
    });
    return map;
  });

  const runWorkflow = async (id: string) => {
    setStatusMap((current) => ({
      ...current,
      [id]: { state: "running", message: "Exécution en cours..." },
    }));
    try {
      const res = await fetch(`/api/automations/${id}/run`, {
        method: "POST",
      });
      if (!res.ok) {
        throw new Error("Échec de l’exécution");
      }
      const payload = await res.json();
      setStatusMap((current) => ({
        ...current,
        [id]: { state: "success", message: payload.result?.title ?? "Workflow exécuté" },
      }));
    } catch (error) {
      setStatusMap((current) => ({
        ...current,
        [id]: {
          state: "error",
          message:
            error instanceof Error ? error.message : "Impossible de lancer le workflow",
        },
      }));
    }
  };

  return (
    <div className="space-y-4">
      {workflows
        .filter((workflow) => workflow.id)
        .map((workflow) => {
          const id = workflow.id ?? "";
          const status = statusMap[id];
          return (
            <div
              key={id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-surface/60 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{workflow.name}</p>
                <p className="text-xs text-muted">
                  Dernière exécution: {workflow.lastRun ?? "Pas encore exécuté"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {status?.message ? (
                  <span
                    className={`text-xs ${
                      status.state === "error"
                        ? "text-danger"
                        : status.state === "success"
                        ? "text-success"
                        : "text-muted"
                    }`}
                  >
                    {status.message}
                  </span>
                ) : null}
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => runWorkflow(id)}
                  disabled={status?.state === "running"}
                >
                  {status?.state === "running" ? "Exécution..." : "Lancer"}
                </Button>
              </div>
            </div>
          );
        })}
    </div>
  );
}
