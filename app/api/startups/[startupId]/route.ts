import { prisma } from "@/lib/db";
import { formatShortDate } from "@/lib/formatters";
import { formatMetricValue } from "@/lib/metrics";
import { scoreRecommendation } from "@/lib/ranking";

const stageLabels = {
  IDEA: "Idée",
  MVP: "MVP",
  TRACTION: "Traction",
  SCALE: "Scale",
};

const insightTags = {
  MARKET: "Réglementation",
  COMPETITOR: "Concurrence",
  TREND: "Tendance",
  RISK: "Risque",
  OPPORTUNITY: "Opportunité",
};

export async function GET(
  _request: Request,
  context: { params: { startupId: string } }
) {
  const { startupId } = await context.params;
  const startup = await prisma.startup.findFirst({
    where: { slug: startupId },
    include: {
      metrics: { orderBy: { createdAt: "desc" } },
      activities: { orderBy: { occurredAt: "desc" } },
      recos: { orderBy: { createdAt: "desc" }, include: { insight: true } },
      insights: { orderBy: [{ priorityScore: "desc" }, { createdAt: "desc" }] },
    },
  });

  if (!startup) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const metricPriority = [
    "MRR",
    "ARR",
    "Churn",
    "CAC",
    "Activation",
    "ARPA",
    "NPS",
    "SLA",
    "Rétention",
    "Capacité",
    "Cash burn",
    "Pilotes",
    "Coût route",
  ];

  const metrics = startup.metrics
    .filter((metric) => metric.name !== "Runway")
    .sort((a, b) => {
      const aIndex = metricPriority.indexOf(a.name);
      const bIndex = metricPriority.indexOf(b.name);
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    })
    .slice(0, 4)
    .map((metric) => ({
      label: metric.name,
      value: formatMetricValue(metric),
      delta: metric.period,
    }));

  const timeline = startup.activities.slice(0, 4).map((event) => ({
    title: event.title,
    date: formatShortDate(event.occurredAt),
    detail: event.detail ?? "Mise à jour opérationnelle.",
  }));

  const recommendations = startup.recos
    .map((item) => ({ item, score: scoreRecommendation(item) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ item }) => ({
      title: item.title,
      detail: item.rationale,
    }));

  const intelligence = startup.insights.slice(0, 3).map((item) => ({
    title: item.title,
    detail: item.summary,
    tag: insightTags[item.type as keyof typeof insightTags] ?? "Signal",
  }));

  return Response.json({
    name: startup.name,
    sector: startup.sector,
    stage:
      stageLabels[startup.stage as keyof typeof stageLabels] ?? "Traction",
    description: startup.description ?? "Profil stratégique en consolidation.",
    metrics,
    timeline,
    recommendations,
    intelligence,
  });
}
