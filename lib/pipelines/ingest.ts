import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import { fetchRss } from "@/lib/pipelines/rss";
import { sourceProviderMap } from "@/lib/pipelines/providers";

type IngestInput = {
  sourceId?: string;
  startupId?: string | null;
  startupSlug?: string;
};

const insightTypeBySource: Record<string, "MARKET" | "COMPETITOR" | "TREND" | "OPPORTUNITY"> = {
  Regulatory: "MARKET",
  Media: "COMPETITOR",
  Trends: "TREND",
  Internal: "OPPORTUNITY",
};

const impactKeywords = [
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
];

const urgencyKeywords = [
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
];

const slowdownKeywords = ["long terme", "progressif", "sur 12 mois", "horizon"];

function clampScore(value: number) {
  return Math.max(0.1, Math.min(0.95, value));
}

function countHits(text: string, keywords: string[]) {
  return keywords.reduce((acc, keyword) => acc + (text.includes(keyword) ? 1 : 0), 0);
}

const sectorKeywordBoosts: Record<string, string[]> = {
  "Commerce intelligent": ["ecommerce", "paiement", "livraison", "retention", "marketplace"],
  "Manufacturing rapide": ["usine", "industrie", "capacité", "supply", "production"],
  "Santé digitale": ["santé", "clinique", "hôpital", "télémédecine", "patient"],
  "Productivité RH": ["rh", "paie", "recrutement", "conformité", "talent"],
  Logistique: ["logistique", "route", "tracking", "livraison", "hub"],
};

function computeAffinity(text: string, startup?: { name: string; sector: string; tags: string[] }) {
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

  const sectorBoosts = sectorKeywordBoosts[startup.sector] ?? [];
  const sectorHits = countHits(text, sectorBoosts);

  return Math.min(0.3, hits * 0.05 + sectorHits * 0.04);
}

function computeScores({
  text,
  type,
  reliability,
  affinity,
}: {
  text: string;
  type: string;
  reliability: number;
  affinity: number;
}) {
  const normalized = text.toLowerCase();
  const impactHits = countHits(normalized, impactKeywords);
  const urgencyHits = countHits(normalized, urgencyKeywords);
  const slowdownHits = countHits(normalized, slowdownKeywords);

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

  impact = clampScore(impact);
  urgency = clampScore(urgency);
  const priority = clampScore(impact * 0.6 + urgency * 0.4);

  return { impact, urgency, priority };
}

export async function runIngestion(input: IngestInput = {}) {
  const sources = await prisma.dataSource.findMany({
    where: input.sourceId ? { id: input.sourceId } : {},
    orderBy: { createdAt: "asc" },
  });

  const startups = await prisma.startup.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, slug: true, sector: true, tags: true },
  });

  const selectedStartup =
    input.startupSlug
      ? startups.find((startup) => startup.slug === input.startupSlug)
      : undefined;
  const fallbackStartupId =
    input.startupId ?? selectedStartup?.id ?? startups[0]?.id ?? null;
  const targetStartup =
    startups.find((startup) => startup.id === fallbackStartupId) ??
    selectedStartup;
  const results = {
    sources: sources.length,
    jobs: 0,
    documents: 0,
    insights: 0,
    alerts: 0,
    recommendations: 0,
    mode: "simulated",
  };

  for (const source of sources) {
    const job = await prisma.scrapeJob.create({
      data: {
        sourceId: source.id,
        status: "SUCCESS",
        scheduledAt: new Date(),
        startedAt: new Date(),
        finishedAt: new Date(),
      },
    });
    results.jobs += 1;

    const provider = sourceProviderMap[source.type] ?? "generic";
    let items: Array<{ title: string; link: string; description?: string }> = [];
    let content = `Ingestion initiale : ${source.name}.`;

    if (provider === "rss") {
      try {
        const rssUrl = source.rssUrl || source.url;
        const fetched = await fetchRss(rssUrl);
        if (fetched.length > 0) {
          items = fetched;
          results.mode = "rss";
        } else {
          content = `Ingestion fallback : ${source.name}.`;
        }
      } catch (error) {
        content = `Ingestion fallback : ${source.name}.`;
      }
    }

    const documents = items.length > 0 ? items : [{ title: source.name, link: source.url, description: content }];

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

      const document = await prisma.rawDocument.create({
        data: {
          jobId: job.id,
          url: item.link,
          title: item.title,
          content: item.description || content,
          lang: "fr",
          hash,
        },
      });
      results.documents += 1;

      const insightType =
        insightTypeBySource[source.type] ?? "OPPORTUNITY";

      const scoreText = `${item.title ?? ""} ${item.description ?? content}`;
      const affinity = computeAffinity(scoreText.toLowerCase(), targetStartup);
      const scores = computeScores({
        text: scoreText,
        type: insightType,
        reliability: source.reliability,
        affinity,
      });

      const insight = await prisma.insight.create({
        data: {
          startupId: fallbackStartupId,
          documentId: document.id,
          type: insightType,
          title: item.title || `Signal ${source.name}`,
          summary: item.description || "Signal importé, analyse IA à compléter.",
          confidence: 0.6,
          impactScore: scores.impact,
          urgencyScore: scores.urgency,
          priorityScore: scores.priority,
        },
      });
      results.insights += 1;

      if (insightType === "COMPETITOR" || insightType === "MARKET") {
        await prisma.alert.create({
          data: {
            startupId: fallbackStartupId,
            insightId: insight.id,
            title: `Alerte ${source.name}`,
            severity: "HIGH",
            status: "OPEN",
          },
        });
        results.alerts += 1;
      }

      if (fallbackStartupId) {
        await prisma.recommendation.create({
          data: {
            startupId: fallbackStartupId,
            insightId: insight.id,
            title: "Évaluer l'impact du signal",
            rationale: "Analyse IA à compléter lors du prochain cycle.",
            action: "Ajouter un brief d'analyse",
          },
        });
        results.recommendations += 1;
      }
    }
  }

  return results;
}
