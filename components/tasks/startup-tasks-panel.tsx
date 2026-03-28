"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TaskItem, TaskPriority, TaskStatus } from "@/lib/api-types";

type Props = {
  startupSlug: string;
  startupName: string;
  initialTasks: TaskItem[];
};

const statusOptions: TaskStatus[] = [
  "OPEN",
  "IN_PROGRESS",
  "BLOCKED",
  "DONE",
];

const priorityOptions: TaskPriority[] = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
];

const statusLabel: Record<TaskStatus, string> = {
  OPEN: "Ouvert",
  IN_PROGRESS: "En cours",
  BLOCKED: "Bloqué",
  DONE: "Terminé",
};

const priorityLabel: Record<TaskPriority, string> = {
  LOW: "Faible",
  MEDIUM: "Moyenne",
  HIGH: "Haute",
  CRITICAL: "Critique",
};

const priorityVariant: Record<TaskPriority, "neutral" | "warning" | "danger"> = {
  LOW: "neutral",
  MEDIUM: "warning",
  HIGH: "warning",
  CRITICAL: "danger",
};

export function StartupTasksPanel({
  startupSlug,
  startupName,
  initialTasks,
}: Props) {
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    detail: "",
    priority: "MEDIUM" as TaskPriority,
  });

  async function handleCreate() {
    setCreating(true);
    setStatus(null);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          detail: form.detail || undefined,
          startupSlug,
          priority: form.priority,
        }),
      });
      if (!res.ok) {
        throw new Error("Création de tâche impossible.");
      }
      const payload = (await res.json()) as { task: TaskItem };
      setTasks((current) => [payload.task, ...current]);
      setForm({ title: "", detail: "", priority: "MEDIUM" });
      setStatus("Tâche créée.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Erreur de création.");
    } finally {
      setCreating(false);
    }
  }

  async function handleUpdate(taskId: string, patch: Partial<TaskItem>) {
    setSavingId(taskId);
    setStatus(null);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: patch.status,
          priority: patch.priority,
          detail: patch.detail,
        }),
      });
      if (!res.ok) {
        throw new Error("Mise à jour impossible.");
      }
      setTasks((current) =>
        current.map((task) =>
          task.id === taskId ? { ...task, ...patch } : task
        )
      );
      setStatus("Tâche mise à jour.");
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Erreur de mise à jour."
      );
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/70 bg-surface/70 p-5">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted">
            Nouvelle tâche
          </p>
          <p className="mt-2 text-sm text-foreground">
            Créez une action stratégique dédiée à {startupName}.
          </p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={handleCreate}
          disabled={creating || !form.title.trim()}
        >
          {creating ? "Création..." : "Créer"}
        </Button>
      </div>
      <div className="grid gap-4 rounded-2xl border border-border/70 bg-surface/70 p-5 lg:grid-cols-2">
        <label className="text-xs uppercase tracking-[0.2em] text-muted">
          Titre
          <input
            className="mt-2 w-full rounded-xl border border-border/60 bg-surface/80 px-3 py-2 text-sm text-foreground outline-none"
            value={form.title}
            onChange={(event) =>
              setForm((current) => ({ ...current, title: event.target.value }))
            }
            placeholder="Valider un signal externe"
          />
        </label>
        <label className="text-xs uppercase tracking-[0.2em] text-muted">
          Priorité
          <select
            className="mt-2 w-full rounded-xl border border-border/60 bg-surface/80 px-3 py-2 text-sm text-foreground outline-none"
            value={form.priority}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                priority: event.target.value as TaskPriority,
              }))
            }
          >
            {priorityOptions.map((option) => (
              <option key={option} value={option}>
                {priorityLabel[option]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs uppercase tracking-[0.2em] text-muted lg:col-span-2">
          Détail
          <textarea
            className="mt-2 min-h-[110px] w-full rounded-xl border border-border/60 bg-surface/80 px-3 py-2 text-sm text-foreground outline-none"
            value={form.detail}
            onChange={(event) =>
              setForm((current) => ({ ...current, detail: event.target.value }))
            }
            placeholder="Contexte, livrable attendu, prochain checkpoint."
          />
        </label>
      </div>
      {status ? <p className="text-sm text-muted">{status}</p> : null}

      <div className="rounded-2xl border border-border/70 bg-surface/70">
        <div className="hidden grid-cols-[2fr_1fr_1fr] gap-6 border-b border-border/60 px-6 py-4 text-xs uppercase tracking-[0.2em] text-muted md:grid">
          <span>Tâche</span>
          <span>Statut</span>
          <span>Priorité</span>
        </div>
        {tasks.length > 0 ? (
          <div className="divide-y divide-border/60">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex min-w-0 flex-col gap-3 px-6 py-5 text-sm md:grid md:grid-cols-[2fr_1fr_1fr] md:gap-6"
              >
                <div>
                  <p className="min-w-0 break-words text-sm font-medium text-foreground">
                    {task.title}
                  </p>
                  {task.detail ? (
                    <p className="mt-2 break-words text-sm text-muted">
                      {task.detail}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    className="rounded-full border border-border/60 bg-surface/80 px-3 py-1 text-xs text-foreground outline-none"
                    value={task.status}
                    onChange={(event) =>
                      handleUpdate(task.id, {
                        status: event.target.value as TaskStatus,
                      })
                    }
                    disabled={savingId === task.id}
                  >
                    {statusOptions.map((option) => (
                      <option key={option} value={option}>
                        {statusLabel[option]}
                      </option>
                    ))}
                  </select>
                  <Badge variant="neutral">{statusLabel[task.status]}</Badge>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    className="rounded-full border border-border/60 bg-surface/80 px-3 py-1 text-xs text-foreground outline-none"
                    value={task.priority}
                    onChange={(event) =>
                      handleUpdate(task.id, {
                        priority: event.target.value as TaskPriority,
                      })
                    }
                    disabled={savingId === task.id}
                  >
                    {priorityOptions.map((option) => (
                      <option key={option} value={option}>
                        {priorityLabel[option]}
                      </option>
                    ))}
                  </select>
                  <Badge variant={priorityVariant[task.priority]}>
                    {priorityLabel[task.priority]}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-8 text-sm text-muted">
            Aucune tâche active pour {startupName}.
          </div>
        )}
      </div>
    </div>
  );
}
