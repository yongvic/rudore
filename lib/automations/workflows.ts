import { prisma } from "@/lib/db";
import { runIngestion } from "@/lib/pipelines/ingest";

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

function computeHealthScore(metrics: Array<{ name: string; value: number }>) {
  let score = 70;
  const metric = (name: string) => metrics.find((m) => m.name === name)?.value;
  const runway = metric("Runway");
  const churn = metric("Churn");
  const mrr = metric("MRR");
  const arr = metric("ARR");

  if (runway !== undefined) {
    if (runway < 6) score -= 25;
    else if (runway < 9) score -= 15;
    else if (runway > 15) score += 8;
  }

  if (churn !== undefined) {
    if (churn > 8) score -= 20;
    else if (churn > 5) score -= 12;
    else if (churn < 3) score += 6;
  }

  if (mrr !== undefined) {
    if (mrr > 150000) score += 8;
    else if (mrr < 50000) score -= 8;
  }

  if (arr !== undefined) {
    if (arr > 1000000) score += 6;
  }

  return clamp(score);
}

async function createInsightBundle({
  startupId,
  type,
  title,
  summary,
  confidence,
}: {
  startupId: string | null;
  type: "MARKET" | "COMPETITOR" | "TREND" | "RISK" | "OPPORTUNITY";
  title: string;
  summary: string;
  confidence: number;
}) {
  const insight = await prisma.insight.create({
    data: {
      startupId,
      type,
      title,
      summary,
      confidence,
      impactScore: confidence,
      urgencyScore: confidence,
      priorityScore: confidence,
    },
  });

  let alert = null;
  if (type === "RISK" || type === "MARKET" || type === "COMPETITOR") {
    alert = await prisma.alert.create({
      data: {
        startupId,
        insightId: insight.id,
        title: `Alerte: ${title}`,
        severity: confidence > 0.8 ? "CRITICAL" : confidence > 0.65 ? "HIGH" : "MEDIUM",
        status: "OPEN",
      },
    });
  }

  const recommendation = startupId
    ? await prisma.recommendation.create({
        data: {
          startupId,
          insightId: insight.id,
          title: "Action recommandée",
          rationale: summary,
          action: "Analyser et planifier une réponse",
        },
      })
    : null;

  return { insight, alert, recommendation };
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
  return {
    title: "Market intelligence exécuté",
    detail: `${result.sources} sources, ${result.documents} documents, ${result.insights} insights.`,
    meta: result,
  };
}

export async function runStartupMonitoringWorkflow({
  workspaceId,
}: WorkflowContext): Promise<WorkflowResult> {
  const startups = await prisma.startup.findMany({
    where: { workspaceId },
    include: { metrics: true },
  });

  let alerts = 0;
  for (const startup of startups) {
    const score = computeHealthScore(startup.metrics);
    const type = score < 60 ? "RISK" : score > 80 ? "OPPORTUNITY" : "TREND";
    const summary = `Score santé: ${score}/100.`;

    const insight = await prisma.insight.create({
      data: {
        startupId: startup.id,
        type,
        title: `Monitoring ${startup.name}`,
        summary,
        confidence: score / 100,
        impactScore: score / 100,
        urgencyScore: type === "RISK" ? 0.8 : 0.5,
        priorityScore: score / 100,
      },
    });

    if (score < 60) {
      await prisma.alert.create({
        data: {
          startupId: startup.id,
          insightId: insight.id,
          title: `Risque KPI ${startup.name}`,
          severity: score < 45 ? "CRITICAL" : "HIGH",
          status: "OPEN",
        },
      });
      alerts += 1;
    }

    await prisma.recommendation.create({
      data: {
        startupId: startup.id,
        insightId: insight.id,
        title: score < 60 ? "Plan de redressement" : "Accélérer la croissance",
        rationale: summary,
        action:
          score < 60
            ? "Réviser plan d'action 30 jours"
            : "Investir sur les canaux performants",
      },
    });
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

  await prisma.insight.create({
    data: {
      startupId: null,
      type: "OPPORTUNITY",
      title: "Opportunity Radar",
      summary,
      confidence: insights.length > 0 ? 0.7 : 0.5,
      impactScore: insights.length > 0 ? 0.75 : 0.5,
      urgencyScore: insights.length > 0 ? 0.6 : 0.4,
      priorityScore: insights.length > 0 ? 0.7 : 0.5,
    },
  });

  if (insights[0]?.startupId) {
    await prisma.recommendation.create({
      data: {
        startupId: insights[0].startupId,
        title: "Valider une nouvelle opportunité",
        rationale: summary,
        action: "Lancer une étude de marché ciblée",
      },
    });
  }

  return {
    title: "Opportunity detection exécuté",
    detail: summary,
  };
}

export async function runContentAutomationWorkflow({
  workspaceId,
}: WorkflowContext): Promise<WorkflowResult> {
  const startup = await prisma.startup.findFirst({
    where: { workspaceId, slug: "speedmaker" },
  });

  if (!startup) {
    return { title: "Content automation", detail: "Startup SpeedMaker introuvable." };
  }

  const prompt = `Rédige un post LinkedIn premium pour ${startup.name} sur l'optimisation industrielle.`;
  const response = `Post LinkedIn: ${startup.name} accélère la transformation des micro-usines africaines avec un focus sur la stabilité cashflow et la supply chain.`;

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

  await prisma.activityEvent.create({
    data: {
      startupId: startup.id,
      title: "Contenu généré",
      detail: response,
      type: "Content",
      occurredAt: new Date(),
    },
  });

  return {
    title: "Content automation exécuté",
    detail: "1 contenu généré pour SpeedMaker.",
  };
}

export async function runAlertingWorkflow({
  workspaceId,
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
      (alert.insight?.priorityScore ?? 0) > 0.85 ? "CRITICAL" : alert.severity;
    if (severity !== alert.severity) {
      await prisma.alert.update({
        where: { id: alert.id },
        data: { severity },
      });
    }

    if (alert.startupId) {
      await prisma.activityEvent.create({
        data: {
          startupId: alert.startupId,
          title: "Notification envoyée",
          detail: `${alert.title} · ${severity}`,
          type: "Alert",
          occurredAt: new Date(),
        },
      });
    }

    notified += 1;
  }

  return {
    title: "Alerting exécuté",
    detail: `${notified} alertes notifiées.`,
  };
}

export async function runTalentMatchingWorkflow({
  workspaceId,
}: WorkflowContext): Promise<WorkflowResult> {
  const startups = await prisma.startup.findMany({
    where: { workspaceId },
  });
  const lpt = startups.find((startup) => startup.slug === "lpt");
  if (!lpt) {
    return { title: "Talent matching", detail: "Startup LPT introuvable." };
  }

  const nodes = await prisma.ecosystemNode.findMany({
    where: { workspaceId, type: "startup" },
  });
  const lptNode = nodes.find((node) => node.label === lpt.name);

  let matches = 0;
  for (const startup of startups) {
    if (startup.id === lpt.id) continue;
    const overlap = startup.tags.filter((tag) => lpt.tags.includes(tag));
    const strength = clamp(0.4 + overlap.length * 0.15, 0, 1);
    const from = lptNode ?? nodes.find((node) => node.label === lpt.name);
    const to = nodes.find((node) => node.label === startup.name);

    if (!from || !to) continue;

    await prisma.ecosystemEdge.upsert({
      where: {
        id: `${from.id}-${to.id}-talent`,
      },
      update: {
        kind: "talent-match",
        strength,
      },
      create: {
        id: `${from.id}-${to.id}-talent`,
        workspaceId,
        fromId: from.id,
        toId: to.id,
        kind: "talent-match",
        strength,
      },
    });

    matches += 1;
  }

  return {
    title: "Talent matching exécuté",
    detail: `${matches} matchs créés.`,
  };
}

export async function runAutomationExecutionWorkflow({
  workspaceId,
}: WorkflowContext): Promise<WorkflowResult> {
  const { runScheduler } = await import("@/lib/automations/run");
  const results = await runScheduler();
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
      return runOpportunityDetectionWorkflow(context);
    case "content-automation":
      return runContentAutomationWorkflow(context);
    case "alerting":
      return runAlertingWorkflow(context);
    case "talent-matching":
      return runTalentMatchingWorkflow(context);
    case "automation-execution":
      return runAutomationExecutionWorkflow(context);
    default:
      return {
        title: "Workflow custom exécuté",
        detail: "Actions simulées. Configurez un workflow métier pour une exécution complète.",
      };
  }
}
