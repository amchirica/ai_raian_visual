"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LEAD_STATUSES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { Lead } from "@/types";

type LeadRow = Lead & { client_name?: string };

interface LeadsListTableProps {
  initialLeads: LeadRow[];
}

export function LeadsListTable({ initialLeads }: LeadsListTableProps) {
  const router = useRouter();
  const [leads, setLeads] = useState(initialLeads);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "", status: "new" });

  function startEdit(lead: LeadRow) {
    setEditingId(lead.id);
    setEditForm({
      name: lead.name ?? "",
      email: lead.email ?? "",
      phone: lead.phone ?? "",
      status: lead.status,
    });
    setError(null);
  }

  async function saveEdit(leadId: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name || undefined,
          email: editForm.email || undefined,
          phone: editForm.phone || undefined,
          status: editForm.status,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, ...data.lead } : l)),
      );
      setEditingId(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  async function deleteLead(lead: LeadRow) {
    const label = lead.name ?? lead.email ?? lead.id.slice(0, 8);
    if (!confirm(`Delete lead "${label}"? This cannot be undone.`)) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/leads/${lead.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to delete");
      setLeads((prev) => prev.filter((l) => l.id !== lead.id));
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
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-accent/50">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Client</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Score</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-b border-border last:border-0">
                {editingId === lead.id ? (
                  <>
                    <td className="px-4 py-3">
                      <div className="space-y-2">
                        <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="Name" />
                        <Input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} placeholder="Email" />
                        <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} placeholder="Phone" />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted">{lead.client_name}</td>
                    <td className="px-4 py-3">
                      <select
                        value={editForm.status}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                        className="w-full rounded-lg border border-border px-2 py-1 text-sm"
                      >
                        {LEAD_STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">{lead.score}</td>
                    <td className="px-4 py-3">
                      <Badge variant={lead.score_category === "hot" ? "danger" : lead.score_category === "warm" ? "warning" : "default"}>
                        {lead.score_category ?? "—"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted">{formatDate(lead.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button type="button" size="sm" disabled={loading} onClick={() => saveEdit(lead.id)}>Save</Button>
                        <Button type="button" variant="secondary" size="sm" onClick={() => setEditingId(null)}>Cancel</Button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3 font-medium">{lead.name ?? lead.email ?? "—"}</td>
                    <td className="px-4 py-3 text-muted">{lead.client_name}</td>
                    <td className="px-4 py-3 text-muted">{lead.status}</td>
                    <td className="px-4 py-3">{lead.score}</td>
                    <td className="px-4 py-3">
                      <Badge variant={lead.score_category === "hot" ? "danger" : lead.score_category === "warm" ? "warning" : "default"}>
                        {lead.score_category ?? "—"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted">{formatDate(lead.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/leads/${lead.id}`}>
                          <Button type="button" variant="secondary" size="sm">Open</Button>
                        </Link>
                        <Button type="button" variant="secondary" size="sm" onClick={() => startEdit(lead)}>Edit</Button>
                        <Button type="button" variant="danger" size="sm" disabled={loading} onClick={() => deleteLead(lead)}>Delete</Button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
