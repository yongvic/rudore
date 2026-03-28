import { prisma } from "@/lib/db";
import { getTriggerLabel } from "@/lib/automations/registry";
import {
  computeNextDailyRun,
  computeNextWeeklyRun,
} from "@/lib/automations/schedule";
import { executeWorkflowByType } from "@/lib/automations/workflows";

type RunResult = {
  runId: string;
  status: string;
  title: string;
  detail: string;
};

export async function runWorkflow(
  workflowId: string,
  triggeredBy: string = "manual",
  context: { workspaceId?: string; startupId?: string | null; alertId?: string | null } = {}
): Promise<RunResult> {
  const workflow = await prisma.automationWorkflow.findUnique({
    where: { id: workflowId },
    include: {
      triggers: { orderBy: { order: "asc" } },
      steps: { orderBy: { order: "asc" } },
    },
  });

  if (!workflow) {
    throw new Error("Workflow introuvable.");
  }

  const startedAt = new Date();
  const run = await prisma.workflowRun.create({
    data: {
      workflowId: workflow.id,
      status: "RUNNING",
      startedAt,
      triggeredBy,
      attempt: 1,
      log: {
        title: `Exécution ${workflow.name}`,
        detail: `Déclenché par ${getTriggerLabel(
          workflow.triggers[0]?.type ?? "manual"
        )}`,
      },
    },
  });

  const maxAttempts = Math.max(1, (workflow.maxRetries ?? 1) + 1);
  let attempt = 1;
  let lastError = "";

  while (attempt <= maxAttempts) {
    try {
      const result = await executeWorkflowByType(workflow.workflowType, {
        workspaceId: context.workspaceId ?? workflow.workspaceId,
        startupId: context.startupId ?? null,
        alertId: context.alertId ?? null,
      });

      const finishedAt = new Date();
      const durationMs = finishedAt.getTime() - startedAt.getTime();

      await prisma.workflowRun.update({
        where: { id: run.id },
        data: {
          status: "SUCCESS",
          finishedAt,
          durationMs,
          attempt,
          log: {
            title: result.title,
            detail: result.detail,
            meta: result.meta ?? null,
          },
        },
      });

      const scheduleTrigger = workflow.triggers.find((trigger) =>
        trigger.type.startsWith("schedule")
      );
      const nextRunAt =
        scheduleTrigger?.type === "schedule.weekly"
          ? computeNextWeeklyRun(
              scheduleTrigger.config as { day?: string; time?: string }
            )
          : scheduleTrigger?.type === "schedule.daily"
            ? computeNextDailyRun(
                scheduleTrigger.config as { time?: string }
              )
            : workflow.nextRunAt;

      await prisma.automationWorkflow.update({
        where: { id: workflow.id },
        data: { lastRunAt: finishedAt, nextRunAt },
      });

      return {
        runId: run.id,
        status: "SUCCESS",
        title: result.title,
        detail: result.detail,
      };
    } catch (error) {
      lastError =
        error instanceof Error ? error.message : "Erreur inconnue.";
      if (attempt >= maxAttempts) break;
      attempt += 1;
      await prisma.workflowRun.update({
        where: { id: run.id },
        data: { status: "RETRYING", attempt },
      });
      const backoffMs = (workflow.retryBackoffSeconds ?? 120) * 1000;
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }

  const finishedAt = new Date();
  const durationMs = finishedAt.getTime() - startedAt.getTime();
  await prisma.workflowRun.update({
    where: { id: run.id },
    data: {
      status: "FAILED",
      finishedAt,
      durationMs,
      error: lastError,
      attempt,
      log: {
        title: `Workflow ${workflow.name} échoué`,
        detail: lastError,
      },
    },
  });

  return {
    runId: run.id,
    status: "FAILED",
    title: `Workflow ${workflow.name} échoué`,
    detail: lastError,
  };
}

export async function runScheduler() {
  const due = await prisma.automationWorkflow.findMany({
    where: {
      enabled: true,
      nextRunAt: { lte: new Date() },
      workflowType: { not: "automation-execution" },
    },
    orderBy: [{ priority: "desc" }, { nextRunAt: "asc" }],
  });

  const results = [];
  for (const workflow of due) {
    results.push(await runWorkflow(workflow.id, "schedule"));
  }

  return results;
}
