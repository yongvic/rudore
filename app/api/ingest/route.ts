import { runIngestion } from "@/lib/pipelines/ingest";
import { guardApi } from "@/lib/api-guard";

export async function POST(request: Request) {
  const guard = guardApi(request, {
    requireAuth: true,
    rateLimit: { limit: 10, windowMs: 60_000, keyPrefix: "ingest-run" },
  });
  if (guard) return guard;

  const payload = await request.json().catch(() => ({} as Record<string, string>));

  const result = await runIngestion({
    sourceId: payload.sourceId,
    startupId: payload.startupId ?? null,
    startupSlug: payload.startupSlug,
    workspaceId: payload.workspaceId,
  });

  return Response.json({ status: "ok", result });
}
