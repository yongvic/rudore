/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function safeDelete(fn) {
  try {
    await fn();
  } catch (error) {
    console.warn("seed> delete failed:", error?.message ?? error);
  }
}

const defaultAiConfig = {
  impactKeywords: [
    "levée",
    "financement",
    "régulation",
    "interdiction",
    "taxe",
    "sanction",
    "fusion",
    "acquisition",
    "contrat",
    "subvention",
    "croissance",
    "rupture",
  ],
  urgencyKeywords: [
    "urgent",
    "immédiat",
    "bloqué",
    "crise",
    "amende",
    "incident",
    "pénurie",
    "risque",
    "attaque",
    "suspension",
    "deadline",
  ],
  slowdownKeywords: ["long terme", "progressif", "sur 12 mois", "horizon"],
  sectorBoosts: {
    "Philanthropie & Impact": [
      "don",
      "diaspora",
      "ong",
      "impact",
      "humanitaire",
      "philanthropie",
    ],
    "Media & Content": [
      "media",
      "contenu",
      "startup",
      "tendance",
      "levée",
      "innovation",
    ],
    "Sharing economy": [
      "abonnement",
      "pricing",
      "partage",
      "streaming",
      "saas",
      "usage",
    ],
    "Fintech Paiements": [
      "fintech",
      "ussd",
      "mobile money",
      "paiement",
      "kyc",
      "api",
    ],
    "Formation & Talent": [
      "formation",
      "talent",
      "compétence",
      "recrutement",
      "emploi",
      "bootcamp",
    ],
  },
  typeBoosts: {
    RISK: 0.12,
    MARKET: 0.08,
    COMPETITOR: 0.08,
  },
};

async function main() {
  const reset = process.env.SEED_RESET === "1";

  if (reset) {
    await safeDelete(() => prisma.workflowRun.deleteMany());
    await safeDelete(() => prisma.automationAction.deleteMany());
    await safeDelete(() => prisma.automationTrigger.deleteMany());
    await safeDelete(() => prisma.automationWorkflow.deleteMany());
    await safeDelete(() => prisma.alert.deleteMany());
    await safeDelete(() => prisma.recommendation.deleteMany());
    await safeDelete(() => prisma.insight.deleteMany());
    await safeDelete(() => prisma.crossSignal.deleteMany());
    await safeDelete(() => prisma.ventureBlueprint.deleteMany());
    await safeDelete(() => prisma.rawDocument.deleteMany());
    await safeDelete(() => prisma.scrapeJob.deleteMany());
    await safeDelete(() => prisma.dataSource.deleteMany());
    await safeDelete(() => prisma.aiConfig.deleteMany());
    await safeDelete(() => prisma.startupMember.deleteMany());
    await safeDelete(() => prisma.startup.deleteMany());
    await safeDelete(() => prisma.ecosystemEdge.deleteMany());
    await safeDelete(() => prisma.ecosystemNode.deleteMany());
    await safeDelete(() => prisma.workspaceUser.deleteMany());
    await safeDelete(() => prisma.aiRun.deleteMany());
    await safeDelete(() => prisma.user.deleteMany());
    await safeDelete(() => prisma.workspace.deleteMany());
  } else {
    console.log("seed> reset disabled (set SEED_RESET=1 to wipe data)");
    const existing = await prisma.workspace.findUnique({
      where: { slug: "rudore-os" },
      select: { id: true },
    });
    if (existing) {
      console.log("seed> data already present, skipping");
      return;
    }
  }

  const workspace = await prisma.workspace.create({
    data: {
      name: "Rudore OS",
      slug: "rudore-os",
      timezone: "Africa/Lome",
      region: "Afrique de l'Ouest",
    },
  });

  const [owner, lead, analyst, ops, founder] = await Promise.all([
    prisma.user.create({
      data: {
        email: "partner@rudore.africa",
        name: "Managing Partner",
      },
    }),
    prisma.user.create({
      data: { email: "lead@rudore.africa", name: "Venture Lead" },
    }),
    prisma.user.create({
      data: { email: "analyst@rudore.africa", name: "Market Analyst" },
    }),
    prisma.user.create({
      data: { email: "ops@rudore.africa", name: "Ops Manager" },
    }),
    prisma.user.create({
      data: { email: "founder@rudore.africa", name: "Founder" },
    }),
  ]);

  await prisma.workspaceUser.createMany({
    data: [
      { workspaceId: workspace.id, userId: owner.id, role: "OWNER" },
      { workspaceId: workspace.id, userId: lead.id, role: "LEAD" },
      { workspaceId: workspace.id, userId: analyst.id, role: "ANALYST" },
      { workspaceId: workspace.id, userId: ops.id, role: "ADMIN" },
      { workspaceId: workspace.id, userId: founder.id, role: "VIEWER" },
    ],
  });

  await prisma.aiConfig.create({
    data: {
      workspaceId: workspace.id,
      name: "default",
      config: defaultAiConfig,
    },
  });

  const doasi = await prisma.startup.create({
    data: {
      workspaceId: workspace.id,
      name: "DoAsi",
      slug: "doasi",
      description:
        "Plateforme philanthropique orientée diaspora, dons et suivi d'impact social.",
      stage: "TRACTION",
      sector: "Philanthropie & Impact",
      hqCountry: "Côte d'Ivoire",
      focus: "Confiance diaspora, transparence et reporting",
      tags: ["philanthropie", "impact", "diaspora", "don"],
    },
  });

  const speedmaker = await prisma.startup.create({
    data: {
      workspaceId: workspace.id,
      name: "SpeedMaker",
      slug: "speedmaker",
      description:
        "Media tech et contenu startup pour l'écosystème africain.",
      stage: "SCALE",
      sector: "Media & Content",
      hqCountry: "Nigeria",
      focus: "Analyses marché et tendances startup",
      tags: ["media", "startup", "tech", "content"],
    },
  });

  const miame = await prisma.startup.create({
    data: {
      workspaceId: workspace.id,
      name: "Miame",
      slug: "miame",
      description:
        "Plateforme de partage d'abonnements numériques et optimisation des coûts.",
      stage: "TRACTION",
      sector: "Sharing economy",
      hqCountry: "Sénégal",
      focus: "Veille pricing et risques plateformes",
      tags: ["abonnements", "pricing", "sharing", "saas"],
    },
  });

  const koodi = await prisma.startup.create({
    data: {
      workspaceId: workspace.id,
      name: "Koodi",
      slug: "koodi",
      description:
        "Infrastructure fintech USSD et mobile money pour paiements simplifiés.",
      stage: "MVP",
      sector: "Fintech Paiements",
      hqCountry: "Bénin",
      focus: "Réglementation et APIs opérateurs télécoms",
      tags: ["fintech", "ussd", "mobile-money", "paiements"],
    },
  });

  const lpt = await prisma.startup.create({
    data: {
      workspaceId: workspace.id,
      name: "LPT",
      slug: "lpt",
      description:
        "Formation, talent development et communauté tech pour l'Afrique de l'Ouest.",
      stage: "SCALE",
      sector: "Formation & Talent",
      hqCountry: "Ghana",
      focus: "Veille compétences et marché emploi",
      tags: ["formation", "talent", "community", "recrutement"],
    },
  });

  await Promise.all([
    prisma.dataSource.create({
      data: {
        workspaceId: workspace.id,
        name: "AllAfrica West Africa",
        url: "https://allafrica.com/westafrica/",
        rssUrl: "https://allafrica.com/tools/headlines/rdf/westafrica/headlines.rdf",
        type: "Regulatory",
        reliability: 0.82,
      },
    }),
    prisma.dataSource.create({
      data: {
        workspaceId: workspace.id,
        name: "Techpoint Africa",
        url: "https://techpoint.africa",
        rssUrl: "https://techpoint.africa/subject/governance-policy/feed",
        type: "Media",
        reliability: 0.76,
      },
    }),
    prisma.dataSource.create({
      data: {
        workspaceId: workspace.id,
        name: "AllAfrica Business",
        url: "https://allafrica.com/business/",
        rssUrl: "https://allafrica.com/tools/headlines/rdf/business/headlines.rdf",
        type: "Trends",
        reliability: 0.8,
      },
    }),
    prisma.dataSource.create({
      data: {
        workspaceId: workspace.id,
        name: "Rudore Research",
        url: "https://rudore.africa/research",
        type: "Research",
        reliability: 0.9,
      },
    }),
  ]);

  const workflowMarket = await prisma.automationWorkflow.create({
    data: {
      workspaceId: workspace.id,
      name: "Market intelligence",
      enabled: true,
      trigger: { label: "Tous les matins, 06:30", type: "schedule.daily" },
      actions: { label: "Scraping + insights", type: "create.insight" },
      description: "Scraping + analyse IA + génération d'insights.",
      workflowType: "market-intelligence",
      priority: 9,
      maxRetries: 2,
      retryBackoffSeconds: 120,
      lastRunAt: new Date("2026-03-27T06:40:00Z"),
    },
  });

  const workflowMonitoring = await prisma.automationWorkflow.create({
    data: {
      workspaceId: workspace.id,
      name: "Startup monitoring",
      enabled: true,
      trigger: { label: "Lundi 07:30", type: "schedule.weekly" },
      actions: { label: "Health score + alertes", type: "create.alert" },
      description: "Score santé + alertes et recommandations.",
      workflowType: "startup-monitoring",
      priority: 8,
      maxRetries: 1,
      retryBackoffSeconds: 120,
      lastRunAt: new Date("2026-03-24T07:45:00Z"),
    },
  });

  const workflowOpportunity = await prisma.automationWorkflow.create({
    data: {
      workspaceId: workspace.id,
      name: "Studio opportunity",
      enabled: true,
      trigger: { label: "Mardi 08:00", type: "schedule.weekly" },
      actions: { label: "Générer blueprint", type: "create.blueprint" },
      description: "Analyse globale et génération de venture blueprint.",
      workflowType: "studio-opportunity",
      priority: 7,
      maxRetries: 1,
      retryBackoffSeconds: 120,
    },
  });

  const workflowCross = await prisma.automationWorkflow.create({
    data: {
      workspaceId: workspace.id,
      name: "Cross-intelligence",
      enabled: true,
      trigger: { label: "Mercredi 09:00", type: "schedule.weekly" },
      actions: { label: "Scan synergies", type: "create.cross-signal" },
      description: "Détection de signaux transverses multi-startups.",
      workflowType: "cross-intelligence",
      priority: 8,
      maxRetries: 1,
      retryBackoffSeconds: 120,
    },
  });

  const workflowAlerting = await prisma.automationWorkflow.create({
    data: {
      workspaceId: workspace.id,
      name: "Alerting temps réel",
      enabled: true,
      trigger: { label: "Tous les jours 08:30", type: "schedule.daily" },
      actions: { label: "Notification + escalation", type: "escalate.alert" },
      description: "Classification et notification des alertes.",
      workflowType: "alerting",
      priority: 9,
      maxRetries: 2,
      retryBackoffSeconds: 90,
    },
  });

  const workflowExecution = await prisma.automationWorkflow.create({
    data: {
      workspaceId: workspace.id,
      name: "Automation execution",
      enabled: true,
      trigger: { label: "Tous les jours 06:00", type: "schedule.daily" },
      actions: { label: "Exécuter workflows", type: "run.workflows" },
      description: "Gestion globale des workflows.",
      workflowType: "automation-execution",
      priority: 10,
      maxRetries: 1,
      retryBackoffSeconds: 60,
    },
  });

  await prisma.automationTrigger.createMany({
    data: [
      {
        workflowId: workflowMarket.id,
        type: "schedule.daily",
        config: { time: "06:30" },
        order: 0,
      },
      {
        workflowId: workflowMonitoring.id,
        type: "schedule.weekly",
        config: { day: "Lundi", time: "07:30" },
        order: 0,
      },
      {
        workflowId: workflowOpportunity.id,
        type: "schedule.weekly",
        config: { day: "Mardi", time: "08:00" },
        order: 0,
      },
      {
        workflowId: workflowAlerting.id,
        type: "schedule.daily",
        config: { time: "08:30" },
        order: 0,
      },
      {
        workflowId: workflowExecution.id,
        type: "schedule.daily",
        config: { time: "06:00" },
        order: 0,
      },
      {
        workflowId: workflowCross.id,
        type: "schedule.weekly",
        config: { day: "Mercredi", time: "09:00" },
        order: 0,
      },
    ],
  });

  await prisma.automationAction.createMany({
    data: [
      {
        workflowId: workflowMarket.id,
        type: "create.insight",
        config: { mode: "market-intelligence" },
        order: 0,
      },
      {
        workflowId: workflowMonitoring.id,
        type: "create.alert",
        config: { mode: "health-score" },
        order: 0,
      },
      {
        workflowId: workflowOpportunity.id,
        type: "create.blueprint",
        config: { mode: "studio" },
        order: 0,
      },
      {
        workflowId: workflowAlerting.id,
        type: "escalate.alert",
        config: { to: "Managing Partner", channel: "Email" },
        order: 0,
      },
      {
        workflowId: workflowExecution.id,
        type: "run.workflows",
        config: { scope: "due" },
        order: 0,
      },
      {
        workflowId: workflowCross.id,
        type: "create.cross-signal",
        config: { mode: "weekly" },
        order: 0,
      },
    ],
  });

  const nodes = await Promise.all([
    prisma.ecosystemNode.create({
      data: {
        workspaceId: workspace.id,
        type: "startup",
        label: "DoAsi",
        meta: {
          x: "15%",
          y: "30%",
          sector: doasi.sector,
          tags: doasi.tags,
        },
      },
    }),
    prisma.ecosystemNode.create({
      data: {
        workspaceId: workspace.id,
        type: "startup",
        label: "SpeedMaker",
        meta: {
          x: "45%",
          y: "20%",
          sector: speedmaker.sector,
          tags: speedmaker.tags,
        },
      },
    }),
    prisma.ecosystemNode.create({
      data: {
        workspaceId: workspace.id,
        type: "startup",
        label: "Miame",
        meta: {
          x: "70%",
          y: "35%",
          sector: miame.sector,
          tags: miame.tags,
        },
      },
    }),
    prisma.ecosystemNode.create({
      data: {
        workspaceId: workspace.id,
        type: "startup",
        label: "Koodi",
        meta: {
          x: "30%",
          y: "65%",
          sector: koodi.sector,
          tags: koodi.tags,
        },
      },
    }),
    prisma.ecosystemNode.create({
      data: {
        workspaceId: workspace.id,
        type: "startup",
        label: "LPT",
        meta: {
          x: "65%",
          y: "70%",
          sector: lpt.sector,
          tags: lpt.tags,
        },
      },
    }),
  ]);

  await prisma.ecosystemEdge.createMany({
    data: [
      {
        workspaceId: workspace.id,
        fromId: nodes[0].id,
        toId: nodes[4].id,
        kind: "talent",
        strength: 0.74,
      },
      {
        workspaceId: workspace.id,
        fromId: nodes[1].id,
        toId: nodes[2].id,
        kind: "distribution",
        strength: 0.68,
      },
      {
        workspaceId: workspace.id,
        fromId: nodes[2].id,
        toId: nodes[3].id,
        kind: "payments",
        strength: 0.82,
      },
      {
        workspaceId: workspace.id,
        fromId: nodes[1].id,
        toId: nodes[3].id,
        kind: "regulatory",
        strength: 0.6,
      },
      {
        workspaceId: workspace.id,
        fromId: nodes[4].id,
        toId: nodes[1].id,
        kind: "content",
        strength: 0.58,
      },
    ],
  });

  await prisma.task.createMany({
    data: [
      {
        workspaceId: workspace.id,
        startupId: doasi.id,
        title: "Analyser l'évolution des dons diaspora",
        detail: "Vérifier la traction des campagnes internationales et signaux ONG.",
        status: "OPEN",
        priority: "HIGH",
        source: "seed",
      },
      {
        workspaceId: workspace.id,
        startupId: miame.id,
        title: "Surveiller les hausses de prix SaaS",
        detail: "Comparer Netflix/Canva/Notion sur 90 jours.",
        status: "IN_PROGRESS",
        priority: "MEDIUM",
        source: "seed",
      },
      {
        workspaceId: workspace.id,
        startupId: koodi.id,
        title: "Cartographier les régulations USSD",
        detail: "Synthèse des annonces telco et régulateurs fintech.",
        status: "OPEN",
        priority: "CRITICAL",
        source: "seed",
      },
      {
        workspaceId: workspace.id,
        title: "Préparer un brief opportunité Studio",
        detail: "Consolider les signaux convergents pour un blueprint.",
        status: "OPEN",
        priority: "HIGH",
        source: "seed",
      },
    ],
  });

  await prisma.actionLog.createMany({
    data: [
      {
        workspaceId: workspace.id,
        type: "seed",
        payload: { message: "Initialisation des données Rudore OS." },
      },
      {
        workspaceId: workspace.id,
        startupId: koodi.id,
        type: "task.generated",
        payload: { title: "Cartographier les régulations USSD", priority: "CRITICAL" },
      },
    ],
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
