"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormField, Input, Textarea } from "@/components/ui/input";
import { CONTENT_TYPE_LABELS } from "@/lib/constants";
import type { ContentType } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { GeneratedContent } from "@/types";

interface GeneratedContentDetailProps {
  content: GeneratedContent;
  clientName: string;
}

export function GeneratedContentDetail({ content, clientName }: GeneratedContentDetailProps) {
  const router = useRouter();
  const [title, setTitle] = useState(content.title ?? "");
  const [subject, setSubject] = useState(content.subject ?? "");
  const [body, setBody] = useState(content.body);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/content/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: content.id,
          client_id: content.client_id,
          content_type: content.content_type,
          title,
          subject,
          body,
          status: content.status,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      setMessage("Saved.");
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(status: string) {
    await fetch("/api/content/save", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: content.id, status }),
    });
    router.refresh();
  }

  async function deleteContent() {
    if (!confirm("Permanently delete this content?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/content/${content.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      router.push("/admin/content");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setLoading(false);
    }
  }

  async function copyBody() {
    await navigator.clipboard.writeText(body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const meta = content.metadata as Record<string, unknown> | undefined;
  const usedFallback = meta?.ai_fallback === true;

  return (
    <div className="space-y-6">
      <Card>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge>{CONTENT_TYPE_LABELS[content.content_type as ContentType] ?? content.content_type}</Badge>
          <Badge>{content.status}</Badge>
          <span className="text-sm text-muted">{clientName}</span>
          <span className="text-sm text-muted">{formatDate(content.created_at)}</span>
          {usedFallback ? <Badge variant="warning">Template fallback (no AI)</Badge> : null}
        </div>
        <div className="space-y-4">
          <FormField label="Title">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </FormField>
          {subject !== null ? (
            <FormField label="Subject">
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
            </FormField>
          ) : null}
          <FormField label="Body">
            <Textarea rows={16} value={body} onChange={(e) => setBody(e.target.value)} />
          </FormField>
        </div>
        {message ? <p className="mt-2 text-sm text-muted">{message}</p> : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" disabled={loading} onClick={save}>{loading ? "Saving..." : "Save"}</Button>
          <Button type="button" variant="secondary" onClick={copyBody}>{copied ? "Copied!" : "Copy body"}</Button>
          {content.status === "draft" ? (
            <Button type="button" variant="secondary" onClick={() => updateStatus("approved")}>Approve</Button>
          ) : null}
          {content.status === "approved" ? (
            <Button type="button" variant="secondary" onClick={() => updateStatus("sent")}>Mark used</Button>
          ) : null}
          {content.status !== "archived" ? (
            <Button type="button" variant="secondary" onClick={() => updateStatus("archived")}>Archive</Button>
          ) : null}
          <Button type="button" variant="danger" onClick={deleteContent}>Delete permanently</Button>
          {content.lead_id ? (
            <Link href={`/admin/leads/${content.lead_id}`}>
              <Button variant="secondary" type="button">View lead</Button>
            </Link>
          ) : null}
          {content.offer_id ? (
            <Link href={`/admin/offers/${content.offer_id}`}>
              <Button variant="secondary" type="button">View offer</Button>
            </Link>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
