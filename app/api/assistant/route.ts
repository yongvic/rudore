import { prisma } from "@/lib/db";
import { formatNumber } from "@/lib/formatters";

export async function GET() {
  const [aiRuns, aiRunCount, startups, sourcesCount] = await Promise.all([
    prisma.aiRun.findMany({ orderBy: { createdAt: "desc" }, take: 2 }),
    prisma.aiRun.count(),
    prisma.startup.findMany({ orderBy: { createdAt: "asc" }, select: { name: true } }),
    prisma.dataSource.count(),
  ]);

  const conversation = aiRuns.flatMap((run) => [
    { role: "user" as const, content: run.prompt },
    { role: "assistant" as const, content: run.response },
  ]);

  const context = [
    {
      label: "Startups liées",
      value:
        startups.length > 0
          ? startups.slice(0, 2).map((item) => item.name).join(", ")
          : "Aucune startup liée",
    },
    {
      label: "Sources actives",
      value: `${formatNumber(sourcesCount, 0)} flux externes`,
    },
    {
      label: "Mémoire",
      value: `${formatNumber(aiRunCount, 0)} décisions similaires analysées`,
    },
  ];

  const suggestions = [
    "Comparer DoAsi vs cohortes 2024",
    "Générer un brief pour le board",
    "Simuler l'impact d'une baisse CAC",
  ];

  return Response.json({ conversation, context, suggestions });
}
