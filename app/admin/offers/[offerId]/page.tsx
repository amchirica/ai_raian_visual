import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/admin-header";
import { OfferDetailPanel } from "@/components/admin/offer-detail-panel";
import { offerService } from "@/lib/services/offer-service";
import { clientService } from "@/lib/services/client-service";

interface PageProps {
  params: Promise<{ offerId: string }>;
}

export default async function OfferDetailPage({ params }: PageProps) {
  const { offerId } = await params;
  const offer = await offerService.getOffer(offerId).catch(() => null);
  if (!offer) notFound();

  const client = await clientService.getClientById(offer.client_id).catch(() => null);

  return (
    <>
      <AdminHeader
        title={offer.title}
        description={`${offer.offer_number ?? offer.id} · ${offer.status}`}
      />
      <OfferDetailPanel offer={offer} client={client} />
    </>
  );
}
