import { notFound } from "next/navigation";
import { DynamicLeadForm } from "@/components/embed/dynamic-lead-form";
import { AIAssistantWidget } from "@/components/embed/ai-assistant-widget";
import { FaqWidget } from "@/components/embed/faq-widget";
import { clientService } from "@/lib/services/client-service";
import { createAdminClient } from "@/lib/supabase/admin";
import { WIDGET_TYPES } from "@/lib/constants";
import type { WidgetSettings } from "@/types";

interface PageProps {
  params: Promise<{ clientSlug: string; widgetType: string }>;
}

export default async function EmbedWidgetPage({ params }: PageProps) {
  const { clientSlug, widgetType } = await params;

  if (!WIDGET_TYPES.includes(widgetType as (typeof WIDGET_TYPES)[number])) {
    notFound();
  }

  const client = await clientService.getClientBySlug(clientSlug);
  if (!client) notFound();

  const supabase = createAdminClient();
  const { data: widgetData } = await supabase
    .from("widget_settings")
    .select("*")
    .eq("client_id", client.id)
    .eq("widget_type", widgetType)
    .maybeSingle();

  const widget = widgetData as WidgetSettings | null;

  const theme = (widget?.theme ?? {}) as Record<string, string>;
  const config = (widget?.config ?? {}) as Record<string, unknown>;
  const primaryColor = theme.primaryColor ?? "#2563eb";

  if (widgetType === "lead-form" || widgetType === "offer-request") {
    return (
      <div className="min-h-screen bg-transparent p-4">
        <DynamicLeadForm
          clientSlug={clientSlug}
          title={widget?.title ?? "Request a quote"}
          subtitle={widget?.subtitle ?? undefined}
          primaryColor={primaryColor}
          submitLabel={String(config.submitLabel ?? "Submit")}
          successMessage={String(config.successMessage ?? "Thank you!")}
        />
      </div>
    );
  }

  if (widgetType === "chat") {
    return (
      <div className="min-h-screen bg-transparent p-4">
        <AIAssistantWidget
          clientSlug={clientSlug}
          mode="embed"
        />
      </div>
    );
  }

  if (widgetType === "faq") {
    const { data: faqItems } = await supabase
      .from("faq_items")
      .select("question, answer")
      .eq("client_id", client.id)
      .eq("is_active", true)
      .order("sort_order");

    return (
      <div className="min-h-screen bg-transparent p-4">
        <FaqWidget
          title={widget?.title ?? "FAQ"}
          subtitle={widget?.subtitle ?? undefined}
          primaryColor={primaryColor}
          items={faqItems ?? []}
          expandFirst={config.expandFirst === "true" || config.expandFirst === true}
        />
      </div>
    );
  }

  notFound();
}
