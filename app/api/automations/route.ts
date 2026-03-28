import { prisma } from "@/lib/db";
import { formatRelativeTime } from "@/lib/formatters";
import {
  actionRegistry,
  getActionLabel,
  getTriggerLabel,
  triggerRegistry,
} from "@/lib/automations/registry";
import {
  computeNextDailyRun,
  computeNextWeeklyRun,
} from "@/lib/automations/schedule";

export async function GET() {
  const workflows = await prisma.automationWorkflow.findMany({
    include: {
      triggers: { orderBy: { order: "asc" } },
      steps: { orderBy: { order: "asc" } },
      runs: { orderBy: { startedAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  const history = await prisma.workflowRun.findMany({
    orderBy: { startedAt: "desc" },
    take: 8,
  });

  const workflowItems = workflows.map((workflow) => {
    const triggerType = workflow.triggers[0]?.type ?? (workflow.trigger as { type?: string })?.type ?? "—";
    const actionType = workflow.steps[0]?.type ?? (workflow.actions as { type?: string })?.type ?? "—";
    return {
      id: workflow.id,
      name: workflow.name,
      trigger: getTriggerLabel(triggerType),
      action: getActionLabel(actionType),
      status: workflow.enabled ? "Actif" : "En pause",
      lastRun: workflow.runs[0]?.startedAt
        ? formatRelativeTime(workflow.runs[0].startedAt)
        : "—",
      workflowType: workflow.workflowType ?? null,
    };
  });

  const historyItems = history.map((run) => ({
    id: run.id,
    title: (run.log as { title?: string })?.title ?? "Exécution",
    detail:
      (run.log as { detail?: string })?.detail ??
      "Exécution terminée sans incident.",
    time: formatRelativeTime(run.startedAt),
    status: run.status,
    durationMs: run.durationMs,
    error: run.error,
  }));

  return Response.json({ workflows: workflowItems, history: historyItems });
}

export async function POST() {
  const workspace = await prisma.workspace.findFirst({
    select: { id: true },
  });

  if (!workspace) {
    return Response.json({ error: "Workspace missing" }, { status: 400 });
  }

  const nextRunAt =
    triggerRegistry[0]?.type === "schedule.weekly"
      ? computeNextWeeklyRun(triggerRegistry[0].defaultConfig as { day?: string; time?: string })
      : triggerRegistry[0]?.type === "schedule.daily"
        ? computeNextDailyRun(triggerRegistry[0].defaultConfig as { time?: string })
      : null;

  const workflow = await prisma.automationWorkflow.create({
    data: {
      workspaceId: workspace.id,
      name: "Nouveau workflow",
      enabled: false,
      trigger: { label: triggerRegistry[0]?.label ?? "Déclencheur", type: triggerRegistry[0]?.type ?? "manual" },
      actions: { label: actionRegistry[0]?.label ?? "Action", type: actionRegistry[0]?.type ?? "notify" },
      description: "Workflow en cours de configuration.",
      workflowType: "custom",
      priority: 5,
      maxRetries: 1,
      retryBackoffSeconds: 120,
      nextRunAt,
    },
  });

  const defaultTrigger = triggerRegistry[0];
  const defaultAction = actionRegistry[0];

  if (defaultTrigger) {
    await prisma.automationTrigger.create({
      data: {
        workflowId: workflow.id,
        type: defaultTrigger.type,
        config: defaultTrigger.defaultConfig,
        order: 0,
      },
    });
  }

  if (defaultAction) {
    await prisma.automationAction.create({
      data: {
        workflowId: workflow.id,
        type: defaultAction.type,
        config: defaultAction.defaultConfig,
        order: 0,
      },
    });
  }

  return Response.json({ id: workflow.id });
}
