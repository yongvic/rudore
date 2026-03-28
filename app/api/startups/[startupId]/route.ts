import { prisma } from "@/lib/db";

const alertTone = {
  CRITICAL: { tone: "danger", label: "Critique" },
  HIGH: { tone: "warning", label: "Surveillance" },
  MEDIUM: { tone: "info", label: "Observation" },
  LOW: { tone: "info", label: "Observation" },
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
  context: RouteContext<"/api/startups/[startupId]">
) {
  const { startupId } = await context.params;
  const startup = await prisma.startup.findFirst({
    where: { slug: startupId },
    include: {
      alerts: { orderBy: { createdAt: "desc" }, take: 6, include: { insight: true } },
      recos: { orderBy: { createdAt: "desc" }, take: 6 },
      insights: { orderBy: { createdAt: "desc" }, take: 8 },
      tasks: { orderBy: { createdAt: "desc" }, take: 6 },
    },
  });

  if (!startup) {
    return Response.json({ error: "Startup not found" }, { status: 404 });
  }

  const synergies = await prisma.crossSignal.findMany({
    where: {
      workspaceId: startup.workspaceId,
      startupSlugs: { has: startup.slug },
    },
    orderBy: { createdAt: "desc" },
    take: 4,
  });

  type StartupAlertRow = (typeof startup.alerts)[number];
  type StartupRecoRow = (typeof startup.recos)[number];
  type StartupInsightRow = (typeof startup.insights)[number];
  type StartupSignalRow = (typeof synergies)[number];
  type StartupTaskRow = (typeof startup.tasks)[number];

  return Response.json({
    name: startup.name,
    sector: startup.sector,
    stage: startup.stage,
    description: startup.description ?? "Aucune description fournie.",
    alerts: startup.alerts.map((alert: StartupAlertRow) => {
      const mapping =
        alertTone[alert.severity as keyof typeof alertTone] ?? alertTone.MEDIUM;
      return {
        title: alert.title,
        detail: alert.insight?.summary ?? "Signal prioritaire à analyser.",
        tone: mapping.tone,
        label: mapping.label,
      };
    }),
    recommendations: startup.recos.map((reco: StartupRecoRow) => ({
      title: reco.title,
      detail: reco.action,
    })),
    intelligence: startup.insights.map((insight: StartupInsightRow) => ({
      title: insight.title,
      detail: insight.summary,
      tag: insightTags[insight.type as keyof typeof insightTags] ?? "Signal",
    })),
    synergies: synergies.map((signal: StartupSignalRow) => ({
      title: signal.title,
      detail: signal.summary,
      tags: signal.tags ?? [],
    })),
    tasks: startup.tasks.map((task: StartupTaskRow) => ({
      id: task.id,
      title: task.title,
      detail: task.detail,
      status: task.status,
      priority: task.priority,
      startup: startup.name,
      source: task.source,
      createdAt: task.createdAt.toISOString(),
    })),
  });
}
