import { notFound } from "next/navigation";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/admin-header";
import { ContentSettingsForm } from "@/components/admin/content-settings-form";
import { Button } from "@/components/ui/button";
import { clientService } from "@/lib/services/client-service";
import { contentService } from "@/lib/services/content-service";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ContentSettingsPage({ params }: PageProps) {
  const { id } = await params;
  const client = await clientService.getClientById(id).catch(() => null);
  if (!client) notFound();

  const settings = await contentService.getSettings(id);

  return (
    <>
      <AdminHeader
        title={`Content Settings — ${client.name}`}
        description="Tone, industry, audience, and content rules for AI generation."
        actions={
          <div className="flex gap-2">
            <Link href={`/admin/content-generator?client=${id}`}>
              <Button variant="secondary">Content Generator</Button>
            </Link>
            <Link href={`/admin/generated-content?client=${id}`}>
              <Button variant="secondary">Generated Content</Button>
            </Link>
          </div>
        }
      />
      <ContentSettingsForm clientId={id} initial={settings} />
    </>
  );
}
