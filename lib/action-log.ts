import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

type ActionLogInput = {
  workspaceId: string;
  startupId?: string | null;
  type: string;
  payload: Prisma.InputJsonValue;
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
        payload: payload as Prisma.InputJsonValue,
      },
    });
  } catch {
    // best-effort log
  }
}
