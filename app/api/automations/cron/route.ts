import type { NextRequest } from "next/server";
import { runScheduler } from "@/lib/automations/run";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const token =
    request.headers.get("x-cron-token") ?? request.nextUrl.searchParams.get("token");

  if (secret && token !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await runScheduler();

  return Response.json({ status: "ok", runs: results });
}
