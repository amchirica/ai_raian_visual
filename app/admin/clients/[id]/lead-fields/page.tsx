import { notFound } from "next/navigation";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/admin-header";
import { LeadFieldsManager } from "@/components/admin/lead-fields-manager";
import { Button } from "@/components/ui/button";
import { clientService } from "@/lib/services/client-service";
import { leadFieldService } from "@/lib/services/lead-field-service";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientLeadFieldsPage({ params }: PageProps) {
  const { id } = await params;
  const client = await clientService.getClientById(id).catch(() => null);
  if (!client) notFound();

  const fields = await leadFieldService.listFields(id, true);

  return (
    <>
      <AdminHeader
        title={`Lead Fields — ${client.name}`}
        description="Configure dynamic form fields for the embeddable lead capture widget."
        actions={
          <div className="flex gap-2">
            <Link href={`/admin/clients/${id}/leads`}>
              <Button variant="secondary">View Leads</Button>
            </Link>
            <Link href={`/embed/lead-form/${client.slug}`} target="_blank">
              <Button variant="secondary">Preview Form</Button>
            </Link>
          </div>
        }
      />
      <LeadFieldsManager clientId={id} initialFields={fields} />
    </>
  );
}
