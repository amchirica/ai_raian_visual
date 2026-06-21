"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { LEAD_STATUSES } from "@/lib/constants";
import type { Lead, Client } from "@/types";

interface LeadDetailPanelProps {
  lead: Lead;
  client: Client | null;
}

export function LeadDetailPanel({ lead, client }: LeadDetailPanelProps) {
  const router = useRouter();
  const [status, setStatus] = useState(lead.status);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formData = (lead.form_data ?? {}) as Record<string, unknown>;
  const breakdown = (lead.metadata as { scoring_breakdown?: Array<{ label: string; points: number; matched: boolean }> })
    ?.scoring_breakdown ?? [];

  async function updateStatus() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Update failed");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setLoading(false);
    }
  }

  async function archiveLead() {
    if (!confirm("Archive this lead?")) return;
    setLoading(true);
    try {
      await fetch(`/api/admin/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "archived" }),
      });
      setStatus("archived");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <h3 className="mb-4 font-semibold">Contact</h3>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-muted">Name</dt><dd className="font-medium">{lead.name ?? "—"}</dd></div>
            <div><dt className="text-muted">Email</dt><dd>{lead.email ?? "—"}</dd></div>
            <div><dt className="text-muted">Phone</dt><dd>{lead.phone ?? "—"}</dd></div>
            <div><dt className="text-muted">Company</dt><dd>{lead.company ?? "—"}</dd></div>
            <div><dt className="text-muted">Source</dt><dd>{lead.source ?? "—"}</dd></div>
            <div><dt className="text-muted">Created</dt><dd>{formatDate(lead.created_at)}</dd></div>
          </dl>
          {lead.message ? (
            <div className="mt-4">
              <p className="text-sm text-muted">Message</p>
              <p className="mt-1 text-sm">{lead.message}</p>
            </div>
          ) : null}
        </Card>

        <Card>
          <h3 className="mb-4 font-semibold">Form Data</h3>
          <dl className="space-y-2 text-sm">
            {Object.entries(formData).map(([key, value]) => (
              <div key={key} className="flex justify-between gap-4 border-b border-border pb-2">
                <dt className="text-muted">{key}</dt>
                <dd className="text-right font-medium">{Array.isArray(value) ? value.join(", ") : String(value)}</dd>
              </div>
            ))}
          </dl>
        </Card>

        {lead.ai_summary ? (
          <Card>
            <h3 className="mb-2 font-semibold">AI Summary</h3>
            <p className="text-sm">{lead.ai_summary}</p>
            {lead.ai_recommendation ? (
              <p className="mt-2 text-sm text-muted">{lead.ai_recommendation}</p>
            ) : null}
          </Card>
        ) : null}
      </div>

      <div className="space-y-6">
        <Card>
          <h3 className="mb-4 font-semibold">Scoring</h3>
          <div className="mb-4 flex items-center gap-3">
            <span className="text-3xl font-bold">{lead.score}</span>
            <Badge variant={lead.score_category === "hot" ? "danger" : lead.score_category === "warm" ? "warning" : "default"}>
              {lead.score_category ?? "unscored"}
            </Badge>
          </div>
          {lead.score_explanation ? (
            <p className="text-sm text-muted">{lead.score_explanation}</p>
          ) : null}
          {lead.recommended_action ? (
            <p className="mt-3 rounded-lg bg-accent p-3 text-sm">
              <strong>Next action:</strong> {lead.recommended_action}
            </p>
          ) : null}
          {breakdown.length > 0 ? (
            <ul className="mt-4 space-y-1 text-xs">
              {breakdown.map((item, i) => (
                <li key={i} className={item.matched ? "text-success" : "text-muted"}>
                  {item.matched ? "✓" : "○"} {item.label} (+{item.points})
                </li>
              ))}
            </ul>
          ) : null}
        </Card>

        <Card>
          <h3 className="mb-4 font-semibold">Status</h3>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mb-3 w-full rounded-lg border border-border px-3 py-2 text-sm"
          >
            {LEAD_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {error ? <p className="mb-2 text-sm text-danger">{error}</p> : null}
          <Button type="button" disabled={loading} onClick={updateStatus} className="w-full">
            {loading ? "Saving..." : "Update Status"}
          </Button>
          {status !== "archived" ? (
            <Button type="button" variant="danger" disabled={loading} onClick={archiveLead} className="mt-2 w-full">
              Archive Lead
            </Button>
          ) : null}
        </Card>

        {client ? (
          <Card>
            <h3 className="mb-2 font-semibold">Client</h3>
            <Link href={`/admin/clients/${client.id}`} className="text-sm text-primary hover:underline">
              {client.name}
            </Link>
            <div className="mt-3 space-y-1 text-xs">
              <Link href={`/admin/leads/${lead.id}/followups`} className="block text-primary hover:underline font-medium">
                Follow-ups →
              </Link>
              <Link href={`/admin/content-generator?client=${client.id}&lead=${lead.id}`} className="block text-primary hover:underline">
                Generate content
              </Link>
              <Link href={`/admin/leads/${lead.id}/generate-offer`} className="block text-primary hover:underline font-medium">
                Generate Offer →
              </Link>
              <Link href={`/admin/clients/${client.id}/leads`} className="block text-primary hover:underline">
                All leads
              </Link>
              <Link href={`/admin/clients/${client.id}/lead-fields`} className="block text-primary hover:underline">
                Form fields
              </Link>
              <Link href={`/embed/lead-form/${client.slug}`} target="_blank" className="block text-primary hover:underline">
                Preview embed
              </Link>
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
