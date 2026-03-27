const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function safeDelete(fn) {
  try {
    await fn();
  } catch (error) {
    console.warn("seed> delete failed:", error?.message ?? error);
  }
}

function score(impact, urgency) {
  const clamp = (value) => Math.max(0.1, Math.min(0.95, value));
  const impactScore = clamp(impact);
  const urgencyScore = clamp(urgency);
  const priorityScore = clamp(impactScore * 0.6 + urgencyScore * 0.4);
  return {
    impactScore,
    urgencyScore,
    priorityScore: Number(priorityScore.toFixed(2)),
  };
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
    "Commerce intelligent": [
      "ecommerce",
      "paiement",
      "livraison",
      "retention",
      "marketplace",
    ],
    "Manufacturing rapide": [
      "usine",
      "industrie",
      "capacité",
      "supply",
      "production",
    ],
    "Santé digitale": ["santé", "clinique", "hôpital", "télémédecine", "patient"],
    "Productivité RH": [
      "rh",
      "paie",
      "recrutement",
      "conformité",
      "talent",
    ],
    Logistique: ["logistique", "route", "tracking", "livraison", "hub"],
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
    await safeDelete(() => prisma.rawDocument.deleteMany());
    await safeDelete(() => prisma.scrapeJob.deleteMany());
    await safeDelete(() => prisma.dataSource.deleteMany());
    await safeDelete(() => prisma.aiConfig.deleteMany());
    await safeDelete(() => prisma.activityEvent.deleteMany());
    await safeDelete(() => prisma.metric.deleteMany());
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
        "Plateforme d'orchestration commerce pour PME africaines. Accélération sur la rétention et le LTV.",
      stage: "TRACTION",
      sector: "Commerce intelligent",
      hqCountry: "Côte d'Ivoire",
      focus: "Réduire CAC, renforcer rétention",
      tags: ["commerce", "b2b", "ops"],
    },
  });

  const speedmaker = await prisma.startup.create({
    data: {
      workspaceId: workspace.id,
      name: "SpeedMaker",
      slug: "speedmaker",
      description:
        "Infrastructure industrielle pour micro-usines réparties. Focus: stabilité cashflow.",
      stage: "SCALE",
      sector: "Manufacturing rapide",
      hqCountry: "Nigeria",
      focus: "Structurer la supply chain",
      tags: ["industrie", "manufacturing"],
    },
  });

  const miame = await prisma.startup.create({
    data: {
      workspaceId: workspace.id,
      name: "Miame",
      slug: "miame",
      description: "Plateforme santé pour cliniques et patients, data-driven.",
      stage: "TRACTION",
      sector: "Santé digitale",
      hqCountry: "Sénégal",
      focus: "Partenariats hôpitaux privés",
      tags: ["health", "saas"],
    },
  });

  const koodi = await prisma.startup.create({
    data: {
      workspaceId: workspace.id,
      name: "Koodi",
      slug: "koodi",
      description:
        "Suite RH pour équipes distribuées. Focus: validation marché multi-pays.",
      stage: "MVP",
      sector: "Productivité RH",
      hqCountry: "Bénin",
      focus: "Validation multi-pays",
      tags: ["hr", "productivity"],
    },
  });

  const lpt = await prisma.startup.create({
    data: {
      workspaceId: workspace.id,
      name: "LPT",
      slug: "lpt",
      description: "Plateforme de tracking logistique en temps réel.",
      stage: "SCALE",
      sector: "Logistique",
      hqCountry: "Ghana",
      focus: "Optimisation routes",
      tags: ["logistics", "tracking"],
    },
  });

  await prisma.metric.createMany({
    data: [
      { startupId: doasi.id, name: "MRR", value: 210000, unit: "EUR", period: "+12%" },
      { startupId: doasi.id, name: "Churn", value: 4.1, unit: "PERCENT", period: "-0,3" },
      { startupId: doasi.id, name: "CAC", value: 38, unit: "EUR", period: "+6%" },
      { startupId: doasi.id, name: "Activation", value: 61, unit: "PERCENT", period: "+9%" },
      { startupId: doasi.id, name: "Runway", value: 14.2, unit: "MONTH", period: "Stable" },
      { startupId: speedmaker.id, name: "ARR", value: 1100000, unit: "EUR", period: "+22%" },
      { startupId: speedmaker.id, name: "Cash burn", value: -4, unit: "PERCENT", period: "Optimisé" },
      { startupId: speedmaker.id, name: "Capacité", value: 78, unit: "PERCENT", period: "+6%" },
      { startupId: speedmaker.id, name: "NPS", value: 48, unit: "SCORE", period: "+5" },
      { startupId: speedmaker.id, name: "Runway", value: 16.4, unit: "MONTH", period: "Stable" },
      { startupId: miame.id, name: "MRR", value: 120000, unit: "EUR", period: "+9%" },
      { startupId: miame.id, name: "Adoption", value: 54, unit: "PERCENT", period: "+6%" },
      { startupId: miame.id, name: "ARPA", value: 320, unit: "EUR", period: "+4%" },
      { startupId: miame.id, name: "Churn", value: 2.7, unit: "PERCENT", period: "Stable" },
      { startupId: miame.id, name: "Runway", value: 12.5, unit: "MONTH", period: "Stable" },
      { startupId: koodi.id, name: "MRR", value: 40000, unit: "EUR", period: "+5%" },
      { startupId: koodi.id, name: "Activation", value: 38, unit: "PERCENT", period: "+4%" },
      { startupId: koodi.id, name: "Churn", value: 6.2, unit: "PERCENT", period: "-0,4" },
      { startupId: koodi.id, name: "Pilotes", value: 8, unit: "SCORE", period: "+2" },
      { startupId: koodi.id, name: "Runway", value: 10.2, unit: "MONTH", period: "Stable" },
      { startupId: lpt.id, name: "ARR", value: 920000, unit: "EUR", period: "+14%" },
      { startupId: lpt.id, name: "SLA", value: 97, unit: "PERCENT", period: "+1%" },
      { startupId: lpt.id, name: "Coût route", value: -8, unit: "PERCENT", period: "Optimisé" },
      { startupId: lpt.id, name: "Rétention", value: 88, unit: "PERCENT", period: "+3%" },
      { startupId: lpt.id, name: "Runway", value: 18, unit: "MONTH", period: "Stable" },
    ],
  });

  await prisma.activityEvent.createMany({
    data: [
      {
        startupId: doasi.id,
        title: "Campagne acquisition relancée",
        detail: "Segmentation par city clusters pour réduire le CAC.",
        type: "Acquisition",
        occurredAt: new Date("2026-03-12T09:00:00Z"),
      },
      {
        startupId: doasi.id,
        title: "Partenariat fournisseur",
        detail: "Nouveau fournisseur logistique à Abidjan.",
        type: "Partenariat",
        occurredAt: new Date("2026-03-04T10:00:00Z"),
      },
      {
        startupId: doasi.id,
        title: "Baisse de rétention",
        detail: "Churn en hausse sur cohortes Q4.",
        type: "Risque",
        occurredAt: new Date("2026-02-22T14:00:00Z"),
      },
      {
        startupId: speedmaker.id,
        title: "Nouveau site Lagos",
        detail: "Capacité +15% sur commandes urgentes.",
        type: "Expansion",
        occurredAt: new Date("2026-03-18T08:00:00Z"),
      },
      {
        startupId: speedmaker.id,
        title: "Contrat telco",
        detail: "Renouvellement sur 24 mois.",
        type: "Revenue",
        occurredAt: new Date("2026-03-02T11:00:00Z"),
      },
      {
        startupId: miame.id,
        title: "Pilote clinique",
        detail: "Déploiement dans 3 cliniques privées.",
        type: "Produit",
        occurredAt: new Date("2026-03-10T09:30:00Z"),
      },
      {
        startupId: koodi.id,
        title: "Onboarding revu",
        detail: "Simplification des étapes RH.",
        type: "Produit",
        occurredAt: new Date("2026-03-15T09:00:00Z"),
      },
      {
        startupId: lpt.id,
        title: "Nouveau hub",
        detail: "Hub régional Dakar opérationnel.",
        type: "Ops",
        occurredAt: new Date("2026-03-08T07:30:00Z"),
      },
    ],
  });

  await prisma.recommendation.createMany({
    data: [
      {
        startupId: doasi.id,
        title: "Reprendre 3 cohortes inactives",
        rationale: "Campagne email + incentives locaux.",
        action: "Relance cohortes inactives",
      },
      {
        startupId: doasi.id,
        title: "Diversifier le mix acquisition",
        rationale: "Augmenter SEO long tail + partenariats marketplaces.",
        action: "Diversifier acquisition",
      },
      {
        startupId: speedmaker.id,
        title: "Renforcer prévisions",
        rationale: "IA demande pour optimiser stocks.",
        action: "Modèle de prévisions",
      },
      {
        startupId: miame.id,
        title: "Pack assurance",
        rationale: "Positionner un module pour assureurs locaux.",
        action: "Prototyper pack assurance",
      },
      {
        startupId: koodi.id,
        title: "Expérimenter pricing",
        rationale: "Tester forfaits par équipe.",
        action: "A/B test pricing",
      },
      {
        startupId: lpt.id,
        title: "Optimiser IA routes",
        rationale: "Modèle prédictif sur trafic urbain.",
        action: "Prototype IA routing",
      },
    ],
  });

  const sources = await Promise.all([
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
        name: "Enquête interne",
        url: "https://rudore.africa/insights",
        type: "Internal",
        reliability: 0.9,
      },
    }),
  ]);

  const jobs = await Promise.all(
    sources.map((source, index) =>
      prisma.scrapeJob.create({
        data: {
          sourceId: source.id,
          status: "SUCCESS",
          scheduledAt: new Date(`2026-03-2${index + 2}T06:00:00Z`),
          startedAt: new Date(`2026-03-2${index + 2}T06:05:00Z`),
          finishedAt: new Date(`2026-03-2${index + 2}T06:08:00Z`),
        },
      })
    )
  );

  const documents = await Promise.all([
    prisma.rawDocument.create({
      data: {
        jobId: jobs[0].id,
        url: "https://allafrica.com/stories/202603250123.html",
        title: "Régulation fintech en Afrique de l'Ouest",
        content:
          "Des autorités régionales préparent un renforcement des exigences de conformité pour les fintechs.",
        lang: "fr",
        tags: ["réglementation", "financement"],
        entities: { countries: ["Côte d'Ivoire", "Ghana"] },
        hash: "allafrica-westafrica-fintech-2026",
      },
    }),
    prisma.rawDocument.create({
      data: {
        jobId: jobs[1].id,
        url: "https://techpoint.africa/2026/03/21/ghana-domain-act/",
        title: "Ghana veut généraliser les domaines .gh",
        content:
          "Un projet de loi pourrait imposer l'usage des domaines nationaux pour les entreprises.",
        lang: "fr",
        tags: ["réglementation"],
        entities: { countries: ["Ghana"] },
        hash: "techpoint-ghana-domain-act-2026",
      },
    }),
    prisma.rawDocument.create({
      data: {
        jobId: jobs[2].id,
        url: "https://allafrica.com/stories/202603220456.html",
        title: "Accélération de la demande B2B en Afrique",
        content:
          "Les investissements dans les outils de productivité et les services B2B progressent sur le trimestre.",
        lang: "fr",
        tags: ["financement", "croissance"],
        entities: { countries: ["Nigeria", "Sénégal"] },
        hash: "allafrica-business-b2b-2026",
      },
    }),
    prisma.rawDocument.create({
      data: {
        jobId: jobs[3].id,
        url: "https://rudore.africa/research/logistics",
        title: "Logistique urbaine",
        content: "Les opérateurs demandent plus de tracking en temps réel.",
        lang: "fr",
        tags: ["logistique", "industrie"],
        entities: { countries: ["Bénin"] },
        hash: "rudore-logistics-2026",
      },
    }),
  ]);

  const insights = await Promise.all([
    prisma.insight.create({
      data: {
        startupId: doasi.id,
        documentId: documents[0].id,
        type: "MARKET",
        title: "Régulation fintech Côte d'Ivoire",
        summary:
          "La BCEAO prépare de nouvelles exigences KYC pour 2026. Impact potentiel sur DoAsi.",
        confidence: 0.81,
        ...score(0.78, 0.72),
      },
    }),
    prisma.insight.create({
      data: {
        startupId: speedmaker.id,
        documentId: documents[1].id,
        type: "COMPETITOR",
        title: "Levée de fonds concurrent SpeedMaker",
        summary:
          "Un acteur nigérian annonce 12M$ pour industrialiser des micro-usines.",
        confidence: 0.77,
        ...score(0.74, 0.7),
      },
    }),
    prisma.insight.create({
      data: {
        startupId: miame.id,
        documentId: documents[2].id,
        type: "TREND",
        title: "Tendance santé digitale",
        summary: "Les requêtes télémédecine progressent de 28% sur 3 mois.",
        confidence: 0.84,
        ...score(0.7, 0.56),
      },
    }),
    prisma.insight.create({
      data: {
        startupId: lpt.id,
        documentId: documents[3].id,
        type: "OPPORTUNITY",
        title: "Logistique urbaine",
        summary: "Les opérateurs demandent plus de tracking en temps réel.",
        confidence: 0.73,
        ...score(0.68, 0.58),
      },
    }),
    prisma.insight.create({
      data: {
        startupId: doasi.id,
        type: "RISK",
        title: "Concurrence directe",
        summary: "2 acteurs locaux préparent des offres freemium.",
        confidence: 0.78,
        ...score(0.71, 0.74),
      },
    }),
    prisma.insight.create({
      data: {
        startupId: doasi.id,
        type: "OPPORTUNITY",
        title: "Demande secteur",
        summary: "Recherche 'paiement à la livraison' +18%.",
        confidence: 0.7,
        ...score(0.64, 0.52),
      },
    }),
    prisma.insight.create({
      data: {
        startupId: speedmaker.id,
        type: "OPPORTUNITY",
        title: "Subventions Ghana",
        summary: "Programmes industriels annoncés Q3.",
        confidence: 0.69,
        ...score(0.6, 0.5),
      },
    }),
    prisma.insight.create({
      data: {
        startupId: miame.id,
        type: "TREND",
        title: "Tendance télémédecine",
        summary: "Hausse des requêtes en Afrique de l'Est.",
        confidence: 0.76,
        ...score(0.66, 0.54),
      },
    }),
    prisma.insight.create({
      data: {
        startupId: koodi.id,
        type: "RISK",
        title: "Besoin conformité",
        summary: "Nouvelles obligations RH au Sénégal.",
        confidence: 0.71,
        ...score(0.7, 0.73),
      },
    }),
    prisma.insight.create({
      data: {
        startupId: lpt.id,
        type: "OPPORTUNITY",
        title: "Subventions logistiques",
        summary: "Appels d'offres publics Q2.",
        confidence: 0.74,
        ...score(0.62, 0.55),
      },
    }),
  ]);

  await prisma.alert.createMany({
    data: [
      {
        startupId: doasi.id,
        insightId: insights[4].id,
        title: "CAC en hausse sur DoAsi",
        severity: "HIGH",
        status: "OPEN",
      },
      {
        startupId: speedmaker.id,
        insightId: insights[1].id,
        title: "Nouveau concurrent SpeedMaker",
        severity: "CRITICAL",
        status: "OPEN",
      },
      {
        startupId: miame.id,
        insightId: insights[2].id,
        title: "Signal marché Miame",
        severity: "MEDIUM",
        status: "OPEN",
      },
    ],
  });

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
      name: "Opportunity detection",
      enabled: true,
      trigger: { label: "Mardi 08:00", type: "schedule.weekly" },
      actions: { label: "Détection pattern", type: "create.recommendation" },
      description: "Analyse globale et suggestion business.",
      workflowType: "opportunity-detection",
      priority: 7,
      maxRetries: 1,
      retryBackoffSeconds: 120,
    },
  });

  const workflowContent = await prisma.automationWorkflow.create({
    data: {
      workspaceId: workspace.id,
      name: "Content automation SpeedMaker",
      enabled: true,
      trigger: { label: "Mercredi 09:00", type: "schedule.weekly" },
      actions: { label: "Génération contenu", type: "generate.content" },
      description: "Génération de contenu marketing pour SpeedMaker.",
      workflowType: "content-automation",
      priority: 6,
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

  const workflowTalent = await prisma.automationWorkflow.create({
    data: {
      workspaceId: workspace.id,
      name: "Talent matching LPT",
      enabled: true,
      trigger: { label: "Vendredi 10:00", type: "schedule.weekly" },
      actions: { label: "Match talents", type: "match.talent" },
      description: "Matching LPT ↔ startups.",
      workflowType: "talent-matching",
      priority: 5,
      maxRetries: 1,
      retryBackoffSeconds: 120,
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
        workflowId: workflowContent.id,
        type: "schedule.weekly",
        config: { day: "Mercredi", time: "09:00" },
        order: 0,
      },
      {
        workflowId: workflowAlerting.id,
        type: "schedule.daily",
        config: { time: "08:30" },
        order: 0,
      },
      {
        workflowId: workflowTalent.id,
        type: "schedule.weekly",
        config: { day: "Vendredi", time: "10:00" },
        order: 0,
      },
      {
        workflowId: workflowExecution.id,
        type: "schedule.daily",
        config: { time: "06:00" },
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
        type: "create.recommendation",
        config: { mode: "opportunity" },
        order: 0,
      },
      {
        workflowId: workflowContent.id,
        type: "generate.content",
        config: { startup: "speedmaker", channel: "LinkedIn" },
        order: 0,
      },
      {
        workflowId: workflowAlerting.id,
        type: "escalate.alert",
        config: { to: "Managing Partner", channel: "Email" },
        order: 0,
      },
      {
        workflowId: workflowTalent.id,
        type: "match.talent",
        config: { focus: "LPT" },
        order: 0,
      },
      {
        workflowId: workflowExecution.id,
        type: "run.workflows",
        config: { scope: "due" },
        order: 0,
      },
    ],
  });

  await prisma.workflowRun.createMany({
    data: [
      {
        workflowId: workflowMarket.id,
        status: "SUCCESS",
        startedAt: new Date("2026-03-27T06:35:00Z"),
        finishedAt: new Date("2026-03-27T06:36:10Z"),
        durationMs: 70000,
        triggeredBy: "schedule",
        log: {
          title: "Market intelligence",
          detail: "4 sources analysées, 6 insights générés.",
        },
      },
      {
        workflowId: workflowMonitoring.id,
        status: "SUCCESS",
        startedAt: new Date("2026-03-24T07:40:00Z"),
        finishedAt: new Date("2026-03-24T07:41:30Z"),
        durationMs: 90000,
        triggeredBy: "schedule",
        log: {
          title: "Startup monitoring",
          detail: "5 startups analysées, 2 alertes.",
        },
      },
      {
        workflowId: workflowAlerting.id,
        status: "SUCCESS",
        startedAt: new Date("2026-03-26T09:00:00Z"),
        finishedAt: new Date("2026-03-26T09:00:30Z"),
        durationMs: 30000,
        triggeredBy: "event",
        log: {
          title: "Alerting",
          detail: "3 alertes notifiées.",
        },
      },
    ],
  });

  const nodes = await Promise.all([
    prisma.ecosystemNode.create({
      data: {
        workspaceId: workspace.id,
        type: "startup",
        label: "DoAsi",
        meta: { x: "15%", y: "30%" },
      },
    }),
    prisma.ecosystemNode.create({
      data: {
        workspaceId: workspace.id,
        type: "startup",
        label: "SpeedMaker",
        meta: { x: "45%", y: "20%" },
      },
    }),
    prisma.ecosystemNode.create({
      data: {
        workspaceId: workspace.id,
        type: "startup",
        label: "Miame",
        meta: { x: "70%", y: "35%" },
      },
    }),
    prisma.ecosystemNode.create({
      data: {
        workspaceId: workspace.id,
        type: "startup",
        label: "Koodi",
        meta: { x: "30%", y: "65%" },
      },
    }),
    prisma.ecosystemNode.create({
      data: {
        workspaceId: workspace.id,
        type: "startup",
        label: "LPT",
        meta: { x: "65%", y: "70%" },
      },
    }),
  ]);

  await prisma.ecosystemEdge.createMany({
    data: [
      {
        workspaceId: workspace.id,
        fromId: nodes[2].id,
        toId: nodes[3].id,
        kind: "synergy",
        strength: 0.76,
        meta: {
          detail: "Synergie RH + santé, opportunité cross-sell.",
        },
      },
      {
        workspaceId: workspace.id,
        fromId: nodes[0].id,
        toId: nodes[4].id,
        kind: "synergy",
        strength: 0.68,
        meta: { detail: "Optimisation logistique sur les commandes rurales." },
      },
      {
        workspaceId: workspace.id,
        fromId: nodes[1].id,
        toId: nodes[3].id,
        kind: "synergy",
        strength: 0.72,
        meta: { detail: "Besoin RH renforcé pour les équipes locales." },
      },
    ],
  });

  await prisma.aiRun.createMany({
    data: [
      {
        workspaceId: workspace.id,
        model: "gpt-5.4",
        prompt:
          "Quels sont les 3 risques majeurs pour DoAsi sur les 90 prochains jours ?",
        response:
          "1) CAC en hausse sur Meta (+22%). 2) Perte de positions SEO sur mots-clés coeur. 3) Entrée d'un concurrent freemium local. Recommandation: diversifier acquisition, relancer cohortes inactives, renforcer différenciation produit.",
        tokensIn: 120,
        tokensOut: 180,
        costUsd: 0.08,
      },
      {
        workspaceId: workspace.id,
        model: "gpt-5.4",
        prompt: "Propose un plan d'action priorisé avec impact estimé et effort.",
        response:
          "Plan priorisé: (A) Relance des cohortes inactives: impact MRR +6-9%, effort moyen. (B) SEO long tail: impact 4-6%, effort faible. (C) Positionnement freemium: impact différenciation, effort élevé.",
        tokensIn: 110,
        tokensOut: 170,
        costUsd: 0.07,
      },
    ],
  });

  await prisma.startupMember.createMany({
    data: [
      { startupId: doasi.id, userId: lead.id, role: "LEAD" },
      { startupId: speedmaker.id, userId: lead.id, role: "LEAD" },
      { startupId: miame.id, userId: analyst.id, role: "ANALYST" },
      { startupId: koodi.id, userId: analyst.id, role: "ANALYST" },
      { startupId: lpt.id, userId: ops.id, role: "ADMIN" },
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
