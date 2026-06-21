import { notFound } from "next/navigation";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/admin-header";
import { LeadDetailPanel } from "@/components/admin/lead-detail-panel";
import { Button } from "@/components/ui/button";
import { leadService } from "@/lib/services/lead-service";
import { clientService } from "@/lib/services/client-service";

interface PageProps {
  params: Promise<{ leadId: string }>;
}

export default async function LeadDetailPage({ params }: PageProps) {
  const { leadId } = await params;
  const lead = await leadService.getLeadById(leadId).catch(() => null);
  if (!lead) notFound();

  const client = await clientService.getClientById(lead.client_id).catch(() => null);

  return (
    <>
      <AdminHeader
        title={lead.name ?? lead.email ?? "Lead Details"}
        description={`Lead ID: ${lead.id}`}
        actions={
          client ? (
            <Link href={`/admin/clients/${client.id}/leads`}>
              <Button variant="secondary">Back to Leads</Button>
            </Link>
          ) : null
        }
      />
      <LeadDetailPanel lead={lead} client={client} />
    </>
  );
}
