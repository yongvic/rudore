import { TopBar } from "@/components/layout/top-bar";
import { ActionLogsPanel } from "@/components/action-logs/action-logs-panel";
import { apiGet } from "@/lib/api";
import type { ActionLogsResponse, StartupsResponse } from "@/lib/api-types";

export default async function ActionLogsPage() {
  const data = await apiGet<ActionLogsResponse>("/api/action-logs");
  const startups = await apiGet<StartupsResponse>("/api/startups");

  return (
    <div className="flex flex-1 flex-col">
      <TopBar
        title="Journal IA"
        description="Traçabilité des actions IA, workflows et ingestion externe."
      />

      <main className="flex-1 px-8 py-10">
        <ActionLogsPanel
          initialLogs={data.logs}
          initialMeta={data.meta}
          startups={startups.startups.map((startup) => ({
            slug: startup.id,
            name: startup.name,
          }))}
        />
      </main>
    </div>
  );
}
