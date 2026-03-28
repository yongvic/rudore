import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import { fetchRss } from "@/lib/pipelines/rss";
import { sourceProviderMap } from "@/lib/pipelines/providers";
import { defaultAiConfig } from "@/lib/ai-config";
import { getWorkspaceAiConfigs } from "@/lib/ai-config.server";
import { logAction } from "@/lib/action-log";

type IngestInput = {
  sourceId?: string;
  startupId?: string | null;
  startupSlug?: string;
  workspaceId?: string;
};

const insightTypeBySource: Record<
  string,
  "MARKET" | "COMPETITOR" | "TREND" | "OPPORTUNITY" | "RISK"
> = {
  Regulatory: "MARKET",
  Media: "COMPETITOR",
  Trends: "TREND",
  Research: "OPPORTUNITY",
};

function clampScore(value: number) {
  return Math.max(10, Math.min(95, value));
}

function taskPriorityFromImpact(impactScore: number) {
  if (impactScore >= 85) return "CRITICAL";
  if (impactScore >= 70) return "HIGH";
  if (impactScore >= 55) return "MEDIUM";
  return "LOW";
}

function countHits(text: string, keywords: string[]) {
  return keywords.reduce((acc, keyword) => acc + (text.includes(keyword) ? 1 : 0), 0);
}

const countryMap: Record<string, string> = {
  "côte d'ivoire": "Côte d'Ivoire",
  cote: "Côte d'Ivoire",
  nigeria: "Nigeria",
  ghana: "Ghana",
  bénin: "Bénin",
  benin: "Bénin",
  sénégal: "Sénégal",
  senegal: "Sénégal",
  togo: "Togo",
  kenya: "Kenya",
  rwanda: "Rwanda",
};

const topicDictionary: Record<string, string[]> = {
  réglementation: ["régulation", "loi", "conformité", "kyc", "amende"],
  financement: ["financement", "levée", "investissement", "capital"],
  concurrence: ["concurrent", "competition", "rival", "market share"],
  diaspora: ["diaspora", "communauté", "diasporas", "africaine"],
  dons: ["don", "dons", "philanthropie", "ong", "humanitaire"],
  paiements: ["paiement", "ussd", "mobile money", "transfert", "api"],
  abonnements: ["abonnement", "streaming", "saas", "partage", "pricing"],
  talent: ["talent", "formation", "compétence", "emploi", "recrutement"],
  media: ["media", "contenu", "startup", "tendance", "levée"],
};

function detectLanguage(text: string) {
  const normalized = text.toLowerCase();
  const frenchSignals = ["le", "la", "les", "des", "pour", "sur", "avec", "nouveau"];
  const hits = countHits(normalized, frenchSignals);
  return hits >= 2 ? "fr" : "en";
}

function extractEntities(text: string) {
  const normalized = text.toLowerCase();
  const countries = Object.entries(countryMap)
    .filter(([key]) => normalized.includes(key))
    .map(([, value]) => value);
  return {
    countries: Array.from(new Set(countries)),
  };
}

function extractTags(text: string, config: typeof defaultAiConfig) {
  const normalized = text.toLowerCase();
  const tags = new Set<string>();

  for (const [tag, keywords] of Object.entries(topicDictionary)) {
    if (countHits(normalized, keywords) > 0) {
      tags.add(tag);
    }
  }

  for (const keyword of config.impactKeywords.concat(config.urgencyKeywords)) {
    if (normalized.includes(keyword.toLowerCase())) {
      tags.add(keyword.toLowerCase());
    }
  }

  return Array.from(tags).slice(0, 8);
}

function computeAffinity(
  text: string,
  startup: { name: string; sector: string; tags: string[] } | undefined,
  sectorBoosts: Record<string, string[]>
) {
  if (!startup) return 0;
  const tokens = new Set(
    [startup.name, startup.sector, ...startup.tags]
      .flatMap((value) => value.split(/[^a-zA-Z0-9]+/))
      .map((value) => value.toLowerCase())
      .filter((value) => value.length >= 3)
  );

  let hits = 0;
  for (const token of tokens) {
    if (text.includes(token)) {
      hits += 1;
    }
  }

  const sectorBoost = sectorBoosts[startup.sector] ?? [];
  const sectorHits = countHits(text, sectorBoost);

  return Math.min(0.3, hits * 0.05 + sectorHits * 0.04);
}

function computeScores({
  text,
  type,
  reliability,
  affinity,
  config,
}: {
  text: string;
  type: string;
  reliability: number;
  affinity: number;
  config: typeof defaultAiConfig;
}) {
  const normalized = text.toLowerCase();
  const impactHits = countHits(normalized, config.impactKeywords);
  const urgencyHits = countHits(normalized, config.urgencyKeywords);
  const slowdownHits = countHits(normalized, config.slowdownKeywords);

  let impact = 0.35 + reliability * 0.45 + Math.min(0.25, impactHits * 0.06);
  let urgency = 0.25 + reliability * 0.35 + Math.min(0.28, urgencyHits * 0.07);

  if (type === "MARKET" || type === "COMPETITOR") {
    impact += 0.06;
    urgency += 0.05;
  }
  if (type === "RISK") {
    impact += 0.04;
    urgency += 0.08;
  }
  if (type === "TREND") {
    urgency -= 0.04;
  }

  if (slowdownHits > 0) {
    urgency -= 0.05;
  }

  if (affinity > 0) {
    impact += affinity * 0.4;
    urgency += affinity * 0.2;
  }

  const impactScore = clampScore(impact * 100);
  const urgencyScore = clampScore(urgency * 100);
  const priorityScore = clampScore(impactScore * 0.6 + urgencyScore * 0.4);
  const confidenceScore = clampScore(((impact + urgency) / 2) * 100);

  return { impactScore, urgencyScore, priorityScore, confidenceScore };
}

async function fetchHtmlSummary(url: string) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`HTML fetch failed (${response.status}).`);
  }
  const html = await response.text();
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch?.[1]?.trim();
  const descriptionMatch = html.match(
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i
  );
  const ogDescriptionMatch = html.match(
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["'][^>]*>/i
  );
  const description =
    descriptionMatch?.[1]?.trim() ?? ogDescriptionMatch?.[1]?.trim();
  return {
    title: title || url,
    description,
  };
}

export async function runIngestion(input: IngestInput = {}) {
  const sources = await prisma.dataSource.findMany({
    where: input.sourceId
      ? { id: input.sourceId }
      : input.workspaceId
        ? { workspaceId: input.workspaceId }
        : {},
    orderBy: { createdAt: "asc" },
  });

  type SourceRow = (typeof sources)[number];
  const workspaceIdCandidates: string[] = sources
    .map((source: SourceRow) => source.workspaceId)
    .filter((value: string | null | undefined): value is string =>
      Boolean(value)
    );
  const workspaceIds: string[] = [...new Set(workspaceIdCandidates)];
  const aiConfigs = await getWorkspaceAiConfigs(workspaceIds);

  const startups = await prisma.startup.findMany({
    where: input.workspaceId ? { workspaceId: input.workspaceId } : {},
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, slug: true, sector: true, tags: true },
  });

  type StartupRow = (typeof startups)[number];
  const selectedStartup =
    input.startupSlug
      ? startups.find((startup: StartupRow) => startup.slug === input.startupSlug)
      : undefined;
  const fallbackStartupId =
    input.startupId ?? selectedStartup?.id ?? startups[0]?.id ?? null;
  const targetStartup =
    startups.find((startup: StartupRow) => startup.id === fallbackStartupId) ??
    selectedStartup;
  const results = {
    sources: sources.length,
    jobs: 0,
    documents: 0,
    insights: 0,
    alerts: 0,
    recommendations: 0,
    mode: "live",
  };

  for (const source of sources) {
    const startedAt = new Date();
    const job = await prisma.scrapeJob.create({
      data: {
        sourceId: source.id,
        status: "RUNNING",
        scheduledAt: startedAt,
        startedAt,
      },
    });
    results.jobs += 1;

    const provider = sourceProviderMap[source.type] ?? "generic";
    let items: Array<{ title: string; link: string; description?: string }> = [];
    const aiConfig = aiConfigs.get(source.workspaceId) ?? defaultAiConfig;

    if (provider === "rss") {
      try {
        const rssUrl = source.rssUrl || source.url;
        const fetched = await fetchRss(rssUrl);
        if (fetched.length > 0) {
          items = fetched;
          results.mode = "rss";
        }
      } catch {
        items = [];
      }
    } else {
      try {
        const page = await fetchHtmlSummary(source.url);
        items = [{ title: page.title, link: source.url, description: page.description }];
        results.mode = "html";
      } catch {
        items = [];
      }
    }

    if (items.length === 0) {
      await prisma.scrapeJob.update({
        where: { id: job.id },
        data: {
          status: "FAILED",
          finishedAt: new Date(),
          error: "Aucune donnée récupérée depuis la source.",
        },
      });
      continue;
    }

    const documents = items;

    for (const item of documents.slice(0, 3)) {
      const hash = createHash("sha256")
        .update(`${source.id}:${item.link}:${item.title}`)
        .digest("hex");

      const existing = await prisma.rawDocument.findFirst({
        where: { hash },
        select: { id: true },
      });

      if (existing) {
        continue;
      }

      const documentText = `${item.title ?? ""} ${item.description ?? ""}`;
      const language = detectLanguage(documentText);
      const tags = extractTags(documentText, aiConfig);
      const entities = extractEntities(documentText);
      const document = await prisma.rawDocument.create({
        data: {
          jobId: job.id,
          url: item.link,
          title: item.title,
          content: item.description || "",
          lang: language,
          tags,
          entities,
          hash,
        },
      });
      results.documents += 1;

      const insightType =
        insightTypeBySource[source.type] ?? "OPPORTUNITY";

      const scoreText = `${item.title ?? ""} ${item.description ?? ""}`;
      const normalized = scoreText.toLowerCase();
      const affinity = computeAffinity(normalized, targetStartup, aiConfig.sectorBoosts);
      const impactHits = countHits(normalized, aiConfig.impactKeywords);
      const urgencyHits = countHits(normalized, aiConfig.urgencyKeywords);
      const slowdownHits = countHits(normalized, aiConfig.slowdownKeywords);
      const scores = computeScores({
        text: scoreText,
        type: insightType,
        reliability: source.reliability,
        affinity,
        config: aiConfig,
      });
      const signalMeta = {
        language,
        tags,
        entities,
        source: {
          id: source.id,
          name: source.name,
          type: source.type,
          reliability: source.reliability,
        },
        scoring: scores,
        affinity: {
          startupId: targetStartup?.id ?? null,
          startupSlug: targetStartup?.slug ?? null,
          score: affinity,
        },
        keywordHits: {
          impact: impactHits,
          urgency: urgencyHits,
          slowdown: slowdownHits,
        },
        timeHorizon: slowdownHits > 0 ? "long-term" : "short-term",
      };

      const insight = await prisma.insight.create({
        data: {
          startupId: fallbackStartupId,
          documentId: document.id,
          type: insightType,
          title: item.title || `Signal ${source.name}`,
          summary: item.description || "Signal importé, analyse IA à compléter.",
          confidenceScore: scores.confidenceScore,
          impactScore: scores.impactScore,
          urgencyScore: scores.urgencyScore,
          priorityScore: scores.priorityScore,
          meta: signalMeta,
        },
      });
      results.insights += 1;
      if (source.workspaceId) {
        await logAction({
          workspaceId: source.workspaceId,
          startupId: fallbackStartupId ?? undefined,
          type: "insight.created",
          payload: {
            insightId: insight.id,
            title: insight.title,
            impactScore: insight.impactScore,
            urgencyScore: insight.urgencyScore,
            tags,
            countries: entities.countries ?? [],
            timeHorizon: signalMeta.timeHorizon,
            sourceType: source.type,
          },
        });
      }

      const alertSeverity =
        scores.priorityScore > 85 || scores.urgencyScore > 80
          ? "CRITICAL"
          : scores.priorityScore > 70
            ? "HIGH"
            : scores.priorityScore > 55
              ? "MEDIUM"
              : "LOW";

      if (
        insightType === "COMPETITOR" ||
        insightType === "MARKET" ||
        insightType === "RISK" ||
        scores.priorityScore > 82
      ) {
        await prisma.alert.create({
          data: {
            startupId: fallbackStartupId,
            insightId: insight.id,
            title: `Alerte ${source.name}`,
            severity: alertSeverity,
            status: "OPEN",
          },
        });
        results.alerts += 1;
      }

      if (fallbackStartupId && scores.impactScore > 70) {
        const recommendation = await prisma.recommendation.create({
          data: {
            startupId: fallbackStartupId,
            insightId: insight.id,
            title: "Évaluer l'impact du signal",
            rationale: "Analyse IA à compléter lors du prochain cycle.",
            action: "Ajouter un brief d'analyse",
          },
        });
        results.recommendations += 1;

        const task = await prisma.task.create({
          data: {
            workspaceId: source.workspaceId,
            startupId: fallbackStartupId,
            insightId: insight.id,
            recommendationId: recommendation.id,
            title: "Analyser le signal externe",
            detail: recommendation.rationale,
            status: "OPEN",
            priority: taskPriorityFromImpact(scores.impactScore),
            source: "ingestion",
            meta: {
              impactScore: scores.impactScore,
              urgencyScore: scores.urgencyScore,
            },
          },
        });
        await logAction({
          workspaceId: source.workspaceId,
          startupId: fallbackStartupId ?? undefined,
          type: "task.created",
          payload: {
            taskId: task.id,
            recommendationId: recommendation.id,
            title: task.title,
            priority: task.priority,
          },
        });
      }
    }

    await prisma.scrapeJob.update({
      where: { id: job.id },
      data: { status: "SUCCESS", finishedAt: new Date() },
    });
  }

  if (sources[0]?.workspaceId) {
    await logAction({
      workspaceId: sources[0].workspaceId,
      type: "ingestion.completed",
      payload: results,
    });
  }

  return results;
}

export async function runManualIngestion({
  workspaceId,
  startupSlug,
  title,
  summary,
  url,
}: {
  workspaceId: string;
  startupSlug?: string;
  title: string;
  summary: string;
  url?: string | null;
}) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });
  if (!workspace) {
    throw new Error("Workspace missing.");
  }

  const startup = startupSlug
    ? await prisma.startup.findFirst({
        where: { workspaceId, slug: startupSlug },
      })
    : null;

  const aiConfig = (await getWorkspaceAiConfigs([workspaceId])).get(workspaceId) ??
    defaultAiConfig;

  const manualSource =
    (await prisma.dataSource.findFirst({
      where: { workspaceId, name: "Manual Input" },
    })) ??
    (await prisma.dataSource.create({
      data: {
        workspaceId,
        name: "Manual Input",
        url: "manual://input",
        type: "Research",
        reliability: 0.75,
      },
    }));

  const job = await prisma.scrapeJob.create({
    data: {
      sourceId: manualSource.id,
      status: "SUCCESS",
      scheduledAt: new Date(),
      startedAt: new Date(),
      finishedAt: new Date(),
    },
  });

  const documentText = `${title} ${summary}`;
  const language = detectLanguage(documentText);
  const tags = extractTags(documentText, aiConfig);
  const entities = extractEntities(documentText);
  const document = await prisma.rawDocument.create({
    data: {
      jobId: job.id,
      url: url ?? "manual://signal",
      title,
      content: summary,
      lang: language,
      tags,
      entities,
      hash: createHash("sha256")
        .update(`${workspaceId}:${title}:${summary}`)
        .digest("hex"),
    },
  });

  const normalized = documentText.toLowerCase();
  const affinity = computeAffinity(
    normalized,
    startup ? { name: startup.name, sector: startup.sector, tags: startup.tags } : undefined,
    aiConfig.sectorBoosts
  );
  const impactHits = countHits(normalized, aiConfig.impactKeywords);
  const urgencyHits = countHits(normalized, aiConfig.urgencyKeywords);
  const slowdownHits = countHits(normalized, aiConfig.slowdownKeywords);
  const scores = computeScores({
    text: documentText,
    type: "OPPORTUNITY",
    reliability: manualSource.reliability,
    affinity,
    config: aiConfig,
  });
  const signalMeta = {
    language,
    tags,
    entities,
    source: {
      id: manualSource.id,
      name: manualSource.name,
      type: manualSource.type,
      reliability: manualSource.reliability,
    },
    scoring: scores,
    affinity: {
      startupId: startup?.id ?? null,
      startupSlug: startup?.slug ?? null,
      score: affinity,
    },
    keywordHits: {
      impact: impactHits,
      urgency: urgencyHits,
      slowdown: slowdownHits,
    },
    timeHorizon: slowdownHits > 0 ? "long-term" : "short-term",
  };

  const insight = await prisma.insight.create({
    data: {
      startupId: startup?.id ?? null,
      documentId: document.id,
      type: "OPPORTUNITY",
      title,
      summary,
      confidenceScore: scores.confidenceScore,
      impactScore: scores.impactScore,
      urgencyScore: scores.urgencyScore,
      priorityScore: scores.priorityScore,
      meta: signalMeta,
    },
  });

  await logAction({
    workspaceId,
    startupId: startup?.id ?? undefined,
    type: "manual.ingest",
    payload: {
      insightId: insight.id,
      title,
      impactScore: insight.impactScore,
      confidenceScore: insight.confidenceScore,
      url,
      tags,
      countries: entities.countries ?? [],
    },
  });

  let recommendationId: string | null = null;
  let taskId: string | null = null;

  if (scores.impactScore > 70 && startup) {
    const recommendation = await prisma.recommendation.create({
      data: {
        startupId: startup.id,
        insightId: insight.id,
        title: "Exploiter le signal manuel",
        rationale: "Signal externe à confirmer par analyse rapide.",
        action: "Créer une tâche de validation",
      },
    });
    recommendationId = recommendation.id;

    const task = await prisma.task.create({
      data: {
        workspaceId,
        startupId: startup?.id ?? null,
        insightId: insight.id,
        recommendationId: recommendation.id,
        title: "Valider le signal manuel",
        detail: recommendation.rationale,
        status: "OPEN",
        priority: taskPriorityFromImpact(scores.impactScore),
        source: "manual-ingest",
        meta: {
          impactScore: scores.impactScore,
          urgencyScore: scores.urgencyScore,
        },
      },
    });
    taskId = task.id;
  }

  return {
    insightId: insight.id,
    recommendationId,
    taskId,
    impactScore: scores.impactScore,
    confidenceScore: scores.confidenceScore,
  };
}
