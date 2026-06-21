import { notFound } from "next/navigation";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/admin-header";
import { FollowupManager } from "@/components/admin/followup-manager";
import { Button } from "@/components/ui/button";
import { offerService } from "@/lib/services/offer-service";
import { clientService } from "@/lib/services/client-service";
import { followupService } from "@/lib/services/followup-service";

interface PageProps {
  params: Promise<{ offerId: string }>;
}

export default async function OfferFollowupsPage({ params }: PageProps) {
  const { offerId } = await params;
  const offer = await offerService.getOffer(offerId).catch(() => null);
  if (!offer) notFound();

  const client = await clientService.getClientById(offer.client_id).catch(() => null);
  const scheduled = await followupService.listScheduled({ offerId });

  return (
    <>
      <AdminHeader
        title={`Follow-ups — ${offer.title}`}
        description={client?.name ?? offer.client_id}
        actions={
          <div className="flex gap-2">
            <Link href={`/admin/offers/${offerId}`}>
              <Button variant="secondary">Offer Details</Button>
            </Link>
            <Link href={`/admin/content-generator?client=${offer.client_id}&offer=${offerId}`}>
              <Button variant="secondary">Generate Content</Button>
            </Link>
          </div>
        }
      />
      <FollowupManager
        clientId={offer.client_id}
        leadId={offer.lead_id ?? undefined}
        offerId={offerId}
        scheduled={scheduled}
      />
    </>
  );
}
