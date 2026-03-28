import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const workspace = await prisma.workspace.findFirst({
    select: { id: true },
  });

  if (!workspace) {
    return Response.json({
      logs: [],
      meta: { page: 1, pageSize: 40, total: 0, hasMore: false },
    });
  }

  const startupSlug = request.nextUrl.searchParams.get("startup");
  const typeParam = request.nextUrl.searchParams.get("type");
  const type = typeParam?.trim() || null;
  const pageParam = request.nextUrl.searchParams.get("page");
  const pageSizeParam = request.nextUrl.searchParams.get("pageSize");
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  const pageSize = Math.min(
    100,
    Math.max(5, Number.parseInt(pageSizeParam ?? "40", 10) || 40)
  );

  const normalizedStartup = startupSlug?.toLowerCase();
  const slugFilter = startupSlug ?? undefined;
  const startup =
    normalizedStartup && normalizedStartup !== "studio"
    ? await prisma.startup.findFirst({
        where: { workspaceId: workspace.id, slug: slugFilter },
      })
      : null;

  const where = {
    workspaceId: workspace.id,
    startupId:
      normalizedStartup === "studio" ? null : startup?.id ?? undefined,
    type: type ?? undefined,
  };

  const [logs, total] = await Promise.all([
    prisma.actionLog.findMany({
      where,
      include: { startup: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.actionLog.count({ where }),
  ]);

  const hasMore = page * pageSize < total;
  type ActionLogRow = (typeof logs)[number];

  return Response.json({
    logs: logs.map((log: ActionLogRow) => ({
      id: log.id,
      type: log.type,
      payload: (log.payload as Record<string, unknown>) ?? {},
      startup: log.startup?.name ?? null,
      createdAt: log.createdAt.toISOString(),
    })),
    meta: { page, pageSize, total, hasMore },
  });
}
