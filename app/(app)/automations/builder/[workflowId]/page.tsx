import { TopBar } from "@/components/layout/top-bar";
import { WorkflowBuilder } from "@/components/automations/workflow-builder";
import { apiGet } from "@/lib/api";
import type { AutomationWorkflowDetail } from "@/lib/api-types";

export default async function WorkflowBuilderPage({
  params,
}: {
  params: Promise<{ workflowId: string }>;
}) {
  const { workflowId } = await params;
  const workflow = await apiGet<AutomationWorkflowDetail>(
    `/api/automations/${workflowId}`
  );

  return (
    <div className="flex flex-1 flex-col">
      <TopBar
        title="Builder d'automations"
        description="Configurez les triggers et actions avec un contrôle fin."
      />

      <main className="flex-1 px-8 py-10">
        <WorkflowBuilder workflow={workflow} />
      </main>
    </div>
  );
}
