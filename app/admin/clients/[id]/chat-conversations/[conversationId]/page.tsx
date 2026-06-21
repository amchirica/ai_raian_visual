import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/admin-header";
import { ConversationDetail } from "@/components/admin/conversation-detail";
import { clientService } from "@/lib/services/client-service";
import { assistantService } from "@/lib/services/assistant-service";

interface PageProps {
  params: Promise<{ id: string; conversationId: string }>;
}

export default async function ConversationDetailPage({ params }: PageProps) {
  const { id, conversationId } = await params;
  const client = await clientService.getClientById(id).catch(() => null);
  if (!client) notFound();

  const { conversation, messages } = await assistantService.getConversationWithMessages(conversationId);
  if (!conversation || conversation.client_id !== id) notFound();

  return (
    <>
      <AdminHeader title="Conversation" description={client.name} />
      <ConversationDetail
        clientId={id}
        clientSlug={client.slug}
        conversation={conversation}
        messages={messages}
      />
    </>
  );
}
