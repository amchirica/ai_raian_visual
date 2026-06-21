import { notFound } from "next/navigation";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/admin-header";
import { GenerateOfferForm } from "@/components/admin/generate-offer-form";
import { Button } from "@/components/ui/button";
import { clientService } from "@/lib/services/client-service";
import { leadService } from "@/lib/services/lead-service";
import { packageService } from "@/lib/services/package-service";

interface PageProps {
  params: Promise<{ leadId: string }>;
}

export default async function GenerateOfferPage({ params }: PageProps) {
  const { leadId } = await params;
  const lead = await leadService.getLeadById(leadId).catch(() => null);
  if (!lead) notFound();

  const client = await clientService.getClientById(lead.client_id).catch(() => null);
  if (!client) notFound();

  const [packages, extras, rules] = await Promise.all([
    packageService.listPackages(lead.client_id),
    packageService.listExtras(lead.client_id),
    packageService.listPricingRules(lead.client_id),
  ]);

  return (
    <>
      <AdminHeader
        title="Generate Offer"
        description={`Create a personalized offer for ${lead.name ?? lead.email}`}
        actions={
          <Link href={`/admin/leads/${leadId}`}>
            <Button variant="secondary">Back to Lead</Button>
          </Link>
        }
      />
      <GenerateOfferForm
        clientId={lead.client_id}
        lead={lead}
        packages={packages}
        extras={extras}
        pricingRules={rules}
      />
    </>
  );
}
