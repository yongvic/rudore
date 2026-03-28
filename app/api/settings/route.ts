import { prisma } from "@/lib/db";
import { formatNumber } from "@/lib/formatters";
import { getWorkspaceAiConfig } from "@/lib/ai-config.server";

export async function GET() {
  const [workspaceUserCount, leadCount, analystCount, sourceCount, workspace] =
    await Promise.all([
      prisma.workspaceUser.count(),
      prisma.workspaceUser.count({ where: { role: "LEAD" } }),
      prisma.workspaceUser.count({ where: { role: "ANALYST" } }),
      prisma.dataSource.count(),
      prisma.workspace.findFirst({ select: { id: true } }),
    ]);

  const aiConfig = await getWorkspaceAiConfig(workspace?.id ?? null);

  const settings = [
    {
      title: "Accès & rôles",
      detail: `${formatNumber(workspaceUserCount, 0)} membres actifs, ${formatNumber(
        leadCount,
        0
      )} leads, ${formatNumber(analystCount, 0)} analystes.`,
    },
    {
      title: "Sources de données",
      detail: `${formatNumber(sourceCount, 0)} sources externes actives.`,
    },
    {
      title: "Intégrations",
      detail: "Slack, Notion, Google Drive.",
    },
    {
      title: "Gouvernance IA",
      detail: `${formatNumber(
        aiConfig.impactKeywords.length + aiConfig.urgencyKeywords.length,
        0
      )} mots-clés actifs, ${formatNumber(
        Object.keys(aiConfig.sectorBoosts).length,
        0
      )} secteurs couverts.`,
    },
  ];

  return Response.json({ settings });
}
