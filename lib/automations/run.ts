import { prisma } from "@/lib/db";
import { getActionLabel, getTriggerLabel } from "@/lib/automations/registry";
import { computeNextWeeklyRun } from "@/lib/automations/schedule";

type RunResult = {
  runId: string;
  status: string;
  title: string;
  detail: string;
};

export async function runWorkflow(
  workflowId: string,
  triggeredBy: string = "manual"
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
      log: {
        title: `Exécution ${workflow.name}`,
        detail: `Déclenché par ${getTriggerLabel(
          workflow.triggers[0]?.type ?? "manual"
        )}`,
      },
    },
  });

  try {
    const steps = workflow.steps.map((step) => ({
      type: step.type,
      label: getActionLabel(step.type),
      status: "SUCCESS",
      detail: `Action ${getActionLabel(step.type)} exécutée.`,
    }));

    const finishedAt = new Date();
    const durationMs = finishedAt.getTime() - startedAt.getTime();

    await prisma.workflowRun.update({
      where: { id: run.id },
      data: {
        status: "SUCCESS",
        finishedAt,
        durationMs,
        log: {
          title: `Workflow ${workflow.name} exécuté`,
          detail: `${steps.length} actions terminées.`,
          steps,
        },
      },
    });

    const scheduleTrigger = workflow.triggers.find((trigger) =>
      trigger.type.startsWith("schedule")
    );
    const nextRunAt =
      scheduleTrigger?.type === "schedule.weekly"
        ? computeNextWeeklyRun(scheduleTrigger.config as { day?: string; time?: string })
        : workflow.nextRunAt;

    await prisma.automationWorkflow.update({
      where: { id: workflow.id },
      data: { lastRunAt: finishedAt, nextRunAt },
    });

    return {
      runId: run.id,
      status: "SUCCESS",
      title: `Workflow ${workflow.name} exécuté`,
      detail: `${steps.length} actions terminées.`,
    };
  } catch (error) {
    const finishedAt = new Date();
    const durationMs = finishedAt.getTime() - startedAt.getTime();
    const message = error instanceof Error ? error.message : "Erreur inconnue.";

    await prisma.workflowRun.update({
      where: { id: run.id },
      data: {
        status: "FAILED",
        finishedAt,
        durationMs,
        error: message,
        log: {
          title: `Workflow ${workflow.name} échoué`,
          detail: message,
        },
      },
    });

    return {
      runId: run.id,
      status: "FAILED",
      title: `Workflow ${workflow.name} échoué`,
      detail: message,
    };
  }
}
