"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { Offer, OfferItem, Client } from "@/types";

interface OfferDetailPanelProps {
  offer: Offer & { items?: OfferItem[] };
  client: Client | null;
}

export function OfferDetailPanel({ offer, client }: OfferDetailPanelProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function action(type: "sent" | "duplicate" | "regenerate") {
    setLoading(type);
    try {
      if (type === "sent") {
        await fetch(`/api/offers/${offer.id}/mark-sent`, { method: "POST" });
        router.refresh();
      } else if (type === "duplicate") {
        const res = await fetch(`/api/offers/${offer.id}/actions`, { method: "POST" });
        const data = await res.json();
        if (res.ok) router.push(`/admin/offers/${data.offer.id}`);
      } else {
        const res = await fetch(`/api/offers/${offer.id}/actions`, { method: "PATCH" });
        const data = await res.json();
        if (res.ok) router.push(`/admin/offers/${data.offer.id}`);
      }
    } finally {
      setLoading(null);
    }
  }

  async function archiveOffer() {
    if (!confirm("Archive this offer?")) return;
    setLoading("archive");
    try {
      await fetch(`/api/offers/${offer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "archived" }),
      });
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">{offer.title}</h2>
              <p className="text-sm text-muted">{offer.offer_number} · {formatDate(offer.created_at)}</p>
            </div>
            <Badge variant={offer.status === "sent" ? "success" : "default"}>{offer.status}</Badge>
          </div>
          <p className="text-3xl font-bold text-primary">
            {offer.total_amount} {offer.currency}
          </p>
          {offer.text_summary ? <p className="mt-2 text-sm text-muted">{offer.text_summary}</p> : null}
        </Card>

        <Card>
          <h3 className="mb-3 font-semibold">HTML Preview</h3>
          <div className="overflow-hidden rounded-lg border border-border">
            <iframe
              srcDoc={offer.content_html ?? ""}
              className="h-[600px] w-full"
              title="Offer preview"
            />
          </div>
        </Card>

        {offer.email_body ? (
          <Card>
            <h3 className="mb-3 font-semibold">Email Body</h3>
            <pre className="whitespace-pre-wrap text-sm text-muted">{offer.email_body}</pre>
          </Card>
        ) : null}
      </div>

      <div className="space-y-4">
        <Card>
          <h3 className="mb-3 font-semibold">Line Items</h3>
          <ul className="space-y-2 text-sm">
            {offer.items?.map((item) => (
              <li key={item.id}>
                <div className="flex justify-between gap-2">
                  <span className="font-medium">
                    {item.name} {item.item_type === "extra" ? "(extra)" : ""}
                  </span>
                  <span className="shrink-0">{item.total_price} {offer.currency}</span>
                </div>
                {item.description ? (
                  <p className="mt-0.5 text-xs text-muted">{item.description}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </Card>

        {(() => {
          const features = (offer.content_json as { package_features?: string[] } | null)?.package_features ?? [];
          if (!features.length) return null;
          return (
            <Card>
              <h3 className="mb-3 font-semibold">Included</h3>
              <ul className="list-inside list-disc space-y-1 text-sm text-muted">
                {features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </Card>
          );
        })()}

        <Card className="space-y-2">
          <Button type="button" className="w-full" onClick={() => window.open(`/api/offers/${offer.id}/pdf`, "_blank")}>
            Download PDF
          </Button>
          <Link href={`/admin/offers/${offer.id}/followups`}>
            <Button type="button" variant="secondary" className="w-full">Follow-ups</Button>
          </Link>
          <Link href={`/admin/content-generator?client=${offer.client_id}&offer=${offer.id}`}>
            <Button type="button" variant="secondary" className="w-full">Generate Content</Button>
          </Link>
          <Button type="button" variant="secondary" className="w-full" disabled={loading === "sent"} onClick={() => action("sent")}>
            {loading === "sent" ? "..." : "Mark as Sent"}
          </Button>
          <Button type="button" variant="secondary" className="w-full" disabled={loading === "duplicate"} onClick={() => action("duplicate")}>
            Duplicate Offer
          </Button>
          <Button type="button" variant="secondary" className="w-full" disabled={loading === "regenerate"} onClick={() => action("regenerate")}>
            Regenerate Wording (AI)
          </Button>
          {offer.status !== "archived" ? (
            <Button type="button" variant="danger" className="w-full" disabled={loading === "archive"} onClick={archiveOffer}>
              Archive Offer
            </Button>
          ) : null}
        </Card>

        {client && offer.lead_id ? (
          <Card>
            <Link href={`/admin/leads/${offer.lead_id}`} className="text-sm text-primary hover:underline">View Lead</Link>
            <br />
            <Link href={`/admin/clients/${client.id}/packages`} className="text-sm text-primary hover:underline">Manage Packages</Link>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
