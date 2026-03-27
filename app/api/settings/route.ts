import { prisma } from "@/lib/db";
import { formatNumber } from "@/lib/formatters";

export async function GET() {
  const [workspaceUserCount, leadCount, analystCount, sourceCount] =
    await Promise.all([
      prisma.workspaceUser.count(),
      prisma.workspaceUser.count({ where: { role: "LEAD" } }),
      prisma.workspaceUser.count({ where: { role: "ANALYST" } }),
      prisma.dataSource.count(),
    ]);

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
      detail: `${formatNumber(sourceCount, 0)} sources externes, 4 internes.`,
    },
    {
      title: "Intégrations",
      detail: "Slack, Notion, Google Drive.",
    },
  ];

  return Response.json({ settings });
}
