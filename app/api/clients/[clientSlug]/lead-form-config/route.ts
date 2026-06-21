import { NextResponse } from "next/server";
import { leadService } from "@/lib/services/lead-service";

interface RouteContext {
  params: Promise<{ clientSlug: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { clientSlug } = await context.params;
    const config = await leadService.getLeadFormConfig(clientSlug);

    if (!config) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json({
      client_id: config.client_id,
      client_slug: config.client_slug,
      company_name: config.company_name,
      fields: config.fields.map((f) => ({
        id: f.id,
        field_key: f.field_key,
        label: f.label,
        field_type: f.field_type,
        placeholder: f.placeholder,
        options: f.options,
        is_required: f.is_required,
        sort_order: f.sort_order,
        metadata: f.metadata,
      })),
      theme: config.theme,
      config: config.config,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load form config" },
      { status: 500 },
    );
  }
}
