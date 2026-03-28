import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { runManualIngestion } from "@/lib/pipelines/ingest";
import { guardApi } from "@/lib/api-guard";

const manualSchema = z.object({
  title: z.string().min(3),
  summary: z.string().min(10),
  url: z.string().url().optional(),
  startupSlug: z.string().optional(),
  workspaceId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const guard = guardApi(request, {
    requireAuth: true,
    rateLimit: { limit: 12, windowMs: 60_000, keyPrefix: "ingest-manual" },
  });
  if (guard) return guard;

  const contentType = request.headers.get("content-type") ?? "";
  const payload =
    contentType.includes("application/json")
      ? await request.json().catch(() => null)
      : Object.fromEntries((await request.formData()).entries());
  const parsed = manualSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const workspace =
    (parsed.data.workspaceId &&
      (await prisma.workspace.findUnique({
        where: { id: parsed.data.workspaceId },
        select: { id: true },
      }))) ??
    (await prisma.workspace.findFirst({ select: { id: true } }));

  if (!workspace) {
    return Response.json({ error: "Workspace missing" }, { status: 400 });
  }

  const result = await runManualIngestion({
    workspaceId: workspace.id,
    startupSlug: parsed.data.startupSlug,
    title: parsed.data.title,
    summary: parsed.data.summary,
    url: parsed.data.url ?? null,
  });

  return Response.json({ status: "ok", result });
}
