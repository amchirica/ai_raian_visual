"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import type { AssistantSettings, ChatConversation, Client } from "@/types";

type ClientAssistant = {
  client: Client;
  assistant: AssistantSettings | null;
};

type ConversationRow = ChatConversation & { clients?: { name: string; slug: string } };

interface AssistantHubManagerProps {
  clientAssistants: ClientAssistant[];
  conversations: ConversationRow[];
}

export function AssistantHubManager({ clientAssistants, conversations }: AssistantHubManagerProps) {
  const router = useRouter();
  const [clients, setClients] = useState(clientAssistants);
  const [convs, setConvs] = useState(conversations);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    is_enabled: true,
    greeting_message: "",
    fallback_message: "",
    tone: "professional",
  });
  const [convStatus, setConvStatus] = useState("active");

  function startEditClient(item: ClientAssistant) {
    setEditingClientId(item.client.id);
    setEditForm({
      is_enabled: item.assistant?.is_enabled !== false,
      greeting_message: item.assistant?.greeting_message ?? "",
      fallback_message: item.assistant?.fallback_message ?? "",
      tone: item.assistant?.tone ?? "professional",
    });
    setError(null);
  }

  async function saveClientSettings(clientId: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/assistant`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error("Failed to save");
      setClients((prev) =>
        prev.map((c) =>
          c.client.id === clientId
            ? {
                ...c,
                assistant: {
                  ...(c.assistant ?? {}),
                  ...editForm,
                  client_id: clientId,
                } as AssistantSettings,
              }
            : c,
        ),
      );
      setEditingClientId(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  async function toggleClientEnabled(item: ClientAssistant) {
    setLoading(true);
    try {
      const is_enabled = item.assistant?.is_enabled === false;
      await fetch(`/api/admin/clients/${item.client.id}/assistant`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_enabled }),
      });
      setClients((prev) =>
        prev.map((c) =>
          c.client.id === item.client.id
            ? { ...c, assistant: { ...(c.assistant ?? {}), is_enabled, client_id: item.client.id } as AssistantSettings }
            : c,
        ),
      );
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  function startEditConv(conv: ConversationRow) {
    setEditingConvId(conv.id);
    setConvStatus(conv.status);
  }

  async function saveConv(convId: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/chat-conversations/${convId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: convStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        setConvs((prev) =>
          prev.map((c) => (c.id === convId ? { ...c, ...(data.conversation ?? { status: convStatus }) } : c)),
        );
      }
      setEditingConvId(null);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function deleteConv(conv: ConversationRow) {
    if (!confirm("Delete this conversation and all its messages?")) return;
    setLoading(true);
    try {
      await fetch(`/api/admin/chat-conversations/${conv.id}`, { method: "DELETE" });
      setConvs((prev) => prev.filter((c) => c.id !== conv.id));
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function resolveConv(convId: string) {
    setLoading(true);
    try {
      await fetch(`/api/admin/chat-conversations/${convId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resolve" }),
      });
      setConvs((prev) => prev.map((c) => (c.id === convId ? { ...c, status: "resolved" } : c)));
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div>
        <h2 className="mb-4 text-lg font-semibold">Clients</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {clients.map(({ client, assistant }) => (
            <Card key={client.id}>
              {editingClientId === client.id ? (
                <div className="space-y-3">
                  <h3 className="font-semibold">{client.name}</h3>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={editForm.is_enabled}
                      onChange={(e) => setEditForm({ ...editForm, is_enabled: e.target.checked })}
                    />
                    Assistant enabled
                  </label>
                  <Textarea rows={2} value={editForm.greeting_message} onChange={(e) => setEditForm({ ...editForm, greeting_message: e.target.value })} placeholder="Greeting" />
                  <Textarea rows={2} value={editForm.fallback_message} onChange={(e) => setEditForm({ ...editForm, fallback_message: e.target.value })} placeholder="Fallback" />
                  <Input value={editForm.tone} onChange={(e) => setEditForm({ ...editForm, tone: e.target.value })} placeholder="Tone" />
                  <div className="flex gap-2">
                    <Button type="button" size="sm" disabled={loading} onClick={() => saveClientSettings(client.id)}>Save</Button>
                    <Button type="button" variant="secondary" size="sm" onClick={() => setEditingClientId(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-semibold">{client.name}</h3>
                    <Badge variant={assistant?.is_enabled !== false ? "success" : "warning"}>
                      {assistant?.is_enabled !== false ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <p className="mb-4 text-sm text-muted">/{client.slug}</p>
                  {assistant?.greeting_message ? (
                    <p className="mb-4 line-clamp-2 text-xs text-muted">{assistant.greeting_message}</p>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="secondary" size="sm" onClick={() => startEditClient({ client, assistant })}>Edit</Button>
                    <Button type="button" variant="secondary" size="sm" disabled={loading} onClick={() => toggleClientEnabled({ client, assistant })}>
                      {assistant?.is_enabled !== false ? "Disable" : "Enable"}
                    </Button>
                    <Link href={`/admin/clients/${client.id}/assistant`}>
                      <Button variant="secondary" size="sm" type="button">Full settings</Button>
                    </Link>
                    <Link href={`/admin/clients/${client.id}/faq`}>
                      <Button variant="secondary" size="sm" type="button">FAQ</Button>
                    </Link>
                    <Link href={`/admin/clients/${client.id}/chat-conversations`}>
                      <Button variant="secondary" size="sm" type="button">Conversations</Button>
                    </Link>
                    <Link href={`/embed/chat/${client.slug}`} target="_blank">
                      <Button variant="ghost" size="sm" type="button">Preview</Button>
                    </Link>
                  </div>
                </>
              )}
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">All Conversations ({convs.length})</h2>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-accent/50">
              <tr>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Handoff</th>
                <th className="px-4 py-3 font-medium">Lead</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {convs.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted">No conversations yet.</td></tr>
              ) : (
                convs.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-muted">{c.clients?.name ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs">{c.id.slice(0, 8)}…</td>
                    <td className="px-4 py-3">
                      {editingConvId === c.id ? (
                        <select
                          value={convStatus}
                          onChange={(e) => setConvStatus(e.target.value)}
                          className="rounded-lg border border-border px-2 py-1 text-sm"
                        >
                          <option value="active">active</option>
                          <option value="resolved">resolved</option>
                          <option value="archived">archived</option>
                        </select>
                      ) : (
                        <Badge>{c.status}</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">{c.handoff_requested ? "Yes" : "—"}</td>
                    <td className="px-4 py-3">
                      {c.lead_id ? (
                        <Link href={`/admin/leads/${c.lead_id}`} className="text-primary hover:underline">View</Link>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted">{formatDate(c.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {editingConvId === c.id ? (
                          <>
                            <Button type="button" size="sm" disabled={loading} onClick={() => saveConv(c.id)}>Save</Button>
                            <Button type="button" variant="secondary" size="sm" onClick={() => setEditingConvId(null)}>Cancel</Button>
                          </>
                        ) : (
                          <>
                            <Link href={`/admin/clients/${c.client_id}/chat-conversations/${c.id}`}>
                              <Button type="button" variant="secondary" size="sm">Open</Button>
                            </Link>
                            <Button type="button" variant="secondary" size="sm" onClick={() => startEditConv(c)}>Edit</Button>
                            {c.status !== "resolved" ? (
                              <Button type="button" variant="secondary" size="sm" onClick={() => resolveConv(c.id)}>Resolve</Button>
                            ) : null}
                            <Button type="button" variant="danger" size="sm" disabled={loading} onClick={() => deleteConv(c)}>Delete</Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
