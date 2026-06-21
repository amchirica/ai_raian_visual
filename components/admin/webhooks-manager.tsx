"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormField, Input } from "@/components/ui/input";
import { WEBHOOK_EVENTS, type WebhookEvent } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { WebhookConfig } from "@/types";

interface WebhooksManagerProps {
  clientId: string;
  initialWebhooks: WebhookConfig[];
}

export function WebhooksManager({ clientId, initialWebhooks }: WebhooksManagerProps) {
  const router = useRouter();
  const [webhooks, setWebhooks] = useState(initialWebhooks);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    event_type: WEBHOOK_EVENTS[0] as WebhookEvent,
    target_url: "",
    secret_placeholder: "",
    is_active: true,
  });
  const [newWebhook, setNewWebhook] = useState({
    name: "",
    event_type: WEBHOOK_EVENTS[0] as WebhookEvent,
    target_url: "",
    secret_placeholder: "",
  });

  async function createWebhook() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/webhooks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newWebhook),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? data.error ?? "Failed");
      setWebhooks((prev) => [data, ...prev]);
      setNewWebhook({ name: "", event_type: WEBHOOK_EVENTS[0], target_url: "", secret_placeholder: "" });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create webhook");
    } finally {
      setLoading(false);
    }
  }

  function startEdit(webhook: WebhookConfig) {
    setEditingId(webhook.id);
    setEditForm({
      name: webhook.name,
      event_type: webhook.event_type as WebhookEvent,
      target_url: webhook.target_url,
      secret_placeholder: webhook.secret_placeholder ?? "",
      is_active: webhook.is_active,
    });
  }

  async function saveEdit(webhookId: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/webhooks/${webhookId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setWebhooks((prev) => prev.map((w) => (w.id === webhookId ? data : w)));
      setEditingId(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(webhook: WebhookConfig) {
    const res = await fetch(`/api/admin/clients/${clientId}/webhooks/${webhook.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !webhook.is_active }),
    });
    const data = await res.json();
    if (res.ok) setWebhooks((prev) => prev.map((w) => (w.id === webhook.id ? data : w)));
  }

  async function testWebhook(webhookId: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/webhooks/${webhookId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Test failed");
      router.refresh();
      setWebhooks((prev) =>
        prev.map((w) =>
          w.id === webhookId
            ? {
                ...w,
                last_status: data.success ? "success" : "error",
                last_triggered_at: new Date().toISOString(),
              }
            : w,
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Test failed");
    } finally {
      setLoading(false);
    }
  }

  async function deleteWebhook(webhookId: string) {
    if (!confirm("Delete this webhook?")) return;
    await fetch(`/api/admin/clients/${clientId}/webhooks/${webhookId}`, { method: "DELETE" });
    setWebhooks((prev) => prev.filter((w) => w.id !== webhookId));
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card className="border-amber-200 bg-amber-50 text-amber-900">
        <p className="text-sm">
          Webhooks fire on platform events. Legacy URLs in client settings and env vars (N8N_WEBHOOK_URL, etc.) still work as fallback.
          Delivery history beyond last status is post-MVP.
        </p>
      </Card>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Card>
        <h3 className="mb-4 font-semibold">Webhooks ({webhooks.length})</h3>
        <div className="space-y-3">
          {webhooks.length === 0 ? (
            <p className="text-sm text-muted">No webhooks configured. Add one below or use env fallback.</p>
          ) : (
            webhooks.map((webhook) => (
              <div key={webhook.id} className="rounded-lg border border-border p-4">
                {editingId === webhook.id ? (
                  <div className="space-y-3">
                    <FormField label="Name">
                      <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                    </FormField>
                    <FormField label="Event">
                      <select
                        value={editForm.event_type}
                        onChange={(e) => setEditForm({ ...editForm, event_type: e.target.value as WebhookEvent })}
                        className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                      >
                        {WEBHOOK_EVENTS.map((ev) => (
                          <option key={ev} value={ev}>{ev}</option>
                        ))}
                      </select>
                    </FormField>
                    <FormField label="Target URL">
                      <Input value={editForm.target_url} onChange={(e) => setEditForm({ ...editForm, target_url: e.target.value })} />
                    </FormField>
                    <FormField label="Secret placeholder">
                      <Input value={editForm.secret_placeholder} onChange={(e) => setEditForm({ ...editForm, secret_placeholder: e.target.value })} placeholder="For your reference only" />
                    </FormField>
                    <div className="flex gap-2">
                      <Button type="button" size="sm" disabled={loading} onClick={() => saveEdit(webhook.id)}>Save</Button>
                      <Button type="button" variant="secondary" size="sm" onClick={() => setEditingId(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium">{webhook.name}</p>
                        <p className="text-xs text-muted">{webhook.event_type}</p>
                        <p className="mt-1 break-all text-sm">{webhook.target_url}</p>
                        {webhook.secret_placeholder ? (
                          <p className="mt-1 text-xs text-muted">Secret ref: {webhook.secret_placeholder}</p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <Badge variant={webhook.is_active ? "success" : "warning"}>
                          {webhook.is_active ? "Active" : "Disabled"}
                        </Badge>
                        {webhook.last_status ? (
                          <span className="text-xs text-muted">
                            Last: {webhook.last_status}
                            {webhook.last_triggered_at ? ` · ${formatDate(webhook.last_triggered_at)}` : ""}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button type="button" variant="secondary" size="sm" onClick={() => startEdit(webhook)}>Edit</Button>
                      <Button type="button" variant="secondary" size="sm" onClick={() => toggleActive(webhook)}>
                        {webhook.is_active ? "Disable" : "Enable"}
                      </Button>
                      <Button type="button" variant="secondary" size="sm" disabled={loading} onClick={() => testWebhook(webhook.id)}>
                        Test
                      </Button>
                      <Button type="button" variant="danger" size="sm" onClick={() => deleteWebhook(webhook.id)}>Delete</Button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 font-semibold">Add Webhook</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Name">
            <Input value={newWebhook.name} onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })} placeholder="n8n lead sync" />
          </FormField>
          <FormField label="Event type">
            <select
              value={newWebhook.event_type}
              onChange={(e) => setNewWebhook({ ...newWebhook, event_type: e.target.value as WebhookEvent })}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm"
            >
              {WEBHOOK_EVENTS.map((ev) => (
                <option key={ev} value={ev}>{ev}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Target URL">
            <Input value={newWebhook.target_url} onChange={(e) => setNewWebhook({ ...newWebhook, target_url: e.target.value })} placeholder="https://..." />
          </FormField>
          <FormField label="Secret placeholder">
            <Input value={newWebhook.secret_placeholder} onChange={(e) => setNewWebhook({ ...newWebhook, secret_placeholder: e.target.value })} placeholder="Optional label for your secret" />
          </FormField>
        </div>
        <Button type="button" className="mt-4" disabled={loading || !newWebhook.name || !newWebhook.target_url} onClick={createWebhook}>
          Add Webhook
        </Button>
      </Card>
    </div>
  );
}
