import { prisma } from "@/lib/db";
import { defaultAiConfig, normalizeAiConfig, type AiScoringConfig } from "@/lib/ai-config";

export async function GET() {
  const workspace = await prisma.workspace.findFirst({
    select: { id: true },
  });

  if (!workspace) {
    return Response.json({ config: defaultAiConfig, updatedAt: null });
  }

  const config = await prisma.aiConfig.findFirst({
    where: { workspaceId: workspace.id, name: "default" },
  });

  if (!config) {
    return Response.json({ config: defaultAiConfig, updatedAt: null });
  }

  return Response.json({
    config: normalizeAiConfig(config.config as AiScoringConfig),
    updatedAt: config.updatedAt,
  });
}

export async function PUT(request: Request) {
  const workspace = await prisma.workspace.findFirst({
    select: { id: true },
  });

  if (!workspace) {
    return Response.json({ error: "Workspace missing" }, { status: 400 });
  }

  const payload = await request.json().catch(() => ({}));
  const config = normalizeAiConfig(payload as Partial<AiScoringConfig>);

  const saved = await prisma.aiConfig.upsert({
    where: { workspaceId_name: { workspaceId: workspace.id, name: "default" } },
    update: { config },
    create: { workspaceId: workspace.id, name: "default", config },
  });

  return Response.json({
    config: normalizeAiConfig(saved.config as AiScoringConfig),
    updatedAt: saved.updatedAt,
  });
}
