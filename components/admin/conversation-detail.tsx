"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField, Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import type { ChatConversation, ChatMessage } from "@/types";

interface ConversationDetailProps {
  clientId: string;
  clientSlug: string;
  conversation: ChatConversation;
  messages: ChatMessage[];
}

export function ConversationDetail({
  clientId,
  clientSlug,
  conversation,
  messages,
}: ConversationDetailProps) {
  const router = useRouter();
  const [leadForm, setLeadForm] = useState({ name: "", email: "", phone: "" });
  const [loading, setLoading] = useState(false);

  async function resolve() {
    await fetch(`/api/admin/chat-conversations/${conversation.id}`, { method: "PATCH" });
    router.refresh();
  }

  async function createLead(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/assistant/create-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_slug: clientSlug,
          conversation_id: conversation.id,
          ...leadForm,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-sm">{conversation.id}</p>
          <p className="text-sm text-muted">Created {formatDate(conversation.created_at)}</p>
        </div>
        <div className="flex gap-2">
          <Badge>{conversation.status}</Badge>
          {conversation.status !== "resolved" ? (
            <Button type="button" variant="secondary" size="sm" onClick={resolve}>Mark resolved</Button>
          ) : null}
          <Link href={`/admin/clients/${clientId}/chat-conversations`}>
            <Button variant="secondary" size="sm">Back</Button>
          </Link>
        </div>
      </div>

      <Card>
        <h3 className="mb-4 font-semibold">Messages</h3>
        <div className="space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`rounded-lg px-4 py-2 text-sm ${
                msg.role === "user" ? "ml-8 bg-primary/10" : "mr-8 bg-accent"
              }`}
            >
              <p className="text-xs font-medium text-muted">{msg.role}</p>
              <p className="mt-1 whitespace-pre-wrap">{msg.content}</p>
            </div>
          ))}
        </div>
      </Card>

      {conversation.lead_id ? (
        <Card>
          <p className="text-sm">
            Converted to lead:{" "}
            <Link href={`/admin/leads/${conversation.lead_id}`} className="text-primary hover:underline">
              {conversation.lead_id}
            </Link>
          </p>
        </Card>
      ) : (
        <Card>
          <h3 className="mb-4 font-semibold">Convert to Lead</h3>
          <form onSubmit={createLead} className="grid gap-3 sm:grid-cols-3">
            <FormField label="Name">
              <Input value={leadForm.name} onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })} required />
            </FormField>
            <FormField label="Email">
              <Input type="email" value={leadForm.email} onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })} required />
            </FormField>
            <FormField label="Phone">
              <Input value={leadForm.phone} onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })} />
            </FormField>
            <Button type="submit" disabled={loading} className="sm:col-span-3 w-fit">
              {loading ? "Creating..." : "Create Lead"}
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
