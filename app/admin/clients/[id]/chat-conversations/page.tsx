import { notFound } from "next/navigation";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/admin-header";
import { ConversationsList } from "@/components/admin/conversations-list";
import { Button } from "@/components/ui/button";
import { clientService } from "@/lib/services/client-service";
import { assistantService } from "@/lib/services/assistant-service";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ChatConversationsPage({ params }: PageProps) {
  const { id } = await params;
  const client = await clientService.getClientById(id).catch(() => null);
  if (!client) notFound();

  const conversations = await assistantService.listConversations(id);

  return (
    <>
      <AdminHeader
        title={`Chat Conversations — ${client.name}`}
        description={`${conversations.length} conversations`}
        actions={
          <Link href={`/admin/clients/${id}/assistant`}>
            <Button variant="secondary">Assistant Settings</Button>
          </Link>
        }
      />
      <ConversationsList clientId={id} conversations={conversations} />
    </>
  );
}
