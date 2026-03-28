import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { logAction } from "@/lib/action-log";
import { guardApi } from "@/lib/api-guard";

const taskCreateSchema = z.object({
  title: z.string().min(3),
  detail: z.string().optional(),
  startupSlug: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
});

export async function GET(request: NextRequest) {
  const workspace = await prisma.workspace.findFirst({
    select: { id: true },
  });

  if (!workspace) {
    return Response.json({
      tasks: [],
      meta: { page: 1, pageSize: 40, total: 0, hasMore: false },
    });
  }

  const startupSlug = request.nextUrl.searchParams.get("startup");
  const statusParam = request.nextUrl.searchParams.get("status");
  const priorityParam = request.nextUrl.searchParams.get("priority");
  const pageParam = request.nextUrl.searchParams.get("page");
  const pageSizeParam = request.nextUrl.searchParams.get("pageSize");
  const status =
    statusParam === "OPEN" ||
    statusParam === "IN_PROGRESS" ||
    statusParam === "BLOCKED" ||
    statusParam === "DONE"
      ? statusParam
      : null;
  const priority =
    priorityParam === "LOW" ||
    priorityParam === "MEDIUM" ||
    priorityParam === "HIGH" ||
    priorityParam === "CRITICAL"
      ? priorityParam
      : null;
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  const pageSize = Math.min(
    100,
    Math.max(5, Number.parseInt(pageSizeParam ?? "40", 10) || 40)
  );

  const normalizedStartup = startupSlug?.toLowerCase();
  const startup =
    normalizedStartup && normalizedStartup !== "studio"
      ? await prisma.startup.findFirst({
          where: { workspaceId: workspace.id, slug: startupSlug },
        })
      : null;

  const where = {
    workspaceId: workspace.id,
    startupId:
      normalizedStartup === "studio" ? null : startup?.id ?? undefined,
    status: status ?? undefined,
    priority: priority ?? undefined,
  };

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: { startup: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.task.count({ where }),
  ]);

  const hasMore = page * pageSize < total;

  return Response.json({
    tasks: tasks.map((task) => ({
      id: task.id,
      title: task.title,
      detail: task.detail,
      status: task.status,
      priority: task.priority,
      startup: task.startup?.name ?? null,
      source: task.source ?? null,
      createdAt: task.createdAt.toISOString(),
    })),
    meta: { page, pageSize, total, hasMore },
  });
}

export async function POST(request: NextRequest) {
  const guard = guardApi(request, {
    requireAuth: true,
    rateLimit: { limit: 40, windowMs: 60_000, keyPrefix: "tasks-write" },
  });
  if (guard) return guard;

  const workspace = await prisma.workspace.findFirst({
    select: { id: true },
  });

  if (!workspace) {
    return Response.json({ error: "Workspace missing" }, { status: 400 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = taskCreateSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const startup = parsed.data.startupSlug
    ? await prisma.startup.findFirst({
        where: { workspaceId: workspace.id, slug: parsed.data.startupSlug },
      })
    : null;

  const task = await prisma.task.create({
    data: {
      workspaceId: workspace.id,
      startupId: startup?.id ?? null,
      title: parsed.data.title,
      detail: parsed.data.detail,
      status: "OPEN",
      priority: parsed.data.priority ?? "MEDIUM",
      source: "manual",
    },
  });

  await logAction({
    workspaceId: workspace.id,
    startupId: startup?.id ?? undefined,
    type: "task.manual",
    payload: { taskId: task.id, title: task.title },
  });

  return Response.json({
    task: {
      id: task.id,
      title: task.title,
      detail: task.detail,
      status: task.status,
      priority: task.priority,
      startup: startup?.name ?? null,
      source: task.source ?? null,
      createdAt: task.createdAt.toISOString(),
    },
  });
}
