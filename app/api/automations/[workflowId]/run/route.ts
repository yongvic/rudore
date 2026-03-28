import { runWorkflow } from "@/lib/automations/run";
import { guardApi } from "@/lib/api-guard";

export async function POST(
  request: Request,
  context: { params: Promise<{ workflowId: string }> }
) {
  const guard = guardApi(request, {
    requireAuth: true,
    rateLimit: { limit: 8, windowMs: 60_000, keyPrefix: "automations-run" },
  });
  if (guard) return guard;

  const { workflowId } = await context.params;
  const result = await runWorkflow(workflowId, "manual");
  return Response.json({ result });
}
