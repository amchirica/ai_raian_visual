import { notFound } from "next/navigation";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/admin-header";
import { OfferTemplateForm } from "@/components/admin/offer-template-form";
import { Button } from "@/components/ui/button";
import { clientService } from "@/lib/services/client-service";
import { packageService } from "@/lib/services/package-service";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OfferTemplatePage({ params }: PageProps) {
  const { id } = await params;
  const client = await clientService.getClientById(id).catch(() => null);
  if (!client) notFound();

  const template = await packageService.getOfferTemplate(id);

  return (
    <>
      <AdminHeader
        title={`Offer Template — ${client.name}`}
        description="Configure email body template and default offer text."
        actions={
          <Link href={`/admin/clients/${id}/packages`}>
            <Button variant="secondary">Packages</Button>
          </Link>
        }
      />
      <OfferTemplateForm clientId={id} template={template} />
    </>
  );
}
