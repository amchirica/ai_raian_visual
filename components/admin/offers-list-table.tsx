"use client";

import { useState, Fragment } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField, Input } from "@/components/ui/input";
import { OFFER_STATUSES } from "@/lib/constants";
import {
  contentsToTextareaValue,
  formatOfferContents,
  parseContentsTextarea,
} from "@/lib/offers/offer-contents";
import { formatDate } from "@/lib/utils";
import type { Client, Lead, OfferContentData } from "@/types";

type OfferItemRow = {
  id: string;
  name: string;
  description?: string | null;
  item_type: string;
  total_price?: number;
};

type OfferRow = {
  id: string;
  title: string;
  total_amount: number;
  currency: string;
  status: string;
  created_at: string;
  client_id: string;
  content_json?: unknown;
  text_summary?: string | null;
  clients?: { name: string; slug: string };
  offer_items?: OfferItemRow[];
};

interface OffersListTableProps {
  initialOffers: OfferRow[];
  clients: Client[];
  leads: Lead[];
}

function OfferContentsList({ offer, maxItems = 4 }: { offer: OfferRow; maxItems?: number }) {
  const lines = formatOfferContents({
    offer_items: offer.offer_items,
    content_json: offer.content_json,
    text_summary: offer.text_summary,
  });

  if (lines.length === 0) {
    return <span className="text-muted">—</span>;
  }

  const visible = lines.slice(0, maxItems);
  const remaining = lines.length - visible.length;

  return (
    <ul className="list-inside list-disc space-y-0.5 text-xs text-muted">
      {visible.map((line) => (
        <li key={line} className="leading-snug">
          {line}
        </li>
      ))}
      {remaining > 0 ? (
        <li className="list-none text-[11px] italic">+ încă {remaining}</li>
      ) : null}
    </ul>
  );
}

export function OffersListTable({ initialOffers, clients, leads }: OffersListTableProps) {
  const router = useRouter();
  const [offers, setOffers] = useState(initialOffers);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    status: "draft",
    total_amount: "",
    currency: "EUR",
    contents: "",
  });
  const [createForm, setCreateForm] = useState({
    client_id: clients[0]?.id ?? "",
    lead_id: "",
    title: "",
    total_amount: "",
    currency: "EUR",
    contents: "",
    mode: "draft" as "draft" | "generate",
  });

  const clientLeads = leads.filter((l) => l.client_id === createForm.client_id);

  function startEdit(offer: OfferRow) {
    const lines = formatOfferContents({
      offer_items: offer.offer_items,
      content_json: offer.content_json,
      text_summary: offer.text_summary,
    });
    setEditingId(offer.id);
    setEditForm({
      title: offer.title,
      status: offer.status,
      total_amount: String(offer.total_amount ?? ""),
      currency: offer.currency,
      contents: contentsToTextareaValue(lines),
    });
    setError(null);
  }

  async function saveEdit(offerId: string) {
    setLoading(true);
    setError(null);
    try {
      const contents = parseContentsTextarea(editForm.contents);
      const res = await fetch(`/api/offers/${offerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editForm.title,
          status: editForm.status,
          total_amount: Number(editForm.total_amount),
          currency: editForm.currency,
          contents,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : JSON.stringify(data.error) ?? "Failed to save");

      setOffers((prev) =>
        prev.map((o) => {
          if (o.id !== offerId) return o;
          const updated = data.offer as OfferRow;
          const contentJson = updated.content_json as OfferContentData | undefined;
          return {
            ...o,
            ...updated,
            content_json: contentJson ?? {
              ...(o.content_json as object),
              package_features: contents,
            },
            offer_items:
              contents.length > 0
                ? [
                    {
                      id: o.offer_items?.[0]?.id ?? "local",
                      name: editForm.title,
                      description: contents.join(" · "),
                      item_type: "package",
                      total_price: Number(editForm.total_amount),
                    },
                    ...(o.offer_items?.filter((item) => item.item_type !== "package") ?? []),
                  ]
                : o.offer_items,
          };
        }),
      );
      setEditingId(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  async function deleteOffer(offer: OfferRow) {
    if (!confirm(`Delete offer "${offer.title}"? This cannot be undone.`)) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/offers/${offer.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Failed to delete");
      setOffers((prev) => prev.filter((o) => o.id !== offer.id));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setLoading(false);
    }
  }

  async function createOffer() {
    setLoading(true);
    setError(null);
    try {
      const contents = parseContentsTextarea(createForm.contents);
      const body: Record<string, unknown> = {
        client_id: createForm.client_id,
        mode: createForm.mode,
        currency: createForm.currency,
      };
      if (createForm.lead_id) body.lead_id = createForm.lead_id;
      if (createForm.mode === "draft") {
        body.title = createForm.title;
        body.total_amount = Number(createForm.total_amount);
        if (contents.length) body.contents = contents;
      }

      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : JSON.stringify(data.error) ?? "Failed to create");

      setShowCreate(false);
      setCreateForm({
        client_id: clients[0]?.id ?? "",
        lead_id: "",
        title: "",
        total_amount: "",
        currency: "EUR",
        contents: "",
        mode: "draft",
      });
      router.push(`/admin/offers/${data.offer.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}

      <div className="mb-4">
        <Button type="button" onClick={() => setShowCreate((v) => !v)}>
          {showCreate ? "Cancel" : "New Offer"}
        </Button>
      </div>

      {showCreate ? (
        <Card className="mb-6">
          <h3 className="mb-4 font-semibold">Create Offer</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Client">
              <select
                value={createForm.client_id}
                onChange={(e) => setCreateForm({ ...createForm, client_id: e.target.value, lead_id: "" })}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Mode">
              <select
                value={createForm.mode}
                onChange={(e) => setCreateForm({ ...createForm, mode: e.target.value as "draft" | "generate" })}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              >
                <option value="draft">Manual draft (title + amount)</option>
                <option value="generate">Generate from lead (AI + package rules)</option>
              </select>
            </FormField>
            <FormField label="Lead (optional for draft, required for generate)">
              <select
                value={createForm.lead_id}
                onChange={(e) => setCreateForm({ ...createForm, lead_id: e.target.value })}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              >
                <option value="">— none —</option>
                {clientLeads.map((l) => (
                  <option key={l.id} value={l.id}>{l.name ?? l.email ?? l.id.slice(0, 8)}</option>
                ))}
              </select>
            </FormField>
            {createForm.mode === "draft" ? (
              <>
                <FormField label="Title">
                  <Input value={createForm.title} onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })} placeholder="Ofertă Essential" />
                </FormField>
                <FormField label="Amount">
                  <Input type="number" value={createForm.total_amount} onChange={(e) => setCreateForm({ ...createForm, total_amount: e.target.value })} />
                </FormField>
                <FormField label="Currency">
                  <Input value={createForm.currency} onChange={(e) => setCreateForm({ ...createForm, currency: e.target.value })} />
                </FormField>
                <div className="sm:col-span-2">
                  <FormField label="Ce conține oferta" htmlFor="create-contents" hint="Câte un element pe linie — apare în ofertă, PDF și email.">
                    <textarea
                      id="create-contents"
                      value={createForm.contents}
                      onChange={(e) => setCreateForm({ ...createForm, contents: e.target.value })}
                      placeholder={"8 ore acoperire foto + video\n350+ fotografii editate\nHighlight film 4–5 min"}
                      rows={5}
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                    />
                  </FormField>
                </div>
              </>
            ) : null}
          </div>
          <Button
            type="button"
            className="mt-4"
            disabled={loading || !createForm.client_id || (createForm.mode === "draft" ? !createForm.title || !createForm.total_amount : !createForm.lead_id)}
            onClick={createOffer}
          >
            {loading ? "Creating..." : "Create Offer"}
          </Button>
        </Card>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="border-b border-border bg-accent/50">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Client</th>
              <th className="min-w-[220px] px-4 py-3 font-medium">Contents</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {offers.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted">No offers yet.</td></tr>
            ) : (
              offers.map((offer) => (
                editingId === offer.id ? (
                  <Fragment key={offer.id}>
                    <tr className="border-b border-border">
                      <td className="px-4 py-3">
                        <Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
                      </td>
                      <td className="px-4 py-3 text-muted">{offer.clients?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-xs text-muted">Edit below</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Input type="number" value={editForm.total_amount} onChange={(e) => setEditForm({ ...editForm, total_amount: e.target.value })} className="w-24" />
                          <Input value={editForm.currency} onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })} className="w-16" />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={editForm.status}
                          onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                          className="w-full rounded-lg border border-border px-2 py-1 text-sm"
                        >
                          {OFFER_STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-muted">{formatDate(offer.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button type="button" size="sm" disabled={loading} onClick={() => saveEdit(offer.id)}>Save</Button>
                          <Button type="button" variant="secondary" size="sm" onClick={() => setEditingId(null)}>Cancel</Button>
                        </div>
                      </td>
                    </tr>
                    <tr className="border-b border-border bg-accent/20">
                      <td colSpan={7} className="px-4 py-3">
                        <FormField label="Ce conține oferta" htmlFor={`edit-contents-${offer.id}`}>
                          <textarea
                            id={`edit-contents-${offer.id}`}
                            value={editForm.contents}
                            onChange={(e) => setEditForm({ ...editForm, contents: e.target.value })}
                            rows={5}
                            className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                            placeholder="Câte un element pe linie"
                          />
                        </FormField>
                      </td>
                    </tr>
                  </Fragment>
                ) : (
                  <tr key={offer.id} className="border-b border-border last:border-0 align-top">
                    <td className="px-4 py-3 font-medium">{offer.title}</td>
                    <td className="px-4 py-3 text-muted">{offer.clients?.name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <OfferContentsList offer={offer} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{offer.total_amount} {offer.currency}</td>
                    <td className="px-4 py-3"><Badge>{offer.status}</Badge></td>
                    <td className="px-4 py-3 text-muted whitespace-nowrap">{formatDate(offer.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/offers/${offer.id}`}>
                          <Button type="button" variant="secondary" size="sm">Open</Button>
                        </Link>
                        <Button type="button" variant="secondary" size="sm" onClick={() => startEdit(offer)}>Edit</Button>
                        <Button type="button" variant="danger" size="sm" disabled={loading} onClick={() => deleteOffer(offer)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                )
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
