import { prisma } from "@/lib/db";
import { formatConfidence } from "@/lib/formatters";

const insightTags = {
  MARKET: "Réglementation",
  COMPETITOR: "Concurrence",
  TREND: "Tendance",
  RISK: "Risque",
  OPPORTUNITY: "Opportunité",
};

export async function GET() {
  const startups = await prisma.startup.findMany({
    orderBy: { createdAt: "asc" },
    select: { name: true },
  });

  const insights = await prisma.insight.findMany({
    orderBy: { createdAt: "desc" },
    take: 12,
    include: {
      document: {
        include: { job: { include: { source: true } } },
      },
    },
  });

  const feed = insights.map((insight) => ({
    title: insight.title,
    summary: insight.summary,
    source: insight.document?.job?.source?.name ?? "Signal interne",
    score: formatConfidence(insight.confidence),
    tag: insightTags[insight.type as keyof typeof insightTags] ?? "Signal",
  }));

  const filters = [
    { label: "Toutes", active: true },
    ...startups.map((startup) => ({ label: startup.name })),
  ];

  return Response.json({ feed, filters });
}
