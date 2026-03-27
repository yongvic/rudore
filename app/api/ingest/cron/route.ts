import type { NextRequest } from "next/server";
import { runIngestion } from "@/lib/pipelines/ingest";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const token =
    request.headers.get("x-cron-token") ?? request.nextUrl.searchParams.get("token");

  if (secret && token !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runIngestion();

  return Response.json({ status: "ok", result });
}
