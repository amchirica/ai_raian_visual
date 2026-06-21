"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CONTENT_TYPE_LABELS } from "@/lib/constants";
import type { ContentType } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { GeneratedContent } from "@/types";

interface GeneratedContentListProps {
  items: GeneratedContent[];
  showClient?: boolean;
  clientsById?: Record<string, string>;
}

export function GeneratedContentList({ items, showClient, clientsById }: GeneratedContentListProps) {
  const router = useRouter();

  async function updateStatus(id: string, status: string) {
    await fetch("/api/content/save", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    router.refresh();
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border bg-accent/50">
          <tr>
            <th className="px-4 py-3 font-medium">Type</th>
            {showClient ? <th className="px-4 py-3 font-medium">Client</th> : null}
            <th className="px-4 py-3 font-medium">Title</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Created</th>
            <th className="px-4 py-3 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr><td colSpan={showClient ? 6 : 5} className="px-4 py-8 text-center text-muted">No content yet.</td></tr>
          ) : (
            items.map((item) => (
              <tr key={item.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">{CONTENT_TYPE_LABELS[item.content_type as ContentType] ?? item.content_type}</td>
                {showClient ? (
                  <td className="px-4 py-3">{clientsById?.[item.client_id] ?? item.client_id.slice(0, 8)}</td>
                ) : null}
                <td className="px-4 py-3 max-w-xs truncate">{item.title ?? item.subject ?? item.body.slice(0, 60)}</td>
                <td className="px-4 py-3"><Badge>{item.status}</Badge></td>
                <td className="px-4 py-3 text-muted">{formatDate(item.created_at)}</td>
                <td className="px-4 py-3 text-right space-x-1">
                  <Link href={`/admin/generated-content/${item.id}`} className="text-primary hover:underline text-xs">View</Link>
                  {item.lead_id ? (
                    <Link href={`/admin/leads/${item.lead_id}`} className="text-primary hover:underline text-xs">Lead</Link>
                  ) : null}
                  {item.status === "draft" ? (
                    <Button type="button" variant="secondary" size="sm" onClick={() => updateStatus(item.id, "approved")}>Approve</Button>
                  ) : null}
                  {item.status === "approved" ? (
                    <Button type="button" variant="secondary" size="sm" onClick={() => updateStatus(item.id, "sent")}>Sent</Button>
                  ) : null}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
