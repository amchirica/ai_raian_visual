import { AdminHeader } from "@/components/admin/admin-header";
import { OffersListTable } from "@/components/admin/offers-list-table";
import { clientService } from "@/lib/services/client-service";
import { createAdminClient } from "@/lib/supabase/admin";
import { platformService } from "@/lib/services/platform-service";
import type { Lead } from "@/types";

interface PageProps {
  searchParams: Promise<{ client?: string }>;
}

async function getRecentLeads(): Promise<Lead[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("leads")
    .select("id, client_id, name, email, status")
    .order("created_at", { ascending: false })
    .limit(200);
  return (data ?? []) as Lead[];
}

export default async function OffersIndexPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const [clients, leads, allOffers] = await Promise.all([
    clientService.listClients(),
    getRecentLeads(),
    platformService.listAllOffers(100),
  ]);

  let offers = allOffers;
  if (params.client) {
    offers = offers.filter((o) => (o as { client_id: string }).client_id === params.client);
  }

  return (
    <>
      <AdminHeader
        title="Offers"
        description={`${offers.length} offers — create, edit, or delete.`}
      />
      <OffersListTable
        initialOffers={offers as Parameters<typeof OffersListTable>[0]["initialOffers"]}
        clients={clients}
        leads={leads}
      />
    </>
  );
}
