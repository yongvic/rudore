import { prisma } from "@/lib/db";
import {
  formatConfidence,
  formatNumber,
} from "@/lib/formatters";
import { scoreAlert } from "@/lib/ranking";
import { getWorkspaceAiConfig } from "@/lib/ai-config.server";

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

const severityRank = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
};

export async function GET() {
  const startups = await prisma.startup.findMany({
    include: {
      alerts: { where: { status: "OPEN" }, orderBy: { severity: "desc" } },
      recos: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const since30 = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30);
  const since90 = new Date(Date.now() - 1000 * 60 * 60 * 24 * 90);
  const [sourcesCount, insightCount, criticalAlerts, blueprintCount] =
    await Promise.all([
      prisma.dataSource.count(),
      prisma.insight.count({ where: { createdAt: { gte: since30 } } }),
      prisma.alert.count({ where: { severity: "CRITICAL", status: "OPEN" } }),
      prisma.ventureBlueprint.count({ where: { createdAt: { gte: since90 } } }),
    ]);

  const kpis = [
    {
      label: "Sources actives",
      value: formatNumber(sourcesCount, 0),
      delta: "Flux externes",
    },
    {
      label: "Insights 30j",
      value: formatNumber(insightCount, 0),
      delta: "Derniers 30 jours",
    },
    {
      label: "Alertes critiques",
      value: formatNumber(criticalAlerts, 0),
      delta: "Open",
    },
    {
      label: "Blueprints Studio",
      value: formatNumber(blueprintCount, 0),
      delta: "Opportunités",
    },
  ];

  const alerts = await prisma.alert.findMany({
    where: { status: "OPEN" },
    orderBy: { createdAt: "desc" },
    include: { insight: true },
  });

  const aiConfig = await getWorkspaceAiConfig(startups[0]?.workspaceId ?? null);

  const alertItems = alerts
    .map((alert) => ({ alert, score: scoreAlert(alert, aiConfig.typeBoosts) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ alert }) => {
    const mapping =
      alertTone[alert.severity as keyof typeof alertTone] ??
      alertTone.MEDIUM;
    return {
      title: alert.title,
      detail: alert.insight?.summary ?? "Signal prioritaire à analyser.",
      tone: mapping.tone,
      label: mapping.label,
    };
  });

  const insights = await prisma.insight.findMany({
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  const insightItems = insights.map((insight) => ({
    title: insight.title,
    summary: insight.summary,
    confidence: formatConfidence(insight.confidenceScore),
  }));

  const watchlist = startups.slice(0, 3).map((startup) => {
    const highest = startup.alerts.reduce<
      "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | null
    >((current, alert) => {
      if (!current) return alert.severity;
      return severityRank[alert.severity] > severityRank[current]
        ? alert.severity
        : current;
    }, null);

    return {
      name: startup.name,
      note: startup.focus ?? startup.recos[0]?.title ?? "Focus à préciser",
      status:
        highest === "CRITICAL" || highest === "HIGH"
          ? "Surveillance"
          : highest === "MEDIUM"
            ? "Accélérer"
            : "Stable",
    };
  });

  const marketSignals = await prisma.insight.findMany({
    where: { type: { in: ["MARKET", "TREND", "OPPORTUNITY"] } },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  const marketItems = marketSignals.map((signal) => ({
    title: signal.title,
    summary: signal.summary,
    tag: insightTags[signal.type as keyof typeof insightTags] ?? "Signal",
  }));

  const workflowRuns = await prisma.workflowRun.findMany({
    orderBy: { startedAt: "desc" },
    take: 3,
  });

  const execution = workflowRuns.map((run) => ({
    title: (run.log as { title?: string })?.title ?? "Automatisation",
    detail:
      (run.log as { detail?: string })?.detail ??
      "Exécution automatisée confirmée.",
    status:
      run.status === "SUCCESS"
        ? "Automatisé"
        : run.status === "RUNNING"
          ? "Actif"
          : "En attente",
    tone:
      run.status === "SUCCESS"
        ? "success"
        : run.status === "RUNNING"
          ? "info"
          : "warning",
  }));

  const tasks = await prisma.task.findMany({
    where: { status: { in: ["OPEN", "IN_PROGRESS"] }, priority: { in: ["HIGH", "CRITICAL"] } },
    include: { startup: true },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    take: 4,
  });

  return Response.json({
    kpis,
    alerts: alertItems,
    insights: insightItems,
    watchlist,
    marketSignals: marketItems,
    execution,
    tasks: tasks.map((task) => ({
      id: task.id,
      title: task.title,
      detail: task.detail,
      status: task.status,
      priority: task.priority,
      startup: task.startup?.name ?? null,
      source: task.source ?? null,
      createdAt: task.createdAt.toISOString(),
    })),
  });
}
