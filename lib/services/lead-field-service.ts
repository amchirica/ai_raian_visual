import { createAdminClient } from "@/lib/supabase/admin";
import type { CreateLeadFieldInput, LeadField, UpdateLeadFieldInput } from "@/types";
import { toJson } from "@/lib/utils";

export class LeadFieldService {
  private get supabase() {
    return createAdminClient();
  }

  async listFields(clientId: string, includeInactive = false): Promise<LeadField[]> {
    let query = this.supabase
      .from("lead_fields")
      .select("*")
      .eq("client_id", clientId)
      .order("sort_order");

    if (!includeInactive) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []) as LeadField[];
  }

  async createField(clientId: string, input: CreateLeadFieldInput): Promise<LeadField> {
    const existing = await this.listFields(clientId, true);
    const maxOrder = existing.reduce((max, f) => Math.max(max, f.sort_order), 0);

    const { data, error } = await this.supabase
      .from("lead_fields")
      .insert({
        client_id: clientId,
        field_key: input.field_key,
        label: input.label,
        field_type: input.field_type,
        placeholder: input.placeholder ?? null,
        options: toJson(input.options ?? []),
        is_required: input.is_required ?? false,
        sort_order: input.sort_order ?? maxOrder + 1,
        is_active: input.is_active ?? true,
        metadata: toJson(input.metadata ?? {}),
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as LeadField;
  }

  async updateField(fieldId: string, input: UpdateLeadFieldInput): Promise<LeadField> {
    const payload: Record<string, unknown> = { ...input };
    if (input.options !== undefined) payload.options = toJson(input.options);
    if (input.metadata !== undefined) payload.metadata = toJson(input.metadata);

    const { data, error } = await this.supabase
      .from("lead_fields")
      .update(payload)
      .eq("id", fieldId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as LeadField;
  }

  async deleteField(fieldId: string): Promise<void> {
    const { error } = await this.supabase.from("lead_fields").delete().eq("id", fieldId);
    if (error) throw new Error(error.message);
  }

  async reorderFields(clientId: string, fieldIds: string[]): Promise<LeadField[]> {
    await Promise.all(
      fieldIds.map((id, index) =>
        this.supabase
          .from("lead_fields")
          .update({ sort_order: index + 1 })
          .eq("id", id)
          .eq("client_id", clientId),
      ),
    );
    return this.listFields(clientId, true);
  }
}

export const leadFieldService = new LeadFieldService();
