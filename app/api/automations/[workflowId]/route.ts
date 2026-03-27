import { prisma } from "@/lib/db";
import { z } from "zod";
import { getActionLabel, getTriggerLabel } from "@/lib/automations/registry";
import {
  computeNextDailyRun,
  computeNextWeeklyRun,
} from "@/lib/automations/schedule";

const workflowSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional().nullable(),
  enabled: z.boolean(),
  workflowType: z.string().optional().nullable(),
  priority: z.number().int().min(1).max(10).optional(),
  maxRetries: z.number().int().min(0).max(5).optional(),
  retryBackoffSeconds: z.number().int().min(30).max(3600).optional(),
  triggers: z
    .array(
      z.object({
        id: z.string().optional(),
        type: z.string(),
        config: z.record(z.any()).optional().default({}),
        order: z.number().int().nonnegative(),
      })
    )
    .min(1),
  actions: z
    .array(
      z.object({
        id: z.string().optional(),
        type: z.string(),
        config: z.record(z.any()).optional().default({}),
        order: z.number().int().nonnegative(),
      })
    )
    .min(1),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ workflowId: string }> }
) {
  const { workflowId } = await context.params;
  const workflow = await prisma.automationWorkflow.findUnique({
    where: { id: workflowId },
    include: {
      triggers: { orderBy: { order: "asc" } },
      steps: { orderBy: { order: "asc" } },
    },
  });

  if (!workflow) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json({
    id: workflow.id,
    name: workflow.name,
    description: workflow.description,
    enabled: workflow.enabled,
    lastRunAt: workflow.lastRunAt,
    nextRunAt: workflow.nextRunAt,
    workflowType: workflow.workflowType,
    priority: workflow.priority,
    maxRetries: workflow.maxRetries,
    retryBackoffSeconds: workflow.retryBackoffSeconds,
    triggers: workflow.triggers.map((trigger) => ({
      id: trigger.id,
      type: trigger.type,
      config: trigger.config as Record<string, unknown>,
      order: trigger.order,
      label: getTriggerLabel(trigger.type),
    })),
    actions: workflow.steps.map((action) => ({
      id: action.id,
      type: action.type,
      config: action.config as Record<string, unknown>,
      order: action.order,
      label: getActionLabel(action.type),
    })),
  });
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ workflowId: string }> }
) {
  const { workflowId } = await context.params;
  const payload = await request.json().catch(() => null);
  const parsed = workflowSchema.safeParse(payload);

  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const {
    name,
    description,
    enabled,
    workflowType,
    priority,
    maxRetries,
    retryBackoffSeconds,
    triggers,
    actions,
  } = parsed.data;
  const scheduleTrigger = triggers.find((trigger) =>
    trigger.type.startsWith("schedule")
  );
  const nextRunAt =
    scheduleTrigger?.type === "schedule.weekly"
      ? computeNextWeeklyRun(scheduleTrigger.config as { day?: string; time?: string })
      : scheduleTrigger?.type === "schedule.daily"
        ? computeNextDailyRun(scheduleTrigger.config as { time?: string })
      : null;

  const updated = await prisma.$transaction(async (tx) => {
    const workflow = await tx.automationWorkflow.update({
      where: { id: workflowId },
      data: {
        name,
        description,
        enabled,
        trigger: { label: getTriggerLabel(triggers[0].type), type: triggers[0].type },
        actions: { label: getActionLabel(actions[0].type), type: actions[0].type },
        workflowType,
        priority,
        maxRetries,
        retryBackoffSeconds,
        nextRunAt,
      },
    });

    await tx.automationTrigger.deleteMany({ where: { workflowId } });
    await tx.automationAction.deleteMany({ where: { workflowId } });

    await tx.automationTrigger.createMany({
      data: triggers.map((trigger) => ({
        workflowId,
        type: trigger.type,
        config: trigger.config ?? {},
        order: trigger.order,
      })),
    });

    await tx.automationAction.createMany({
      data: actions.map((action) => ({
        workflowId,
        type: action.type,
        config: action.config ?? {},
        order: action.order,
      })),
    });

    return workflow;
  });

  return Response.json({ id: updated.id });
}
