"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type {
  AutomationAction,
  AutomationTrigger,
  AutomationWorkflowDetail,
} from "@/lib/api-types";
import {
  actionRegistry,
  triggerRegistry,
  getActionLabel,
  getTriggerLabel,
} from "@/lib/automations/registry";

type Props = {
  workflow: AutomationWorkflowDetail;
};

type EditableTrigger = AutomationTrigger & { configText: string };
type EditableAction = AutomationAction & { configText: string };

function toConfigText(config: Record<string, unknown>) {
  return JSON.stringify(config, null, 2);
}

function parseConfig(text: string) {
  if (!text.trim()) return {};
  return JSON.parse(text);
}

export function WorkflowBuilder({ workflow }: Props) {
  const [name, setName] = useState(workflow.name);
  const [description, setDescription] = useState(workflow.description ?? "");
  const [enabled, setEnabled] = useState(workflow.enabled);
  const [workflowType, setWorkflowType] = useState(
    workflow.workflowType ?? "custom"
  );
  const [priority, setPriority] = useState(workflow.priority ?? 5);
  const [maxRetries, setMaxRetries] = useState(workflow.maxRetries ?? 1);
  const [retryBackoffSeconds, setRetryBackoffSeconds] = useState(
    workflow.retryBackoffSeconds ?? 120
  );
  const [triggers, setTriggers] = useState<EditableTrigger[]>(
    workflow.triggers.map((trigger) => ({
      ...trigger,
      configText: toConfigText(trigger.config),
    }))
  );
  const [actions, setActions] = useState<EditableAction[]>(
    workflow.actions.map((action) => ({
      ...action,
      configText: toConfigText(action.config),
    }))
  );
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);

  const workflowId = workflow.id;

  function updateTrigger(index: number, patch: Partial<EditableTrigger>) {
    setTriggers((current) =>
      current.map((item, idx) => (idx === index ? { ...item, ...patch } : item))
    );
  }

  function updateAction(index: number, patch: Partial<EditableAction>) {
    setActions((current) =>
      current.map((item, idx) => (idx === index ? { ...item, ...patch } : item))
    );
  }

  function addTrigger() {
    const template = triggerRegistry[0];
    if (!template) return;
    setTriggers((current) => [
      ...current,
      {
        id: `new-${Date.now()}`,
        type: template.type,
        config: template.defaultConfig,
        configText: toConfigText(template.defaultConfig),
        order: current.length,
      },
    ]);
  }

  function addAction() {
    const template = actionRegistry[0];
    if (!template) return;
    setActions((current) => [
      ...current,
      {
        id: `new-${Date.now()}`,
        type: template.type,
        config: template.defaultConfig,
        configText: toConfigText(template.defaultConfig),
        order: current.length,
      },
    ]);
  }

  function removeTrigger(index: number) {
    setTriggers((current) =>
      current.length <= 1 ? current : current.filter((_, idx) => idx !== index)
    );
  }

  function removeAction(index: number) {
    setActions((current) =>
      current.length <= 1 ? current : current.filter((_, idx) => idx !== index)
    );
  }

  async function handleSave() {
    setSaving(true);
    setStatus(null);
    try {
      const preparedTriggers = triggers.map((trigger, index) => ({
        id: trigger.id,
        type: trigger.type,
        config: parseConfig(trigger.configText),
        order: index,
      }));
      const preparedActions = actions.map((action, index) => ({
        id: action.id,
        type: action.type,
        config: parseConfig(action.configText),
        order: index,
      }));

      const payload = {
        name,
        description,
        enabled,
        workflowType,
        priority,
        maxRetries,
        retryBackoffSeconds,
        triggers: preparedTriggers,
        actions: preparedActions,
      };

      const res = await fetch(`/api/automations/${workflowId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Sauvegarde impossible.");
      }

      setStatus("Workflow mis à jour.");
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Erreur de sauvegarde."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleRun() {
    setRunning(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/automations/${workflowId}/run`, {
        method: "POST",
      });
      if (!res.ok) {
        throw new Error("Exécution impossible.");
      }
      const payload = await res.json();
      setStatus(payload.result?.detail ?? "Exécution terminée.");
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Erreur d'exécution."
      );
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[2.1fr_1fr]">
      <section className="rounded-2xl border border-border/70 bg-surface/70 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted">
              Workflow
            </p>
            <h2 className="mt-2 text-lg font-semibold text-foreground font-display">
              {name}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant={enabled ? "secondary" : "ghost"}
              onClick={() => setEnabled(true)}
            >
              Actif
            </Button>
            <Button
              size="sm"
              variant={!enabled ? "secondary" : "ghost"}
              onClick={() => setEnabled(false)}
            >
              En pause
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          <label className="text-sm text-muted">
            Nom du workflow
            <input
              className="mt-2 w-full rounded-xl border border-border/60 bg-surface/80 px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary/50"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label className="text-sm text-muted">
            Type de workflow
            <select
              className="mt-2 w-full rounded-xl border border-border/60 bg-surface/80 px-3 py-2 text-sm text-foreground outline-none"
              value={workflowType}
              onChange={(event) => setWorkflowType(event.target.value)}
            >
              <option value="custom">Custom</option>
              <option value="market-intelligence">Market intelligence</option>
              <option value="startup-monitoring">Startup monitoring</option>
              <option value="opportunity-detection">Opportunity detection</option>
              <option value="content-automation">Content automation</option>
              <option value="alerting">Alerting</option>
              <option value="talent-matching">Talent matching</option>
              <option value="automation-execution">Automation execution</option>
            </select>
          </label>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="text-sm text-muted">
              Priorité (1-10)
              <input
                type="number"
                min={1}
                max={10}
                className="mt-2 w-full rounded-xl border border-border/60 bg-surface/80 px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary/50"
                value={priority}
                onChange={(event) => setPriority(Number(event.target.value))}
              />
            </label>
            <label className="text-sm text-muted">
              Retries max
              <input
                type="number"
                min={0}
                max={5}
                className="mt-2 w-full rounded-xl border border-border/60 bg-surface/80 px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary/50"
                value={maxRetries}
                onChange={(event) => setMaxRetries(Number(event.target.value))}
              />
            </label>
            <label className="text-sm text-muted">
              Backoff (sec)
              <input
                type="number"
                min={30}
                max={3600}
                className="mt-2 w-full rounded-xl border border-border/60 bg-surface/80 px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary/50"
                value={retryBackoffSeconds}
                onChange={(event) =>
                  setRetryBackoffSeconds(Number(event.target.value))
                }
              />
            </label>
          </div>
          <label className="text-sm text-muted">
            Description
            <textarea
              className="mt-2 min-h-[90px] w-full rounded-xl border border-border/60 bg-surface/80 px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary/50"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>
        </div>

        <div className="mt-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Triggers</h3>
            <Button size="sm" variant="ghost" onClick={addTrigger}>
              Ajouter un trigger
            </Button>
          </div>
          {triggers.length === 0 ? (
            <p className="text-sm text-muted">Ajoutez un trigger.</p>
          ) : (
            <div className="space-y-4">
              {triggers.map((trigger, index) => (
                <div
                  key={`${trigger.type}-${index}`}
                  className="rounded-xl border border-border/60 bg-surface/80 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-muted">
                        Trigger {index + 1}
                      </p>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {getTriggerLabel(trigger.type)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeTrigger(index)}
                    >
                      Retirer
                    </Button>
                  </div>
                  <div className="mt-4 grid gap-3">
                    <label className="text-xs uppercase tracking-[0.2em] text-muted">
                      Type
                    </label>
                    <select
                      className="w-full rounded-xl border border-border/60 bg-surface/80 px-3 py-2 text-sm text-foreground outline-none"
                      value={trigger.type}
                      onChange={(event) => {
                        const selected = triggerRegistry.find(
                          (item) => item.type === event.target.value
                        );
                        if (!selected) return;
                        updateTrigger(index, {
                          type: selected.type,
                          configText: toConfigText(selected.defaultConfig),
                        });
                      }}
                    >
                      {triggerRegistry.map((item) => (
                        <option key={item.type} value={item.type}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                    <label className="text-xs uppercase tracking-[0.2em] text-muted">
                      Config (JSON)
                    </label>
                    <textarea
                      className="min-h-[140px] w-full rounded-xl border border-border/60 bg-surface/80 px-3 py-2 font-mono text-xs text-foreground outline-none transition focus:border-primary/50"
                      value={trigger.configText}
                      onChange={(event) =>
                        updateTrigger(index, { configText: event.target.value })
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Actions</h3>
            <Button size="sm" variant="ghost" onClick={addAction}>
              Ajouter une action
            </Button>
          </div>
          {actions.length === 0 ? (
            <p className="text-sm text-muted">Ajoutez une action.</p>
          ) : (
            <div className="space-y-4">
              {actions.map((action, index) => (
                <div
                  key={`${action.type}-${index}`}
                  className="rounded-xl border border-border/60 bg-surface/80 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-muted">
                        Action {index + 1}
                      </p>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {getActionLabel(action.type)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeAction(index)}
                    >
                      Retirer
                    </Button>
                  </div>
                  <div className="mt-4 grid gap-3">
                    <label className="text-xs uppercase tracking-[0.2em] text-muted">
                      Type
                    </label>
                    <select
                      className="w-full rounded-xl border border-border/60 bg-surface/80 px-3 py-2 text-sm text-foreground outline-none"
                      value={action.type}
                      onChange={(event) => {
                        const selected = actionRegistry.find(
                          (item) => item.type === event.target.value
                        );
                        if (!selected) return;
                        updateAction(index, {
                          type: selected.type,
                          configText: toConfigText(selected.defaultConfig),
                        });
                      }}
                    >
                      {actionRegistry.map((item) => (
                        <option key={item.type} value={item.type}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                    <label className="text-xs uppercase tracking-[0.2em] text-muted">
                      Config (JSON)
                    </label>
                    <textarea
                      className="min-h-[140px] w-full rounded-xl border border-border/60 bg-surface/80 px-3 py-2 font-mono text-xs text-foreground outline-none transition focus:border-primary/50"
                      value={action.configText}
                      onChange={(event) =>
                        updateAction(index, { configText: event.target.value })
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {status ? <p className="mt-6 text-sm text-muted">{status}</p> : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </Button>
          <Button variant="ghost" onClick={handleRun} disabled={running}>
            {running ? "Exécution..." : "Lancer maintenant"}
          </Button>
        </div>
      </section>

      <aside className="rounded-2xl border border-border/70 bg-surface/70 p-6">
        <h3 className="text-sm font-semibold text-foreground">Résumé</h3>
        <div className="mt-4 space-y-3 text-sm text-muted">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted">
              Triggers
            </p>
            <p className="mt-1">
              {triggers.map((trigger) => getTriggerLabel(trigger.type)).join(", ") ||
                "Aucun"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted">
              Actions
            </p>
            <p className="mt-1">
              {actions.map((action) => getActionLabel(action.type)).join(", ") ||
                "Aucune"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted">
              Dernière exécution
            </p>
            <p className="mt-1">
              {workflow.lastRunAt
                ? new Date(workflow.lastRunAt).toLocaleString("fr-FR")
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted">
              Prochaine exécution
            </p>
            <p className="mt-1">
              {workflow.nextRunAt
                ? new Date(workflow.nextRunAt).toLocaleString("fr-FR")
                : "Non planifiée"}
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
