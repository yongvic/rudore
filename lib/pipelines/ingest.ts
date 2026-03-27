import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";

type IngestInput = {
  sourceId?: string;
  startupId?: string | null;
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
    select: { id: true, name: true },
  });

  const fallbackStartupId = input.startupId ?? startups[0]?.id ?? null;
  const results = {
    sources: sources.length,
    jobs: 0,
    documents: 0,
    insights: 0,
    alerts: 0,
    recommendations: 0,
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

    const content = `Ingestion initiale : ${source.name}.`;
    const hash = createHash("sha256")
      .update(`${source.id}:${Date.now()}`)
      .digest("hex");

    const document = await prisma.rawDocument.create({
      data: {
        jobId: job.id,
        url: source.url,
        title: source.name,
        content,
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
        title: `Signal ${source.name}`,
        summary: "Signal importé, analyse IA à compléter.",
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

  return results;
}
