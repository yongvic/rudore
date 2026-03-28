import { prisma } from "@/lib/db";

type ActionLogInput = {
  workspaceId: string;
  startupId?: string | null;
  type: string;
  payload: Record<string, unknown>;
};

export async function logAction({
  workspaceId,
  startupId,
  type,
  payload,
}: ActionLogInput) {
  try {
    await prisma.actionLog.create({
      data: {
        workspaceId,
        startupId: startupId ?? null,
        type,
        payload,
      },
    });
  } catch {
    // best-effort log
  }
}
