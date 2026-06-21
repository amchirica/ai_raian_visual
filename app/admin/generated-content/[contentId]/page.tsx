import { notFound } from "next/navigation";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/admin-header";
import { GeneratedContentDetail } from "@/components/admin/generated-content-detail";
import { Button } from "@/components/ui/button";
import { clientService } from "@/lib/services/client-service";
import { contentService } from "@/lib/services/content-service";

interface PageProps {
  params: Promise<{ contentId: string }>;
}

export default async function GeneratedContentDetailPage({ params }: PageProps) {
  const { contentId } = await params;
  const content = await contentService.getContentById(contentId);
  if (!content) notFound();

  const client = await clientService.getClientById(content.client_id).catch(() => null);

  return (
    <>
      <AdminHeader
        title={content.title ?? "Generated Content"}
        description={client?.name ?? content.client_id}
        actions={
          <Link href="/admin/generated-content">
            <Button variant="secondary">Back to Library</Button>
          </Link>
        }
      />
      <GeneratedContentDetail content={content} clientName={client?.name ?? "Client"} />
    </>
  );
}
