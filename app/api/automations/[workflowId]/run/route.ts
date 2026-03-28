import { runWorkflow } from "@/lib/automations/run";

export async function POST(
  _request: Request,
  context: { params: Promise<{ workflowId: string }> }
) {
  const { workflowId } = await context.params;
  const result = await runWorkflow(workflowId, "manual");
  return Response.json({ result });
}
