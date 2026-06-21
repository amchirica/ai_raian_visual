import Link from "next/link";
import { AdminHeader } from "@/components/admin/admin-header";
import { ContentGeneratorForm } from "@/components/admin/content-generator-form";
import { Button } from "@/components/ui/button";
import { clientService } from "@/lib/services/client-service";

interface PageProps {
  searchParams: Promise<{ client?: string; lead?: string; offer?: string }>;
}

export default async function ContentGeneratorPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const clients = await clientService.listClients();

  return (
    <>
      <AdminHeader
        title="Content Generator"
        description="Generate marketing content, follow-ups, ads, SEO, and social captions."
        actions={
          <div className="flex gap-2">
            <Link href="/admin/generated-content">
              <Button variant="secondary">All Generated Content</Button>
            </Link>
          </div>
        }
      />
      <ContentGeneratorForm
        clients={clients}
        initialClientId={params.client}
        initialLeadId={params.lead}
        initialOfferId={params.offer}
      />
    </>
  );
}
