import { prisma } from "@/lib/db";
import { callGemini } from "@/lib/services/gemini";

export type EcosystemNode = {
  id: string;
  label: string;
  x: string;
  y: string;
  sector?: string;
  tags?: string[];
};

export type EcosystemRelation = {
  title: string;
  detail: string;
  strength: number;
};

export type EcosystemSuggestion = {
  title: string;
  detail: string;
  tags: string[];
  type: "synergy" | "talent" | "opportunity";
};

export type EcosystemStats = {
  nodeCount: number;
  relationCount: number;
  avgStrength: number;
};

function similarity(a: string[], b: string[]) {
  const setA = new Set(a.map((t) => t.toLowerCase()));
  return b.filter((t) => setA.has(t.toLowerCase())).length;
}

function computeSuggestion(
  nodes: EcosystemNode[],
  relations: EcosystemRelation[]
): EcosystemSuggestion[] {
  const existingPairs = new Set(relations.map((relation) => relation.title));
  const suggestions: EcosystemSuggestion[] = [];

  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const left = nodes[i];
      const right = nodes[j];
      const tagOverlap =
        left.tags && right.tags ? similarity(left.tags, right.tags) : 0;
      const candidate = `${left.label} ↔ ${right.label}`;
      if (existingPairs.has(candidate) || tagOverlap === 0) {
        continue;
      }
      suggestions.push({
        title: candidate,
        detail: `Tags communs: ${tagOverlap}. Opportunité à explorer.`,
        tags: left.tags ? left.tags.slice(0, 2) : [],
        type: "opportunity",
      });
    }
  }

  return suggestions.slice(0, 3);
}

export async function buildEcosystemSnapshot(workspaceId?: string | null) {
  const nodes = await prisma.ecosystemNode.findMany({
    where: workspaceId ? { workspaceId } : {},
    orderBy: { createdAt: "asc" },
  });

  const edges = await prisma.ecosystemEdge.findMany({
    where: workspaceId ? { workspaceId } : {},
    include: { from: true, to: true },
    orderBy: { createdAt: "asc" },
  });

  const nodeItems: EcosystemNode[] = nodes.map((node) => ({
    id: node.id,
    label: node.label,
    x: (node.meta as { x?: string })?.x ?? "50%",
    y: (node.meta as { y?: string })?.y ?? "50%",
    sector: (node.meta as { sector?: string })?.sector,
    tags: (node.meta as { tags?: string[] })?.tags,
  }));

  const relationItems: EcosystemRelation[] = edges.map((edge) => ({
    title: `${edge.from.label} ↔ ${edge.to.label}`,
    detail:
      (edge.meta as { detail?: string })?.detail ??
      "Synergie prioritaire à activer.",
    strength: edge.strength,
  }));

  const stats: EcosystemStats = {
    nodeCount: nodeItems.length,
    relationCount: relationItems.length,
    avgStrength:
      relationItems.length === 0
        ? 0
        : relationItems.reduce((acc, item) => acc + item.strength, 0) /
          relationItems.length,
  };

  const suggestions = computeSuggestion(nodeItems, relationItems);

  let summary = `Graph ${stats.nodeCount} entités / ${stats.relationCount} liens`;
  try {
    summary = await callGemini(
      `Résume le graphe d'écosystème de ${stats.nodeCount} entités et ${stats.relationCount} relations en mettant en avant les synergies clés.`
    );
  } catch {
    // fallback
  }

  return {
    nodes: nodeItems,
    relations: relationItems,
    stats,
    suggestions,
    summary,
  };
}
