import { prisma } from "@/lib/db";
import { runIngestion } from "@/lib/pipelines/ingest";
import { callGemini } from "@/lib/services/gemini";
import { logAction } from "@/lib/action-log";

type WorkflowContext = {
  workspaceId: string;
  startupId?: string | null;
  alertId?: string | null;
};

type WorkflowResult = {
  title: string;
  detail: string;
  meta?: Record<string, unknown>;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function priorityFromImpact(impactScore: number) {
  if (impactScore >= 85) return "CRITICAL";
  if (impactScore >= 70) return "HIGH";
  if (impactScore >= 55) return "MEDIUM";
  return "LOW";
}

const alertSeverityScore = {
  LOW: 35,
  MEDIUM: 55,
  HIGH: 75,
  CRITICAL: 95,
};

function computeSignalPressure({
  alerts,
  insights,
}: {
  alerts: Array<{ severity: keyof typeof alertSeverityScore }>;
  insights: Array<{ priorityScore?: number | null; confidenceScore?: number | null }>;
}) {
  const alertScore =
    alerts.length === 0
      ? 45
      : alerts.reduce((acc, alert) => acc + alertSeverityScore[alert.severity], 0) /
        alerts.length;
  const insightScore =
    insights.length === 0
      ? 50
      : insights.reduce(
          (acc, insight) => acc + (insight.priorityScore ?? insight.confidenceScore ?? 50),
          0
        ) / insights.length;
  const pressure = clamp(alertScore * 0.6 + insightScore * 0.4);
  return { pressure, alertScore, insightScore };
}

export async function runMarketIntelligenceWorkflow({
  workspaceId,
}: WorkflowContext): Promise<WorkflowResult> {
  const result = await runIngestion({ workspaceId });
  const prompt = "Synthétise les signaux marché du jour pour le Venture Studio.";
  const response = `Synthèse: ${result.insights} insights issus de ${result.sources} sources. Points clés à valider.`;
  await prisma.aiRun.create({
    data: {
      workspaceId,
      model: "simulated-gpt",
      prompt,
      response,
      tokensIn: prompt.split(" ").length,
      tokensOut: response.split(" ").length,
      costUsd: 0,
    },
  });
  await logAction({
    workspaceId,
    type: "workflow.market-intelligence",
    payload: result,
  });
  return {
    title: "Market intelligence exécuté",
    detail: `${result.sources} sources, ${result.documents} documents, ${result.insights} insights.`,
    meta: result,
  };
}

export async function runStartupMonitoringWorkflow({
  workspaceId,
}: WorkflowContext): Promise<WorkflowResult> {
  const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 21);
  const startups = await prisma.startup.findMany({
    where: { workspaceId },
    include: {
      alerts: { where: { status: "OPEN" }, orderBy: { createdAt: "desc" } },
      insights: { where: { createdAt: { gte: since } }, orderBy: { createdAt: "desc" } },
    },
  });

  let alerts = 0;
  for (const startup of startups) {
    if (startup.alerts.length === 0 && startup.insights.length === 0) {
      continue;
    }
    const { pressure, alertScore, insightScore } = computeSignalPressure({
      alerts: startup.alerts,
      insights: startup.insights,
    });
    const type = pressure > 75 ? "RISK" : pressure < 45 ? "OPPORTUNITY" : "TREND";
    const summary = `Pression signaux externes: ${Math.round(
      pressure
    )}/100. Alertes: ${Math.round(alertScore)} · Insights: ${Math.round(
      insightScore
    )}.`;

    const insight = await prisma.insight.create({
      data: {
        startupId: startup.id,
        type,
        title: `Monitoring externe ${startup.name}`,
        summary,
        confidenceScore: clamp(60 + (pressure - 50) * 0.4),
        impactScore: pressure,
        urgencyScore: clamp(type === "RISK" ? alertScore + 8 : alertScore - 5),
        priorityScore: pressure,
        meta: {
          source: "workflow:startup-monitoring",
          pressure,
          alertScore,
          insightScore,
        },
      },
    });
    await logAction({
      workspaceId,
      startupId: startup.id,
      type: "insight.monitoring",
      payload: {
        insightId: insight.id,
        pressure,
        alertScore,
        insightScore,
      },
    });

    if (type === "RISK" && pressure > 75) {
      await prisma.alert.create({
        data: {
          startupId: startup.id,
          insightId: insight.id,
          title: `Signal critique ${startup.name}`,
          severity: pressure > 85 ? "CRITICAL" : "HIGH",
          status: "OPEN",
        },
      });
      alerts += 1;
    }

    if (insight.impactScore > 70) {
      const recommendation = await prisma.recommendation.create({
        data: {
          startupId: startup.id,
          insightId: insight.id,
          title:
            type === "RISK" ? "Plan de mitigation externe" : "Accélérer la veille ciblée",
          rationale: summary,
          action:
            type === "RISK"
              ? "Activer une cellule de réponse externe"
              : "Renforcer les sources sectorielles",
        },
      });

      const task = await prisma.task.create({
        data: {
          workspaceId,
          startupId: startup.id,
          insightId: insight.id,
          recommendationId: recommendation.id,
          title: recommendation.title,
          detail: recommendation.action,
          status: "OPEN",
          priority: priorityFromImpact(insight.impactScore),
          source: "workflow:startup-monitoring",
          meta: { pressure },
        },
      });
      await logAction({
        workspaceId,
        startupId: startup.id,
        type: "task.created",
        payload: { taskId: task.id, title: task.title, priority: task.priority },
      });
    }
  }

  return {
    title: "Monitoring startups exécuté",
    detail: `${startups.length} startups analysées, ${alerts} alertes générées.`,
  };
}

export async function runOpportunityDetectionWorkflow({
  workspaceId,
}: WorkflowContext): Promise<WorkflowResult> {
  const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 14);
  const insights = await prisma.insight.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { priorityScore: "desc" },
    take: 10,
  });

  const headline = insights[0]?.title ?? "Opportunité émergente";
  const summary =
    insights.length > 0
      ? `Analyse globale: ${insights.length} signaux convergent vers ${headline}.`
      : "Pas assez de signaux pour détecter une opportunité claire.";
  const baseImpact = insights[0]?.impactScore ?? 68;
  const baseConfidence = insights[0]?.confidenceScore ?? 62;

  await prisma.aiRun.create({
    data: {
      workspaceId,
      model: "simulated-gpt",
      prompt: "Détecte les opportunités business sur la base des signaux récents.",
      response: summary,
      tokensIn: 12,
      tokensOut: summary.split(" ").length,
      costUsd: 0,
    },
  });

  const opportunityInsight =
    insights.length > 0
      ? await prisma.insight.create({
          data: {
            startupId: null,
            type: "OPPORTUNITY",
            title: "Opportunity Radar",
            summary,
            confidenceScore: clamp(baseConfidence),
            impactScore: clamp(baseImpact),
            urgencyScore: clamp(baseImpact - 5),
            priorityScore: clamp(baseImpact),
            meta: {
              source: "workflow:opportunity-detection",
              headline,
              signalCount: insights.length,
            },
          },
        })
      : null;

  if (insights.length > 0) {
    const blueprintTitle = `Blueprint: ${headline}`;
    let blueprintSummary = summary;
    try {
      blueprintSummary = await callGemini(
        `Résume en 3 phrases une opportunité startup basée sur: ${summary}`
      );
    } catch {
      // fallback
    }

    const blueprint = await prisma.ventureBlueprint.create({
      data: {
        workspaceId,
        title: blueprintTitle,
        problem: blueprintSummary,
        solution:
          "Plateforme d'intelligence transversale pour convertir signaux en décisions.",
        targetMarket: "Venture studios, fintechs, plateformes impact en Afrique.",
        validationSignals: [headline, "Signaux convergents sur 14 jours"],
        riskFactors: ["Dépendance aux sources externes", "Cycles réglementaires"],
        relatedInsights: insights.slice(0, 4).map((item) => item.id),
        impactScore: clamp(baseImpact),
        confidenceScore: clamp(baseConfidence),
      },
    });

    await logAction({
      workspaceId,
      type: "studio.blueprint",
      payload: {
        blueprintId: blueprint.id,
        title: blueprint.title,
        impactScore: blueprint.impactScore,
      },
    });

    await prisma.task.create({
      data: {
        workspaceId,
        title: `Valider ${blueprint.title}`,
        detail: "Qualifier le potentiel marché et définir les prochains tests.",
        status: "OPEN",
        priority: priorityFromImpact(baseImpact),
        source: "studio",
        meta: { blueprintId: blueprint.id },
      },
    });
  }

  if (insights[0]?.startupId && baseImpact > 70 && opportunityInsight) {
    const recommendation = await prisma.recommendation.create({
      data: {
        startupId: insights[0].startupId,
        insightId: opportunityInsight.id,
        title: "Valider une nouvelle opportunité",
        rationale: summary,
        action: "Lancer une étude de marché ciblée",
      },
    });

    await prisma.task.create({
      data: {
        workspaceId,
        startupId: insights[0].startupId,
        insightId: opportunityInsight.id,
        recommendationId: recommendation.id,
        title: recommendation.title,
        detail: recommendation.action,
        status: "OPEN",
        priority: priorityFromImpact(baseImpact),
        source: "studio",
      },
    });
  }

  return {
    title: "Opportunity detection exécuté",
    detail: summary,
  };
}

export async function runCrossIntelligenceWorkflow({
  workspaceId,
}: WorkflowContext): Promise<WorkflowResult> {
  const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 14);
  const insights = await prisma.insight.findMany({
    where: { createdAt: { gte: since } },
    include: { startup: true, document: true },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const grouped = new Map<
    string,
    {
      title: string;
      summary: string;
      startupSlugs: Set<string>;
      insightIds: Set<string>;
      impactScores: number[];
      confidenceScores: number[];
    }
  >();

  for (const insight of insights) {
    const tags = (insight.document?.tags as string[] | undefined) ?? [];
    const startupSlug = insight.startup?.slug;
    for (const tag of tags.slice(0, 2)) {
      if (!grouped.has(tag)) {
        grouped.set(tag, {
          title: `Synergie détectée: ${tag}`,
          summary: `Signaux transverses autour du thème "${tag}".`,
          startupSlugs: new Set<string>(),
          insightIds: new Set<string>(),
          impactScores: [],
          confidenceScores: [],
        });
      }
      const entry = grouped.get(tag);
      if (!entry) continue;
      if (startupSlug) entry.startupSlugs.add(startupSlug);
      entry.insightIds.add(insight.id);
      entry.impactScores.push(insight.impactScore ?? 60);
      entry.confidenceScores.push(insight.confidenceScore ?? 60);
    }
  }

  let created = 0;
  for (const [tag, entry] of grouped.entries()) {
    if (entry.startupSlugs.size < 2) continue;
    const impact =
      entry.impactScores.reduce((acc, value) => acc + value, 0) /
      entry.impactScores.length;
    const confidence =
      entry.confidenceScores.reduce((acc, value) => acc + value, 0) /
      entry.confidenceScores.length;

    await prisma.crossSignal.create({
      data: {
        workspaceId,
        title: entry.title,
        summary: entry.summary,
        startupSlugs: Array.from(entry.startupSlugs),
        insightIds: Array.from(entry.insightIds),
        tags: [tag],
        impactScore: clamp(impact),
        confidenceScore: clamp(confidence),
      },
    });
    created += 1;
  }

  await logAction({
    workspaceId,
    type: "cross-intelligence",
    payload: { created },
  });

  return {
    title: "Cross-intelligence exécuté",
    detail: `${created} synergies générées.`,
    meta: { created },
  };
}

export async function runAlertingWorkflow({
  alertId,
}: WorkflowContext): Promise<WorkflowResult> {
  const alerts = alertId
    ? await prisma.alert.findMany({
        where: { id: alertId },
        include: { insight: true },
      })
    : await prisma.alert.findMany({
        where: { status: "OPEN", createdAt: { gte: new Date(Date.now() - 1000 * 60 * 60 * 24) } },
        include: { insight: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      });

  let notified = 0;
  for (const alert of alerts) {
    const severity =
      (alert.insight?.priorityScore ?? 0) > 85 ? "CRITICAL" : alert.severity;
    if (severity !== alert.severity) {
      await prisma.alert.update({
        where: { id: alert.id },
        data: { severity },
      });
    }

    notified += 1;
  }

  return {
    title: "Alerting exécuté",
    detail: `${notified} alertes notifiées.`,
  };
}

export async function runAutomationExecutionWorkflow({
  workspaceId,
}: WorkflowContext): Promise<WorkflowResult> {
  const { runScheduler } = await import("@/lib/automations/run");
  const results = await runScheduler();
  await logAction({
    workspaceId,
    type: "workflow.scheduler",
    payload: { runs: results.length },
  });
  return {
    title: "Automation execution exécuté",
    detail: `${results.length} workflows exécutés.`,
    meta: { workflowIds: results.map((result) => result.runId) },
  };
}

export async function executeWorkflowByType(
  workflowType: string | null | undefined,
  context: WorkflowContext
): Promise<WorkflowResult> {
  switch (workflowType) {
    case "market-intelligence":
      return runMarketIntelligenceWorkflow(context);
    case "startup-monitoring":
      return runStartupMonitoringWorkflow(context);
    case "opportunity-detection":
    case "studio-opportunity":
      return runOpportunityDetectionWorkflow(context);
    case "alerting":
      return runAlertingWorkflow(context);
    case "cross-intelligence":
      return runCrossIntelligenceWorkflow(context);
    case "automation-execution":
      return runAutomationExecutionWorkflow(context);
    default:
      return {
        title: "Workflow custom exécuté",
        detail: "Actions simulées. Configurez un workflow métier pour une exécution complète.",
      };
  }
}
