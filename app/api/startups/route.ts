import { prisma } from "@/lib/db";

const stageLabels = {
  IDEA: "Idée",
  MVP: "MVP",
  TRACTION: "Traction",
  SCALE: "Scale",
};

const severityRank = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
};

const healthFromAlerts = (
  alerts: Array<{ severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" }>
) => {
  const highest = alerts.reduce<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | null>(
    (current, alert) => {
      if (!current) return alert.severity;
      return severityRank[alert.severity] > severityRank[current]
        ? alert.severity
        : current;
    },
    null
  );

  if (!highest) return { tone: "success", label: "Solide" };
  if (highest === "CRITICAL") return { tone: "danger", label: "Critique" };
  if (highest === "HIGH") return { tone: "warning", label: "Surveillance" };
  if (highest === "MEDIUM") return { tone: "info", label: "En progression" };
  return { tone: "success", label: "Solide" };
};

export async function GET() {
  const startups = await prisma.startup.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      alerts: { where: { status: "OPEN" }, orderBy: { severity: "desc" } },
      recos: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  type StartupRow = (typeof startups)[number];
  const data = startups.map((startup: StartupRow) => ({
    id: startup.slug,
    name: startup.name,
    sector: startup.sector,
    stage:
      stageLabels[startup.stage as keyof typeof stageLabels] ?? "Traction",
    focus: startup.focus ?? startup.recos[0]?.title ?? "Priorité à définir",
    health: healthFromAlerts(startup.alerts),
  }));

  return Response.json({ startups: data });
}
