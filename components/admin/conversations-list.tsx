"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import type { ChatConversation } from "@/types";

interface ConversationsListProps {
  clientId: string;
  conversations: ChatConversation[];
}

export function ConversationsList({ clientId, conversations }: ConversationsListProps) {
  const router = useRouter();
  const [items, setItems] = useState(conversations);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState("active");
  const [loading, setLoading] = useState(false);

  async function resolve(id: string) {
    setLoading(true);
    try {
      await fetch(`/api/admin/chat-conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resolve" }),
      });
      setItems((prev) => prev.map((c) => (c.id === id ? { ...c, status: "resolved" } : c)));
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function saveStatus(id: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/chat-conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setItems((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
      }
      setEditingId(null);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function deleteConv(id: string) {
    if (!confirm("Delete this conversation and all messages?")) return;
    setLoading(true);
    try {
      await fetch(`/api/admin/chat-conversations/${id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((c) => c.id !== id));
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border bg-accent/50">
          <tr>
            <th className="px-4 py-3 font-medium">ID</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Handoff</th>
            <th className="px-4 py-3 font-medium">Lead</th>
            <th className="px-4 py-3 font-medium">Created</th>
            <th className="px-4 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr><td colSpan={6} className="px-4 py-8 text-center text-muted">No conversations yet.</td></tr>
          ) : (
            items.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-mono text-xs">{c.id.slice(0, 8)}...</td>
                <td className="px-4 py-3">
                  {editingId === c.id ? (
                    <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-border px-2 py-1 text-sm">
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
                    {editingId === c.id ? (
                      <>
                        <Button type="button" size="sm" disabled={loading} onClick={() => saveStatus(c.id)}>Save</Button>
                        <Button type="button" variant="secondary" size="sm" onClick={() => setEditingId(null)}>Cancel</Button>
                      </>
                    ) : (
                      <>
                        <Link href={`/admin/clients/${clientId}/chat-conversations/${c.id}`}>
                          <Button type="button" variant="secondary" size="sm">View</Button>
                        </Link>
                        <Button type="button" variant="secondary" size="sm" onClick={() => { setEditingId(c.id); setStatus(c.status); }}>Edit</Button>
                        {c.status !== "resolved" ? (
                          <Button type="button" variant="secondary" size="sm" disabled={loading} onClick={() => resolve(c.id)}>Resolve</Button>
                        ) : null}
                        <Button type="button" variant="danger" size="sm" disabled={loading} onClick={() => deleteConv(c.id)}>Delete</Button>
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
  );
}
