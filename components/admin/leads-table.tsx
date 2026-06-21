"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import type { Lead } from "@/types";
import { LEAD_CATEGORIES } from "@/lib/constants";

interface LeadsTableProps {
  clientId: string;
  leads: Lead[];
}

function categoryVariant(category: string | null): "success" | "warning" | "default" | "danger" {
  if (category === "hot") return "danger";
  if (category === "warm") return "warning";
  return "default";
}

export function LeadsTable({ clientId, leads }: LeadsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category") ?? "";

  function filterBy(category: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (category) params.set("category", category);
    else params.delete("category");
    router.push(`/admin/clients/${clientId}/leads?${params.toString()}`);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        <Button
          type="button"
          variant={activeCategory === "" ? "primary" : "secondary"}
          size="sm"
          onClick={() => filterBy("")}
        >
          All
        </Button>
        {LEAD_CATEGORIES.map((cat) => (
          <Button
            key={cat}
            type="button"
            variant={activeCategory === cat ? "primary" : "secondary"}
            size="sm"
            onClick={() => filterBy(cat)}
          >
            {cat}
          </Button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-accent/50">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Score</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted">No leads yet.</td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{lead.name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted">
                    <div>{lead.email ?? "—"}</div>
                    <div className="text-xs">{lead.phone ?? ""}</div>
                  </td>
                  <td className="px-4 py-3">{lead.score}</td>
                  <td className="px-4 py-3">
                    <Badge variant={categoryVariant(lead.score_category)}>
                      {lead.score_category ?? "—"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{lead.status}</td>
                  <td className="px-4 py-3 text-muted">{formatDate(lead.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/leads/${lead.id}`} className="text-primary hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
