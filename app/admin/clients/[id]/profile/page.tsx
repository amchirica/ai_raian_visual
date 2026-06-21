import { notFound } from "next/navigation";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/admin-header";
import { ClientConfigForm } from "@/components/admin/client-config-form";
import { Button } from "@/components/ui/button";
import { clientService } from "@/lib/services/client-service";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientProfilePage({ params }: PageProps) {
  const { id } = await params;
  const client = await clientService.getClientById(id).catch(() => null);
  if (!client) notFound();

  const profile = await clientService.getBusinessProfile(id);

  return (
    <>
      <AdminHeader
        title={`Business Profile — ${client.name}`}
        description="Company details, contact info, and branding used across offers and widgets."
        actions={
          <Link href={`/admin/clients/${id}`}>
            <Button variant="secondary">Back to Overview</Button>
          </Link>
        }
      />
      <ClientConfigForm client={client} profile={profile} />
    </>
  );
}
