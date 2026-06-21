import Link from "next/link";
import { AdminHeader } from "@/components/admin/admin-header";
import { LeadsListTable } from "@/components/admin/leads-list-table";
import { createAdminClient } from "@/lib/supabase/admin";
import { clientService } from "@/lib/services/client-service";
import type { Lead } from "@/types";

async function getRecentLeads(): Promise<(Lead & { client_name?: string })[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !data) return [];

  const leads = data as Lead[];
  const clients = await clientService.listClients().catch(() => []);
  const clientMap = new Map(clients.map((c) => [c.id, c.name]));

  return leads.map((lead) => ({
    ...lead,
    client_name: clientMap.get(lead.client_id) ?? "Unknown",
  }));
}

export default async function AllLeadsPage() {
  const leads = await getRecentLeads();

  return (
    <>
      <AdminHeader
        title="All Leads"
        description="Edit or delete leads inline. Open a lead for full detail, scoring, and offer generation."
      />

      {leads.length === 0 ? (
        <p className="text-sm text-muted">
          No leads yet. Leads appear here after form submissions.{" "}
          <Link href="/admin/clients" className="text-primary hover:underline">
            View clients
          </Link>
        </p>
      ) : (
        <LeadsListTable initialLeads={leads} />
      )}
    </>
  );
}
