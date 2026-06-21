import { notFound, redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

interface PageProps {
  params: Promise<{ conversationId: string }>;
}

export default async function GlobalChatConversationPage({ params }: PageProps) {
  const { conversationId } = await params;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("chat_conversations")
    .select("id, client_id")
    .eq("id", conversationId)
    .maybeSingle();

  if (!data) notFound();

  redirect(`/admin/clients/${data.client_id}/chat-conversations/${conversationId}`);
}
