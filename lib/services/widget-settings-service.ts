import { createAdminClient } from "@/lib/supabase/admin";
import type { WidgetSettings } from "@/types";
import { toJson } from "@/lib/utils";

export class WidgetSettingsService {
  private get supabase() {
    return createAdminClient();
  }

  async listByClient(clientId: string): Promise<WidgetSettings[]> {
    const { data, error } = await this.supabase
      .from("widget_settings")
      .select("*")
      .eq("client_id", clientId)
      .order("widget_type");
    if (error) throw new Error(error.message);
    return (data ?? []) as WidgetSettings[];
  }

  async upsert(
    clientId: string,
    widgetType: string,
    input: {
      title?: string | null;
      subtitle?: string | null;
      theme?: Record<string, unknown>;
      config?: Record<string, unknown>;
      is_active?: boolean;
    },
  ): Promise<WidgetSettings> {
    const existing = await this.supabase
      .from("widget_settings")
      .select("id")
      .eq("client_id", clientId)
      .eq("widget_type", widgetType)
      .maybeSingle();

    const row = {
      title: input.title ?? null,
      subtitle: input.subtitle ?? null,
      theme: toJson(input.theme ?? {}),
      config: toJson(input.config ?? {}),
      is_active: input.is_active ?? true,
    };

    if (existing.data?.id) {
      const { data, error } = await this.supabase
        .from("widget_settings")
        .update(row)
        .eq("id", existing.data.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as WidgetSettings;
    }

    const { data, error } = await this.supabase
      .from("widget_settings")
      .insert({ client_id: clientId, widget_type: widgetType, ...row })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as WidgetSettings;
  }
}

export const widgetSettingsService = new WidgetSettingsService();
