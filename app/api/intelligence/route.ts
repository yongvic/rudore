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

  type InsightRow = (typeof insights)[number];
  const feed = insights.map((insight: InsightRow) => {
    const impact = insight.impactScore ?? insight.confidenceScore;
    const urgency = insight.urgencyScore ?? insight.confidenceScore;
    const priority = insight.priorityScore ?? insight.confidenceScore;
    return {
      title: insight.title,
      summary: insight.summary,
      source: insight.document?.job?.source?.name ?? "Signal externe",
      score: `Priorité ${formatScore(priority)} • Impact ${formatScore(
        impact
      )} • Urgence ${formatScore(urgency)}`,
      tag: insightTags[insight.type as keyof typeof insightTags] ?? "Signal",
    };
  });

  type StartupFilterRow = (typeof startups)[number];
  const filters = [
    { label: "Toutes", active: true },
    ...startups.map((startup: StartupFilterRow) => ({ label: startup.name })),
  ];

  return Response.json({ feed, filters });
}
