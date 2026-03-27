import { runIngestion } from "@/lib/pipelines/ingest";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({} as Record<string, string>));

  const result = await runIngestion({
    sourceId: payload.sourceId,
    startupId: payload.startupId ?? null,
    startupSlug: payload.startupSlug,
  });

  return Response.json({ status: "ok", result });
}
