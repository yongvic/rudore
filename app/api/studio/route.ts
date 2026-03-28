import { prisma } from "@/lib/db";

export async function GET() {
  const workspace = await prisma.workspace.findFirst({
    select: { id: true },
  });

  if (!workspace) {
    return Response.json({ blueprints: [] });
  }

  const blueprints = await prisma.ventureBlueprint.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  return Response.json({
    blueprints: blueprints.map((item) => ({
      title: item.title,
      problem: item.problem,
      solution: item.solution,
      targetMarket: item.targetMarket,
      validationSignals: item.validationSignals ?? [],
      riskFactors: item.riskFactors ?? [],
      impactScore: Math.round(item.impactScore),
      confidenceScore: Math.round(item.confidenceScore),
      createdAt: item.createdAt.toISOString(),
    })),
  });
}
