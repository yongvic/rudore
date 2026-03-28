import { prisma } from "@/lib/db";
import { runCrossIntelligenceWorkflow } from "@/lib/automations/workflows";
import { guardApi } from "@/lib/api-guard";

export async function POST(request: Request) {
  const guard = guardApi(request, {
    requireAuth: true,
    rateLimit: { limit: 6, windowMs: 60_000, keyPrefix: "cross-intel-scan" },
  });
  if (guard) return guard;

  const workspace = await prisma.workspace.findFirst({
    select: { id: true },
  });

  if (!workspace) {
    return Response.json({ error: "Workspace missing" }, { status: 400 });
  }

  const result = await runCrossIntelligenceWorkflow({
    workspaceId: workspace.id,
  });

  return Response.json({ status: "ok", result });
}
