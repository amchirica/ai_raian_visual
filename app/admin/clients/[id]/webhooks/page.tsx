import { notFound } from "next/navigation";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/admin-header";
import { WebhooksManager } from "@/components/admin/webhooks-manager";
import { Button } from "@/components/ui/button";
import { clientService } from "@/lib/services/client-service";
import { webhookConfigService } from "@/lib/services/webhook-config-service";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientWebhooksPage({ params }: PageProps) {
  const { id } = await params;
  const client = await clientService.getClientById(id).catch(() => null);
  if (!client) notFound();

  const webhooks = await webhookConfigService.listWebhooks(id).catch(() => []);

  return (
    <>
      <AdminHeader
        title={`Webhooks — ${client.name}`}
        description="Configure outbound webhooks per event. Falls back to client settings and env vars if table is empty."
        actions={
          <Link href={`/admin/clients/${id}`}>
            <Button variant="secondary">Back</Button>
          </Link>
        }
      />
      <WebhooksManager clientId={id} initialWebhooks={webhooks} />
    </>
  );
}
