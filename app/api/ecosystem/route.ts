import { buildEcosystemSnapshot } from "@/lib/ecosystem/engine";

export async function GET() {
  const snapshot = await buildEcosystemSnapshot();
  return Response.json(snapshot);
}
