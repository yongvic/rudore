"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  TaskItem,
  TaskPriority,
  TaskStatus,
} from "@/lib/api-types";

type StartupOption = {
  slug: string;
  name: string;
};

type Props = {
  initialTasks: TaskItem[];
  startups: StartupOption[];
  initialMeta?: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
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

export function TasksManager({ initialTasks, startups, initialMeta }: Props) {
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: "ALL",
    priority: "ALL",
    startup: "ALL",
  });
  const [meta, setMeta] = useState<Props["initialMeta"]>(
    initialMeta ?? {
      page: 1,
      pageSize: 40,
      total: initialTasks.length,
      hasMore: false,
    }
  );
  const [page, setPage] = useState(initialMeta?.page ?? 1);
  const pageSize = meta?.pageSize ?? 40;
  const [form, setForm] = useState({
    title: "",
    detail: "",
    startupSlug: "",
    priority: "MEDIUM" as TaskPriority,
  });

  const startupFilters = useMemo(
    () => [
      { label: "Studio", value: "studio" },
      ...startups.map((item) => ({ label: item.name, value: item.slug })),
    ],
    [startups]
  );

  useEffect(() => {
    let active = true;
    async function load() {
      const params = new URLSearchParams();
      if (filters.status !== "ALL") params.set("status", filters.status);
      if (filters.priority !== "ALL") params.set("priority", filters.priority);
      if (filters.startup !== "ALL") params.set("startup", filters.startup);
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      const res = await fetch(`/api/tasks?${params.toString()}`);
      if (!res.ok) return;
      const payload = (await res.json()) as {
        tasks: TaskItem[];
        meta?: { page: number; pageSize: number; total: number; hasMore: boolean };
      };
      if (!active) return;
      setTasks(payload.tasks);
      if (payload.meta) {
        setMeta(payload.meta);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [filters, page, pageSize]);

  const sortedTasks = useMemo(
    () =>
      [...tasks].sort((a, b) => {
        if (a.priority === b.priority) {
          return b.createdAt.localeCompare(a.createdAt);
        }
        return priorityOptions.indexOf(b.priority) - priorityOptions.indexOf(a.priority);
      }),
    [tasks]
  );

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
          startupSlug: form.startupSlug || undefined,
          priority: form.priority,
        }),
      });
      if (!res.ok) {
        throw new Error("Création de tâche impossible.");
      }
      const payload = (await res.json()) as { task: TaskItem };
      setTasks((current) => [payload.task, ...current]);
      setMeta((current) =>
        current
          ? { ...current, total: current.total + 1 }
          : { page: 1, pageSize: 40, total: 1, hasMore: false }
      );
      setForm({ title: "", detail: "", startupSlug: "", priority: "MEDIUM" });
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
    <div className="space-y-8">
      <section className="rounded-2xl border border-border/70 bg-surface/70 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted">
              Quick create
            </p>
            <p className="mt-2 text-sm text-foreground">
              Créez une tâche stratégique issue d’un signal externe.
            </p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleCreate}
            disabled={creating || !form.title.trim()}
          >
            {creating ? "Création..." : "Créer la tâche"}
          </Button>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
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
            Startup (optionnel)
            <select
              className="mt-2 w-full rounded-xl border border-border/60 bg-surface/80 px-3 py-2 text-sm text-foreground outline-none"
              value={form.startupSlug}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  startupSlug: event.target.value,
                }))
              }
            >
              <option value="">Studio global</option>
              {startups.map((startup) => (
                <option key={startup.slug} value={startup.slug}>
                  {startup.name}
                </option>
              ))}
            </select>
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
              placeholder="Contexte, objectif, prochain livrable."
            />
          </label>
        </div>
        {status ? <p className="mt-4 text-sm text-muted">{status}</p> : null}
      </section>

      <section className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap items-center gap-2 rounded-full border border-border/60 bg-surface/70 px-4 py-2 text-xs uppercase tracking-[0.2em] text-muted">
          Filtres
        </div>
        <select
          className="h-9 rounded-full border border-border/60 bg-surface/70 px-3 text-xs text-foreground outline-none"
          value={filters.status}
          onChange={(event) => {
            setPage(1);
            setFilters((current) => ({
              ...current,
              status: event.target.value,
            }));
          }}
        >
          <option value="ALL">Tous statuts</option>
          {statusOptions.map((option) => (
            <option key={option} value={option}>
              {statusLabel[option]}
            </option>
          ))}
        </select>
        <select
          className="h-9 rounded-full border border-border/60 bg-surface/70 px-3 text-xs text-foreground outline-none"
          value={filters.priority}
          onChange={(event) => {
            setPage(1);
            setFilters((current) => ({
              ...current,
              priority: event.target.value,
            }));
          }}
        >
          <option value="ALL">Toutes priorités</option>
          {priorityOptions.map((option) => (
            <option key={option} value={option}>
              {priorityLabel[option]}
            </option>
          ))}
        </select>
        <select
          className="h-9 rounded-full border border-border/60 bg-surface/70 px-3 text-xs text-foreground outline-none"
          value={filters.startup}
          onChange={(event) => {
            setPage(1);
            setFilters((current) => ({
              ...current,
              startup: event.target.value,
            }));
          }}
        >
          <option value="ALL">Toutes startups</option>
          {startupFilters.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </section>

      <section className="rounded-2xl border border-border/70 bg-surface/70">
        <div className="hidden grid-cols-[2fr_1fr_1fr_1fr] gap-6 border-b border-border/60 px-6 py-4 text-xs uppercase tracking-[0.2em] text-muted md:grid">
          <span>Tâche</span>
          <span>Startup</span>
          <span>Statut</span>
          <span>Priorité</span>
        </div>
        {sortedTasks.length > 0 ? (
          <div className="divide-y divide-border/60">
            {sortedTasks.map((task) => (
              <div
                key={task.id}
                className="flex min-w-0 flex-col gap-3 px-6 py-5 text-sm md:grid md:grid-cols-[2fr_1fr_1fr_1fr] md:gap-6"
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
                <span className="min-w-0 break-words text-sm text-muted">
                  {task.startup ?? "Studio"}
                </span>
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
            Aucune tâche active pour le moment.
          </div>
        )}
      </section>
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
        <span>
          {meta ? `${meta.total} tâches • page ${page}` : "—"}
        </span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1}
          >
            Précédent
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setPage((current) => current + 1)}
            disabled={!meta?.hasMore}
          >
            Suivant
          </Button>
        </div>
      </div>
    </div>
  );
}
