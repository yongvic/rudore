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

export async function GET() {
  const workspace = await prisma.workspace.findFirst({
    select: { id: true },
  });

  if (!workspace) {
    return Response.json({ sources: [] });
  }

  const sources = await prisma.dataSource.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { createdAt: "desc" },
  });

  type SourceRow = (typeof sources)[number];
  return Response.json({
    sources: sources.map((source: SourceRow) => ({
      id: source.id,
      name: source.name,
      url: source.url,
      rssUrl: source.rssUrl,
      type: source.type,
      reliability: source.reliability,
      createdAt: source.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  const guard = guardApi(request, {
    requireAuth: true,
    rateLimit: { limit: 20, windowMs: 60_000, keyPrefix: "sources-write" },
  });
  if (guard) return guard;

  const workspace = await prisma.workspace.findFirst({
    select: { id: true },
  });

  if (!workspace) {
    return Response.json({ error: "Workspace missing" }, { status: 400 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = sourceSchema.safeParse(payload);

  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const created = await prisma.dataSource.create({
    data: {
      workspaceId: workspace.id,
      name: parsed.data.name,
      url: parsed.data.url,
      rssUrl: parsed.data.rssUrl ?? null,
      type: parsed.data.type,
      reliability: parsed.data.reliability,
    },
  });

  return Response.json({
    source: {
      id: created.id,
      name: created.name,
      url: created.url,
      rssUrl: created.rssUrl,
      type: created.type,
      reliability: created.reliability,
      createdAt: created.createdAt.toISOString(),
    },
  });
}
