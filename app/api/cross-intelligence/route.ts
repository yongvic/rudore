import { prisma } from "@/lib/db";

export async function GET() {
  const workspace = await prisma.workspace.findFirst({
    select: { id: true },
  });

  if (!workspace) {
    return Response.json({ signals: [], updatedAt: null });
  }

  const signals = await prisma.crossSignal.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  const startups = await prisma.startup.findMany({
    where: { workspaceId: workspace.id },
    select: { slug: true, name: true },
  });

  const nameBySlug = new Map(
    startups.map((item: { slug: string; name: string }) => [item.slug, item.name])
  );

  type SignalRow = (typeof signals)[number];
  const items = signals.map((signal: SignalRow) => ({
    title: signal.title,
    summary: signal.summary,
    startups: signal.startupSlugs.map((slug: string) => nameBySlug.get(slug) ?? slug),
    impactScore: Math.round(signal.impactScore),
    confidenceScore: Math.round(signal.confidenceScore),
    tags: signal.tags ?? [],
  }));

  return Response.json({
    signals: items,
    updatedAt: signals[0]?.createdAt?.toISOString() ?? null,
  });
}
