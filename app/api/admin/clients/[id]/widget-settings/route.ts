import { NextResponse } from "next/server";
import { z } from "zod";
import { widgetSettingsService } from "@/lib/services/widget-settings-service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const upsertSchema = z.object({
  widget_type: z.string().min(1),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  theme: z.record(z.unknown()).optional(),
  config: z.record(z.unknown()).optional(),
  is_active: z.boolean().optional(),
});

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const widgets = await widgetSettingsService.listByClient(id);
    return NextResponse.json({ widgets });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load widget settings" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = upsertSchema.parse(body);
    const { widget_type, ...rest } = parsed;
    const widget = await widgetSettingsService.upsert(id, widget_type, rest);
    return NextResponse.json({ widget });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save widget settings" },
      { status: 500 },
    );
  }
}
