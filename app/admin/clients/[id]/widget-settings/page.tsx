import { notFound } from "next/navigation";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/admin-header";
import { WidgetSettingsForm } from "@/components/admin/widget-settings-form";
import { Button } from "@/components/ui/button";
import { clientService } from "@/lib/services/client-service";
import { widgetSettingsService } from "@/lib/services/widget-settings-service";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientWidgetSettingsPage({ params }: PageProps) {
  const { id } = await params;
  const client = await clientService.getClientById(id).catch(() => null);
  if (!client) notFound();

  const widgets = await widgetSettingsService.listByClient(id);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <>
      <AdminHeader
        title={`Widget Settings — ${client.name}`}
        description="Configure embeddable lead form and chat widget appearance."
        actions={
          <div className="flex gap-2">
            <Link href={`/admin/clients/${id}/lead-fields`}>
              <Button variant="secondary">Lead Fields</Button>
            </Link>
            <Link href={`/admin/clients/${id}/assistant`}>
              <Button variant="secondary">Assistant</Button>
            </Link>
            <Link href={`/admin/clients/${id}`}>
              <Button variant="secondary">Back</Button>
            </Link>
          </div>
        }
      />
      <WidgetSettingsForm client={client} widgets={widgets} baseUrl={baseUrl} />
    </>
  );
}
