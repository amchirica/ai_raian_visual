import Link from "next/link";
import { AdminHeader } from "@/components/admin/admin-header";
import { GeneratedContentList } from "@/components/admin/generated-content-list";
import { Button } from "@/components/ui/button";
import { clientService } from "@/lib/services/client-service";
import { contentService } from "@/lib/services/content-service";

interface PageProps {
  searchParams: Promise<{ client?: string; status?: string }>;
}

export default async function GeneratedContentPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const clients = await clientService.listClients();
  const clientsById = Object.fromEntries(clients.map((c) => [c.id, c.name]));

  const items = await contentService.listContent({
    clientId: params.client,
    status: params.status,
  });

  return (
    <>
      <AdminHeader
        title="Generated Content"
        description={`${items.length} items`}
        actions={
          <Link href="/admin/content-generator">
            <Button>New Content</Button>
          </Link>
        }
      />
      <GeneratedContentList items={items} showClient clientsById={clientsById} />
    </>
  );
}
