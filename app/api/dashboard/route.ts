import { prisma } from "@/lib/db";
import {
  formatConfidence,
  formatEuro,
  formatMonths,
  formatNumber,
} from "@/lib/formatters";

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
      metrics: true,
      alerts: { where: { status: "OPEN" }, orderBy: { severity: "desc" } },
      recos: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const runwayValues = startups
    .flatMap((startup) => startup.metrics)
    .filter((metric) => metric.name === "Runway")
    .map((metric) => metric.value);

  const avgRunway =
    runwayValues.length > 0
      ? runwayValues.reduce((acc, value) => acc + value, 0) /
        runwayValues.length
      : 0;

  const arrTotal = startups.flatMap((startup) => startup.metrics).reduce(
    (acc, metric) => {
      if (metric.name === "ARR") return acc + metric.value;
      if (metric.name === "MRR") return acc + metric.value * 12;
      return acc;
    },
    0
  );

  const criticalAlerts = await prisma.alert.count({
    where: { severity: "CRITICAL", status: "OPEN" },
  });

  const kpis = [
    {
      label: "Startups actives",
      value: formatNumber(startups.length, 0),
      delta: "+1 ce trimestre",
    },
    {
      label: "Runway moyen",
      value: formatMonths(avgRunway),
      delta: "Stable",
    },
    {
      label: "ARR agrégé",
      value: formatEuro(arrTotal),
      delta: "+18%",
    },
    {
      label: "Alertes critiques",
      value: formatNumber(criticalAlerts, 0),
      delta: "2 nouvelles",
    },
  ];

  const alerts = await prisma.alert.findMany({
    where: { status: "OPEN" },
    orderBy: { createdAt: "desc" },
    take: 3,
    include: { insight: true },
  });

  const alertItems = alerts.map((alert) => {
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
    confidence: formatConfidence(insight.confidence),
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

  return Response.json({
    kpis,
    alerts: alertItems,
    insights: insightItems,
    watchlist,
    marketSignals: marketItems,
    execution,
  });
}
