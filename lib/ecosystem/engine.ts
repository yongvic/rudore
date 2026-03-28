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
  id?: string;
  title: string;
  detail: string;
  strength: number;
  kind: string;
  fromId?: string;
  toId?: string;
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

function intersection(a: string[] = [], b: string[] = []) {
  const setA = new Set(a.map((t) => t.toLowerCase()));
  return b.filter((t) => setA.has(t.toLowerCase()));
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
      const commonTags = intersection(left.tags, right.tags);
      const candidate = `${left.label} ↔ ${right.label}`;
      if (existingPairs.has(candidate) || tagOverlap === 0) {
        continue;
      }
      suggestions.push({
        title: candidate,
        detail: `Tags communs: ${commonTags.slice(0, 3).join(", ")}.`,
        tags: commonTags.slice(0, 3),
        type: tagOverlap >= 2 ? "synergy" : "opportunity",
      });
    }
  }

  return suggestions.slice(0, 3);
}

function buildDerivedRelations(nodes: EcosystemNode[]) {
  const derived: EcosystemRelation[] = [];
  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const left = nodes[i];
      const right = nodes[j];
      const commonTags = intersection(left.tags, right.tags);
      if (commonTags.length === 0) continue;
      const strength = Math.min(0.9, 0.4 + commonTags.length * 0.15);
      derived.push({
        title: `${left.label} ↔ ${right.label}`,
        detail: `Synergie estimée via tags communs: ${commonTags
          .slice(0, 3)
          .join(", ")}.`,
        strength,
        kind: "derived",
        fromId: left.id,
        toId: right.id,
      });
    }
  }
  return derived.sort((a, b) => b.strength - a.strength).slice(0, 4);
}

export async function buildEcosystemSnapshot(workspaceId?: string | null) {
  const startups = await prisma.startup.findMany({
    where: workspaceId ? { workspaceId } : {},
    select: { name: true, tags: true, sector: true },
  });

  type StartupMetaRow = (typeof startups)[number];
  const startupMeta = new Map<string, { tags?: string[] | null; sector?: string | null }>(
    startups.map((startup: StartupMetaRow) => [
      startup.name.toLowerCase(),
      { tags: startup.tags, sector: startup.sector },
    ])
  );

  const nodes = await prisma.ecosystemNode.findMany({
    where: workspaceId ? { workspaceId } : {},
    orderBy: { createdAt: "asc" },
  });

  const edges = await prisma.ecosystemEdge.findMany({
    where: workspaceId ? { workspaceId } : {},
    include: { from: true, to: true },
    orderBy: { createdAt: "asc" },
  });

  type EcosystemNodeRow = (typeof nodes)[number];
  const nodeItems: EcosystemNode[] = nodes.map((node: EcosystemNodeRow, index: number) => {
    const meta = (node.meta as {
      x?: string;
      y?: string;
      sector?: string;
      tags?: string[];
    }) ?? { x: undefined, y: undefined };
    const fallback = startupMeta.get(node.label.toLowerCase());
    const angle = (Math.PI * 2 * index) / Math.max(nodes.length, 1);
    const fallbackX = `${50 + 32 * Math.cos(angle)}%`;
    const fallbackY = `${50 + 32 * Math.sin(angle)}%`;

    const sectorValue = meta.sector ?? fallback?.sector ?? undefined;
    const tagsValue = meta.tags ?? fallback?.tags ?? undefined;
    return {
      id: node.id,
      label: node.label,
      x: meta.x ?? fallbackX,
      y: meta.y ?? fallbackY,
      sector: sectorValue,
      tags: tagsValue,
    };
  });

  type EcosystemEdgeRow = (typeof edges)[number];
  const relationItems: EcosystemRelation[] = edges.map((edge: EcosystemEdgeRow) => ({
    id: edge.id,
    title: `${edge.from.label} ↔ ${edge.to.label}`,
    detail: `Synergie ${edge.kind} à activer.`,
    strength: edge.strength,
    kind: edge.kind,
    fromId: edge.fromId,
    toId: edge.toId,
  }));

  const hydratedRelations =
    relationItems.length > 0 ? relationItems : buildDerivedRelations(nodeItems);

  const stats: EcosystemStats = {
    nodeCount: nodeItems.length,
    relationCount: hydratedRelations.length,
    avgStrength:
      hydratedRelations.length === 0
        ? 0
        : hydratedRelations.reduce((acc, item) => acc + item.strength, 0) /
          hydratedRelations.length,
  };

  const suggestions = computeSuggestion(nodeItems, hydratedRelations);

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
    relations: hydratedRelations,
    stats,
    suggestions,
    summary,
  };
}
