"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FOLLOWUP_CHANNELS, SCHEDULED_FOLLOWUP_STATUSES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

type FollowupRow = {
  id: string;
  client_id: string;
  channel: string;
  status: string;
  subject: string | null;
  body: string;
  scheduled_for: string;
  lead_id: string | null;
  offer_id: string | null;
  clients?: { name: string; slug: string };
};

interface FollowupsListTableProps {
  initialItems: FollowupRow[];
}

export function FollowupsListTable({ initialItems }: FollowupsListTableProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    subject: "",
    body: "",
    channel: "email",
    status: "scheduled",
    scheduled_for: "",
  });

  function startEdit(item: FollowupRow) {
    setEditingId(item.id);
    setEditForm({
      subject: item.subject ?? "",
      body: item.body ?? "",
      channel: item.channel,
      status: item.status,
      scheduled_for: item.scheduled_for?.slice(0, 16) ?? "",
    });
    setError(null);
  }

  async function saveEdit(id: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/followups/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: editForm.subject || null,
          body: editForm.body,
          channel: editForm.channel,
          status: editForm.status,
          scheduled_for: editForm.scheduled_for ? new Date(editForm.scheduled_for).toISOString() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...data.followup } : i)));
      setEditingId(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  async function quickAction(id: string, action: "approve" | "sent") {
    setLoading(true);
    try {
      const res = await fetch(`/api/followups/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        const data = await res.json();
        setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...data.followup } : i)));
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function copyText(item: FollowupRow) {
    await navigator.clipboard.writeText([item.subject, item.body].filter(Boolean).join("\n\n"));
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function deleteItem(item: FollowupRow) {
    if (!confirm("Delete this follow-up? This cannot be undone.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/followups/${item.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}
      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-muted">No follow-ups yet.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-xl border border-border bg-card p-4">
              {editingId === item.id ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <select
                      value={editForm.channel}
                      onChange={(e) => setEditForm({ ...editForm, channel: e.target.value })}
                      className="rounded-lg border border-border px-2 py-1 text-sm"
                    >
                      {FOLLOWUP_CHANNELS.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      className="rounded-lg border border-border px-2 py-1 text-sm"
                    >
                      {SCHEDULED_FOLLOWUP_STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <input
                      type="datetime-local"
                      value={editForm.scheduled_for}
                      onChange={(e) => setEditForm({ ...editForm, scheduled_for: e.target.value })}
                      className="rounded-lg border border-border px-2 py-1 text-sm"
                    />
                  </div>
                  <Input value={editForm.subject} onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })} placeholder="Subject" />
                  <textarea
                    value={editForm.body}
                    onChange={(e) => setEditForm({ ...editForm, body: e.target.value })}
                    rows={5}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                  />
                  <div className="flex gap-2">
                    <Button type="button" size="sm" disabled={loading} onClick={() => saveEdit(item.id)}>Save</Button>
                    <Button type="button" variant="secondary" size="sm" onClick={() => setEditingId(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <div className="flex flex-wrap gap-2">
                      <Badge>{item.channel}</Badge>
                      <Badge>{item.status}</Badge>
                      <span className="text-sm text-muted">{item.clients?.name}</span>
                    </div>
                    <span className="shrink-0 text-xs text-muted">{formatDate(item.scheduled_for)}</span>
                  </div>
                  {item.subject ? <p className="text-sm font-medium">{item.subject}</p> : null}
                  <p className="mt-1 whitespace-pre-wrap text-sm text-muted">{item.body}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button type="button" variant="secondary" size="sm" onClick={() => startEdit(item)}>Edit</Button>
                    <Button type="button" variant="secondary" size="sm" onClick={() => copyText(item)}>
                      {copiedId === item.id ? "Copied!" : "Copy"}
                    </Button>
                    {item.status === "pending_approval" ? (
                      <Button type="button" variant="secondary" size="sm" onClick={() => quickAction(item.id, "approve")}>Approve</Button>
                    ) : null}
                    {item.status === "approved" ? (
                      <Button type="button" variant="secondary" size="sm" onClick={() => quickAction(item.id, "sent")}>Mark sent</Button>
                    ) : null}
                    {item.lead_id ? (
                      <Link href={`/admin/leads/${item.lead_id}/followups`}>
                        <Button type="button" variant="secondary" size="sm">Lead</Button>
                      </Link>
                    ) : null}
                    {item.offer_id ? (
                      <Link href={`/admin/offers/${item.offer_id}/followups`}>
                        <Button type="button" variant="secondary" size="sm">Offer</Button>
                      </Link>
                    ) : null}
                    <Button type="button" variant="danger" size="sm" disabled={loading} onClick={() => deleteItem(item)}>Delete</Button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
