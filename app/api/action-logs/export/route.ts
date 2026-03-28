import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { guardApi } from "@/lib/api-guard";

export async function GET(request: NextRequest) {
  const guard = guardApi(request, {
    requireAuth: true,
    rateLimit: { limit: 10, windowMs: 60_000, keyPrefix: "action-logs-export" },
  });
  if (guard) return guard;

  const workspace = await prisma.workspace.findFirst({
    select: { id: true },
  });

  if (!workspace) {
    return Response.json({ error: "Workspace missing" }, { status: 400 });
  }

  const startupSlug = request.nextUrl.searchParams.get("startup");
  const typeParam = request.nextUrl.searchParams.get("type");
  const type = typeParam?.trim() || null;
  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = Math.min(
    2000,
    Math.max(1, Number.parseInt(limitParam ?? "1000", 10) || 1000)
  );

  const normalizedStartup = startupSlug?.toLowerCase();
  const slugFilter = startupSlug ?? undefined;
  const startup =
    normalizedStartup && normalizedStartup !== "studio"
      ? await prisma.startup.findFirst({
          where: { workspaceId: workspace.id, slug: slugFilter },
        })
      : null;

  const logs = await prisma.actionLog.findMany({
    where: {
      workspaceId: workspace.id,
      startupId:
        normalizedStartup === "studio" ? null : startup?.id ?? undefined,
      type: type ?? undefined,
    },
    include: { startup: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  type ExportActionLog = (typeof logs)[number];

  const payload = {
    exportedAt: new Date().toISOString(),
    count: logs.length,
    filters: {
      startup: startupSlug ?? null,
      type,
      limit,
    },
    logs: logs.map((log: ExportActionLog) => ({
      id: log.id,
      type: log.type,
      payload: (log.payload as Record<string, unknown>) ?? {},
      startup: log.startup?.name ?? null,
      createdAt: log.createdAt.toISOString(),
    })),
  };

  const filename = `action-logs-${new Date().toISOString().slice(0, 10)}.json`;

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
