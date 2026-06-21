import { notFound } from "next/navigation";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/admin-header";
import { FaqManager } from "@/components/admin/faq-manager";
import { Button } from "@/components/ui/button";
import { clientService } from "@/lib/services/client-service";
import { assistantService } from "@/lib/services/assistant-service";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function FaqAdminPage({ params }: PageProps) {
  const { id } = await params;
  const client = await clientService.getClientById(id).catch(() => null);
  if (!client) notFound();

  const items = await assistantService.listFaqItems(id);

  return (
    <>
      <AdminHeader
        title={`FAQ — ${client.name}`}
        description="Knowledge base used by the AI assistant. Answers must be accurate."
        actions={
          <Link href={`/admin/clients/${id}/assistant`}>
            <Button variant="secondary">Assistant Settings</Button>
          </Link>
        }
      />
      <FaqManager clientId={id} initialItems={items} />
    </>
  );
}
