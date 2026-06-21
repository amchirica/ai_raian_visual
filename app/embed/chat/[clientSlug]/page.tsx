import { notFound } from "next/navigation";
import { AIAssistantWidget } from "@/components/embed/ai-assistant-widget";
import { assistantService } from "@/lib/services/assistant-service";

interface PageProps {
  params: Promise<{ clientSlug: string }>;
}

export default async function ChatEmbedPage({ params }: PageProps) {
  const { clientSlug } = await params;
  const config = await assistantService.getPublicConfig(clientSlug);
  if (!config || !config.is_enabled) notFound();

  return (
    <div className="min-h-screen bg-transparent">
      <AIAssistantWidget clientSlug={clientSlug} mode="embed" config={config} />
    </div>
  );
}
