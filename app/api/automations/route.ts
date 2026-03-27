import { prisma } from "@/lib/db";
import { formatRelativeTime } from "@/lib/formatters";

export async function GET() {
  const workflows = await prisma.automationWorkflow.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const history = await prisma.workflowRun.findMany({
    orderBy: { startedAt: "desc" },
    take: 6,
  });

  const workflowItems = workflows.map((workflow) => ({
    name: workflow.name,
    trigger: (workflow.trigger as { label?: string })?.label ?? "—",
    action: (workflow.actions as { label?: string })?.label ?? "—",
    status: workflow.enabled ? "Actif" : "En pause",
  }));

  const historyItems = history.map((run) => ({
    title: (run.log as { title?: string })?.title ?? "Exécution",
    detail:
      (run.log as { detail?: string })?.detail ??
      "Exécution terminée sans incident.",
    time: formatRelativeTime(run.startedAt),
  }));

  return Response.json({ workflows: workflowItems, history: historyItems });
}
