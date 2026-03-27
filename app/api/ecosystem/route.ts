import { prisma } from "@/lib/db";

export async function GET() {
  const nodes = await prisma.ecosystemNode.findMany({
    orderBy: { createdAt: "asc" },
  });

  const edges = await prisma.ecosystemEdge.findMany({
    include: { from: true, to: true },
    orderBy: { createdAt: "asc" },
  });

  const nodeItems = nodes.map((node) => ({
    id: node.id,
    label: node.label,
    x: (node.meta as { x?: string })?.x ?? "50%",
    y: (node.meta as { y?: string })?.y ?? "50%",
  }));

  const relations = edges.map((edge) => ({
    title: `${edge.from.label} ↔ ${edge.to.label}`,
    detail:
      (edge.meta as { detail?: string })?.detail ??
      "Synergie prioritaire à activer.",
  }));

  return Response.json({ nodes: nodeItems, relations });
}
