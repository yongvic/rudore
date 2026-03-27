import { prisma } from "@/lib/db";
import { formatScore } from "@/lib/formatters";

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
    orderBy: [{ priorityScore: "desc" }, { createdAt: "desc" }],
    take: 12,
    include: {
      document: {
        include: { job: { include: { source: true } } },
      },
    },
  });

  const feed = insights.map((insight) => {
    const impact = insight.impactScore ?? insight.confidence;
    const urgency = insight.urgencyScore ?? insight.confidence;
    const priority = insight.priorityScore ?? insight.confidence;
    return {
      title: insight.title,
      summary: insight.summary,
      source: insight.document?.job?.source?.name ?? "Signal interne",
      score: `Priorité ${formatScore(priority)} • Impact ${formatScore(
        impact
      )} • Urgence ${formatScore(urgency)}`,
      tag: insightTags[insight.type as keyof typeof insightTags] ?? "Signal",
    };
  });

  const filters = [
    { label: "Toutes", active: true },
    ...startups.map((startup) => ({ label: startup.name })),
  ];

  return Response.json({ feed, filters });
}
