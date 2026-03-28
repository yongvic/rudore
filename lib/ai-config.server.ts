import "server-only";

import { prisma } from "@/lib/db";
import { defaultAiConfig, normalizeAiConfig, type AiScoringConfig } from "@/lib/ai-config";

export async function getWorkspaceAiConfigs(workspaceIds: string[]) {
  if (workspaceIds.length === 0) {
    return new Map<string, AiScoringConfig>();
  }
  const configs = await prisma.aiConfig.findMany({
    where: { workspaceId: { in: workspaceIds }, name: "default" },
  });

  const map = new Map<string, AiScoringConfig>();
  for (const config of configs) {
    map.set(config.workspaceId, normalizeAiConfig(config.config as AiScoringConfig));
  }
  return map;
}

export async function getWorkspaceAiConfig(workspaceId?: string | null) {
  if (!workspaceId) {
    return defaultAiConfig;
  }
  const config = await prisma.aiConfig.findFirst({
    where: { workspaceId, name: "default" },
  });
  if (!config) {
    return defaultAiConfig;
  }
  return normalizeAiConfig(config.config as AiScoringConfig);
}
