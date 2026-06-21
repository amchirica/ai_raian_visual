"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DEFAULT_FOLLOWUP_DELAYS, FOLLOWUP_CHANNELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { ScheduledFollowup } from "@/types";

interface FollowupManagerProps {
  clientId: string;
  leadId?: string;
  offerId?: string;
  scheduled: ScheduledFollowup[];
}

export function FollowupManager({ clientId, leadId, offerId, scheduled }: FollowupManagerProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customHours, setCustomHours] = useState(48);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editScheduledFor, setEditScheduledFor] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function createDefaultSequence() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/followups/create-sequence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          lead_id: leadId,
          offer_id: offerId,
          name: leadId ? "Lead follow-up sequence" : "Offer follow-up sequence",
          require_approval: true,
          steps: DEFAULT_FOLLOWUP_DELAYS.map((d, i) => ({
            delay_hours: d.hours,
            channel: i === 2 ? "whatsapp" : "email",
            name: d.label,
          })),
        }),
      });
      if (!res.ok) throw new Error("Failed to create sequence");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function createCustomStep() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/followups/create-sequence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          lead_id: leadId,
          offer_id: offerId,
          name: `Custom ${customHours}h reminder`,
          require_approval: true,
          steps: [{ delay_hours: customHours, channel: "email", name: `${customHours}h reminder` }],
        }),
      });
      if (!res.ok) throw new Error("Failed");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function generateMessage(scheduledId: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/followups/generate-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: clientId, scheduled_id: scheduledId }),
      });
      if (!res.ok) throw new Error("Generation failed");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  async function approve(scheduledId: string) {
    await fetch("/api/followups/mark-sent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduled_id: scheduledId, action: "approve" }),
    });
    router.refresh();
  }

  async function markSent(scheduledId: string) {
    await fetch("/api/followups/mark-sent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduled_id: scheduledId, action: "sent" }),
    });
    router.refresh();
  }

  function startEdit(s: ScheduledFollowup) {
    setEditingId(s.id);
    setEditBody(s.body);
    setEditSubject(s.subject ?? "");
    setEditScheduledFor(s.scheduled_for?.slice(0, 16) ?? "");
  }

  async function saveEdit(scheduledId: string) {
    setLoading(true);
    try {
      await fetch(`/api/followups/${scheduledId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: editSubject || null,
          body: editBody,
          scheduled_for: editScheduledFor ? new Date(editScheduledFor).toISOString() : undefined,
        }),
      });
      setEditingId(null);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function deleteFollowup(scheduledId: string) {
    if (!confirm("Delete this scheduled follow-up?")) return;
    await fetch(`/api/followups/${scheduledId}`, { method: "DELETE" });
    router.refresh();
  }

  async function copyText(s: ScheduledFollowup) {
    const text = [s.subject, s.body].filter(Boolean).join("\n\n");
    await navigator.clipboard.writeText(text);
    setCopiedId(s.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="mb-4 font-semibold">Create Follow-up Sequence</h3>
        <p className="mb-4 text-sm text-muted">
          MVP: follow-ups are drafts only — copy text and send manually from your email or WhatsApp app.
        </p>
        {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}
        <div className="flex flex-wrap gap-2">
          <Button type="button" disabled={loading} onClick={createDefaultSequence}>
            24h + 72h + 7-day sequence
          </Button>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={customHours}
              onChange={(e) => setCustomHours(Number(e.target.value))}
              className="w-20 rounded-lg border border-border px-2 py-1 text-sm"
            />
            <span className="text-sm text-muted">hours</span>
            <Button type="button" variant="secondary" disabled={loading} onClick={createCustomStep}>
              Custom delay
            </Button>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted">Channels: {FOLLOWUP_CHANNELS.join(", ")}</p>
      </Card>

      <Card>
        <h3 className="mb-4 font-semibold">Scheduled Follow-ups ({scheduled.length})</h3>
        <div className="space-y-3">
          {scheduled.length === 0 ? (
            <p className="text-sm text-muted">No scheduled follow-ups yet. Mark an offer as sent to auto-create, or use the button above.</p>
          ) : (
            scheduled.map((s) => (
              <div key={s.id} className="rounded-lg border border-border p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex gap-2">
                    <Badge>{s.channel}</Badge>
                    <Badge>{s.status}</Badge>
                  </div>
                  <span className="text-xs text-muted">{formatDate(s.scheduled_for)}</span>
                </div>
                {editingId === s.id ? (
                  <div className="space-y-2">
                    <input
                      value={editSubject}
                      onChange={(e) => setEditSubject(e.target.value)}
                      placeholder="Subject"
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                    />
                    <textarea
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      rows={6}
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                    />
                    <input
                      type="datetime-local"
                      value={editScheduledFor}
                      onChange={(e) => setEditScheduledFor(e.target.value)}
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                    />
                    <div className="flex gap-2">
                      <Button type="button" size="sm" disabled={loading} onClick={() => saveEdit(s.id)}>Save</Button>
                      <Button type="button" variant="secondary" size="sm" onClick={() => setEditingId(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {s.subject ? <p className="text-sm font-medium">{s.subject}</p> : null}
                    <p className="mt-1 whitespace-pre-wrap text-sm text-muted">{s.body}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button type="button" variant="secondary" size="sm" disabled={loading} onClick={() => generateMessage(s.id)}>
                        Generate AI text
                      </Button>
                      <Button type="button" variant="secondary" size="sm" onClick={() => startEdit(s)}>Edit</Button>
                      <Button type="button" variant="secondary" size="sm" onClick={() => copyText(s)}>
                        {copiedId === s.id ? "Copied!" : "Copy"}
                      </Button>
                      {s.status === "pending_approval" ? (
                        <Button type="button" variant="secondary" size="sm" onClick={() => approve(s.id)}>Approve</Button>
                      ) : null}
                      {s.status === "approved" ? (
                        <Button type="button" variant="secondary" size="sm" onClick={() => markSent(s.id)}>Mark sent</Button>
                      ) : null}
                      <Button type="button" variant="danger" size="sm" onClick={() => deleteFollowup(s.id)}>Delete</Button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
