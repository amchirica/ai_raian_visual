"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormField, Input, Textarea } from "@/components/ui/input";
import { CONTENT_TYPE_LABELS, CONTENT_TYPES } from "@/lib/constants";
import { pickOptionalUuid } from "@/lib/validation/uuid";
import type { Client, GeneratedContent } from "@/types";

interface ContentGeneratorFormProps {
  clients: Client[];
  initialClientId?: string;
  initialLeadId?: string;
  initialOfferId?: string;
}

export function ContentGeneratorForm({
  clients,
  initialClientId,
  initialLeadId,
  initialOfferId,
}: ContentGeneratorFormProps) {
  const [clientId, setClientId] = useState(
    pickOptionalUuid(initialClientId) ?? clients[0]?.id ?? "",
  );
  const [contentType, setContentType] = useState<string>(CONTENT_TYPES[0]);
  const [context, setContext] = useState("");
  const [extraInstructions, setExtraInstructions] = useState("");
  const [leadId, setLeadId] = useState(pickOptionalUuid(initialLeadId) ?? "");
  const [offerId, setOfferId] = useState(pickOptionalUuid(initialOfferId) ?? "");
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function generate() {
    if (!clientId) return;
    setLoading(true);
    setNotice(null);
    try {
      const payload: Record<string, unknown> = {
        client_id: clientId,
        content_type: contentType,
        context,
      };
      if (extraInstructions.trim()) payload.extra_instructions = extraInstructions;
      const lead = pickOptionalUuid(leadId);
      const offer = pickOptionalUuid(offerId);
      if (lead) payload.lead_id = lead;
      if (offer) payload.offer_id = offer;

      const res = await fetch("/api/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Generation failed");
      setContent(data.content);
      setTitle(data.content.title ?? "");
      setSubject(data.content.subject ?? "");
      setBody(data.content.body);
      const meta = (data.content.metadata ?? {}) as { ai_fallback?: boolean; ai_error?: string };
      if (meta.ai_fallback) {
        setNotice(
          meta.ai_error?.includes("429") || meta.ai_error?.toLowerCase().includes("quota")
            ? "OpenAI quota exceeded — a local draft was generated. Edit it below, then save."
            : "AI unavailable — a local draft was generated. Edit it below, then save.",
        );
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  async function saveDraft() {
    if (!clientId || !body) return;
    setLoading(true);
    try {
      const res = await fetch("/api/content/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: content?.id,
          client_id: clientId,
          content_type: contentType,
          title: title || null,
          subject: subject || null,
          body,
          status: "draft",
          lead_id: pickOptionalUuid(leadId) ?? null,
          offer_id: pickOptionalUuid(offerId) ?? null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error("Save failed");
      setContent(data.content);
    } finally {
      setLoading(false);
    }
  }

  async function approve() {
    if (!content?.id) return;
    setLoading(true);
    try {
      const res = await fetch("/api/content/save", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: content.id, status: "approved" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error("Approve failed");
      setContent(data.content);
    } finally {
      setLoading(false);
    }
  }

  async function markSent() {
    if (!content?.id) return;
    setLoading(true);
    try {
      const res = await fetch("/api/content/save", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: content.id, status: "sent" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error("Update failed");
      setContent(data.content);
    } finally {
      setLoading(false);
    }
  }

  function copyContent() {
    const text = [subject ? `Subject: ${subject}` : null, body].filter(Boolean).join("\n\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <h3 className="mb-4 font-semibold">Generate Content</h3>
        <div className="space-y-4">
          <FormField label="Client">
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Content type">
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm"
            >
              {CONTENT_TYPES.map((t) => (
                <option key={t} value={t}>{CONTENT_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Context / brief">
            <Textarea rows={4} value={context} onChange={(e) => setContext(e.target.value)} placeholder="Describe what you need..." />
          </FormField>
          <FormField label="Extra instructions">
            <Textarea rows={2} value={extraInstructions} onChange={(e) => setExtraInstructions(e.target.value)} />
          </FormField>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Lead ID (optional)">
              <Input
                value={leadId}
                onChange={(e) => setLeadId(e.target.value)}
                placeholder="Leave empty unless linking to a lead"
              />
            </FormField>
            <FormField label="Offer ID (optional)">
              <Input
                value={offerId}
                onChange={(e) => setOfferId(e.target.value)}
                placeholder="Leave empty unless linking to an offer"
              />
            </FormField>
          </div>
          {(leadId && !pickOptionalUuid(leadId)) || (offerId && !pickOptionalUuid(offerId)) ? (
            <p className="text-xs text-amber-600">
              Invalid ID format — leave blank or paste a full UUID. It will be ignored on generate.
            </p>
          ) : null}
          <Button type="button" disabled={loading || !clientId} onClick={generate}>
            {loading ? "Generating..." : "Generate"}
          </Button>
          {notice ? (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{notice}</p>
          ) : null}
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold">Preview & Edit</h3>
          {content ? <Badge>{content.status}</Badge> : null}
        </div>
        {!body ? (
          <p className="text-sm text-muted">Generated content will appear here for editing.</p>
        ) : (
          <div className="space-y-4">
            <FormField label="Title">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </FormField>
            {(contentType === "follow_up_email" || subject) ? (
              <FormField label="Subject">
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
              </FormField>
            ) : null}
            <FormField label="Body">
              <Textarea rows={14} value={body} onChange={(e) => setBody(e.target.value)} />
            </FormField>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" disabled={loading} onClick={saveDraft}>Save draft</Button>
              <Button type="button" variant="secondary" disabled={loading || !content?.id} onClick={approve}>Approve</Button>
              <Button type="button" variant="secondary" disabled={loading || !content?.id} onClick={markSent}>Mark sent</Button>
              <Button type="button" variant="ghost" onClick={copyContent}>{copied ? "Copied!" : "Copy"}</Button>
            </div>
            <p className="text-xs text-muted">MVP: content is never sent automatically. Mark as sent after manual delivery.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
