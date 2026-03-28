import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { logAction } from "@/lib/action-log";
import { guardApi } from "@/lib/api-guard";

const taskUpdateSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "BLOCKED", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  detail: z.string().optional(),
});

export async function PUT(
  request: NextRequest,
  context: RouteContext<"/api/tasks/[taskId]">
) {
  const guard = guardApi(request, {
    requireAuth: true,
    rateLimit: { limit: 60, windowMs: 60_000, keyPrefix: "tasks-update" },
  });
  if (guard) return guard;

  const workspace = await prisma.workspace.findFirst({
    select: { id: true },
  });

  if (!workspace) {
    return Response.json({ error: "Workspace missing" }, { status: 400 });
  }

  const { taskId } = await context.params;
  const payload = await request.json().catch(() => null);
  const parsed = taskUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
  });

  if (!task || task.workspaceId !== workspace.id) {
    return Response.json({ error: "Task not found" }, { status: 404 });
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: parsed.data,
  });

  await logAction({
    workspaceId: workspace.id,
    startupId: updated.startupId ?? undefined,
    type: "task.updated",
    payload: { taskId: updated.id, status: updated.status, priority: updated.priority },
  });

  return Response.json({
    task: {
      id: updated.id,
      title: updated.title,
      detail: updated.detail,
      status: updated.status,
      priority: updated.priority,
      startupId: updated.startupId,
      createdAt: updated.createdAt.toISOString(),
    },
  });
}
