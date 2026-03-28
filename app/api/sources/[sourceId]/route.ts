import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { guardApi } from "@/lib/api-guard";

const sourceSchema = z.object({
  name: z.string().min(2),
  url: z.string().url(),
  rssUrl: z.string().url().nullable().optional(),
  type: z.enum(["Regulatory", "Media", "Trends", "Research"]),
  reliability: z.number().min(0).max(1),
});

export async function PUT(
  request: NextRequest,
  context: RouteContext<"/api/sources/[sourceId]">
) {
  const guard = guardApi(request, {
    requireAuth: true,
    rateLimit: { limit: 20, windowMs: 60_000, keyPrefix: "sources-update" },
  });
  if (guard) return guard;

  const workspace = await prisma.workspace.findFirst({
    select: { id: true },
  });

  if (!workspace) {
    return Response.json({ error: "Workspace missing" }, { status: 400 });
  }

  const { sourceId } = await context.params;
  const payload = await request.json().catch(() => null);
  const parsed = sourceSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const existing = await prisma.dataSource.findUnique({
    where: { id: sourceId },
  });

  if (!existing || existing.workspaceId !== workspace.id) {
    return Response.json({ error: "Source not found" }, { status: 404 });
  }

  const updated = await prisma.dataSource.update({
    where: { id: sourceId },
    data: {
      name: parsed.data.name,
      url: parsed.data.url,
      rssUrl: parsed.data.rssUrl ?? null,
      type: parsed.data.type,
      reliability: parsed.data.reliability,
    },
  });

  return Response.json({
    source: {
      id: updated.id,
      name: updated.name,
      url: updated.url,
      rssUrl: updated.rssUrl,
      type: updated.type,
      reliability: updated.reliability,
      createdAt: updated.createdAt.toISOString(),
    },
  });
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext<"/api/sources/[sourceId]">
) {
  const guard = guardApi(_request, {
    requireAuth: true,
    rateLimit: { limit: 10, windowMs: 60_000, keyPrefix: "sources-delete" },
  });
  if (guard) return guard;

  const workspace = await prisma.workspace.findFirst({
    select: { id: true },
  });

  if (!workspace) {
    return Response.json({ error: "Workspace missing" }, { status: 400 });
  }

  const { sourceId } = await context.params;
  const existing = await prisma.dataSource.findUnique({
    where: { id: sourceId },
  });

  if (!existing || existing.workspaceId !== workspace.id) {
    return Response.json({ error: "Source not found" }, { status: 404 });
  }

  await prisma.dataSource.delete({ where: { id: sourceId } });

  return Response.json({ status: "ok" });
}
