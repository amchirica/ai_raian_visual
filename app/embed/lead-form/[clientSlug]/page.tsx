import { notFound } from "next/navigation";
import { DynamicLeadForm } from "@/components/embed/dynamic-lead-form";
import { leadService } from "@/lib/services/lead-service";

interface PageProps {
  params: Promise<{ clientSlug: string }>;
}

export default async function LeadFormEmbedPage({ params }: PageProps) {
  const { clientSlug } = await params;
  const config = await leadService.getLeadFormConfig(clientSlug);
  if (!config) notFound();

  return (
    <div className="min-h-screen bg-transparent p-4">
      <DynamicLeadForm
        clientSlug={clientSlug}
        primaryColor={config.theme.primaryColor}
        submitLabel={config.config.submitLabel}
        successMessage={config.config.successMessage}
      />
    </div>
  );
}
