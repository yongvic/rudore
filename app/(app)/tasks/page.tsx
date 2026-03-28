import { TopBar } from "@/components/layout/top-bar";
import { TasksManager } from "@/components/tasks/tasks-manager";
import { apiGet } from "@/lib/api";
import type { StartupsResponse, TasksResponse } from "@/lib/api-types";

export default async function TasksPage() {
  const data = await apiGet<TasksResponse>("/api/tasks");
  const startupsData = await apiGet<StartupsResponse>("/api/startups");

  return (
    <div className="flex flex-1 flex-col">
      <TopBar
        title="Tâches stratégiques"
        description="Orchestration des actions issues des insights et workflows IA."
      />

      <main className="flex-1 px-8 py-10">
        <TasksManager
          initialTasks={data.tasks}
          initialMeta={data.meta}
          startups={startupsData.startups.map((startup) => ({
            slug: startup.id,
            name: startup.name,
          }))}
        />
      </main>
    </div>
  );
}
