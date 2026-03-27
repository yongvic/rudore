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

export async function runIngestion(input: IngestInput = {}) {
  const sources = await prisma.dataSource.findMany({
    where: input.sourceId ? { id: input.sourceId } : {},
    orderBy: { createdAt: "asc" },
  });

  const startups = await prisma.startup.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, slug: true },
  });

  const selectedStartup =
    input.startupSlug
      ? startups.find((startup) => startup.slug === input.startupSlug)
      : undefined;
  const fallbackStartupId =
    input.startupId ?? selectedStartup?.id ?? startups[0]?.id ?? null;
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
        const fetched = await fetchRss(source.url);
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

      const insight = await prisma.insight.create({
        data: {
          startupId: fallbackStartupId,
          documentId: document.id,
          type: insightType,
          title: item.title || `Signal ${source.name}`,
          summary: item.description || "Signal importé, analyse IA à compléter.",
          confidence: 0.6,
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
