import { notFound } from "next/navigation";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/admin-header";
import { ServicesManager } from "@/components/admin/services-manager";
import { Button } from "@/components/ui/button";
import { catalogService } from "@/lib/services/catalog-service";
import { clientService } from "@/lib/services/client-service";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientServicesPage({ params }: PageProps) {
  const { id } = await params;
  const client = await clientService.getClientById(id).catch(() => null);
  if (!client) notFound();

  const services = await catalogService.listServices(id);

  return (
    <>
      <AdminHeader
        title={`Services — ${client.name}`}
        description="Manage service catalog used by assistant, content engine, and offers."
        actions={
          <div className="flex gap-2">
            <Link href={`/admin/clients/${id}/packages`}>
              <Button variant="secondary">Packages</Button>
            </Link>
            <Link href={`/admin/clients/${id}`}>
              <Button variant="secondary">Back</Button>
            </Link>
          </div>
        }
      />
      <ServicesManager clientId={id} initialServices={services} />
    </>
  );
}
