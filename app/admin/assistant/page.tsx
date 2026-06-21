import { AdminHeader } from "@/components/admin/admin-header";
import { AssistantHubManager } from "@/components/admin/assistant-hub-manager";
import { clientService } from "@/lib/services/client-service";
import { assistantService } from "@/lib/services/assistant-service";
import { platformService } from "@/lib/services/platform-service";

export default async function AssistantHubPage() {
  const clients = await clientService.listClients();
  const [settings, conversations] = await Promise.all([
    Promise.all(
      clients.map(async (c) => ({
        client: c,
        assistant: await assistantService.getSettings(c.id),
      })),
    ),
    platformService.listRecentConversations(50),
  ]);

  return (
    <>
      <AdminHeader
        title="AI Assistant"
        description="Edit assistant settings per client, manage conversations — edit status or delete."
      />
      <AssistantHubManager clientAssistants={settings} conversations={conversations} />
    </>
  );
}
