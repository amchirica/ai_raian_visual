import { notFound } from "next/navigation";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/admin-header";
import { FollowupManager } from "@/components/admin/followup-manager";
import { Button } from "@/components/ui/button";
import { leadService } from "@/lib/services/lead-service";
import { clientService } from "@/lib/services/client-service";
import { followupService } from "@/lib/services/followup-service";

interface PageProps {
  params: Promise<{ leadId: string }>;
}

export default async function LeadFollowupsPage({ params }: PageProps) {
  const { leadId } = await params;
  const lead = await leadService.getLeadById(leadId).catch(() => null);
  if (!lead) notFound();

  const client = await clientService.getClientById(lead.client_id).catch(() => null);
  const scheduled = await followupService.listScheduled({ leadId });

  return (
    <>
      <AdminHeader
        title={`Follow-ups — ${lead.name ?? lead.email ?? "Lead"}`}
        description={client?.name ?? lead.client_id}
        actions={
          <div className="flex gap-2">
            <Link href={`/admin/leads/${leadId}`}>
              <Button variant="secondary">Lead Details</Button>
            </Link>
            <Link href={`/admin/content-generator?client=${lead.client_id}&lead=${leadId}`}>
              <Button variant="secondary">Generate Content</Button>
            </Link>
          </div>
        }
      />
      <FollowupManager clientId={lead.client_id} leadId={leadId} scheduled={scheduled} />
    </>
  );
}
