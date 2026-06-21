import { NextResponse } from "next/server";
import { z } from "zod";
import { assistantService } from "@/lib/services/assistant-service";
import { toJson } from "@/lib/utils";
import type { AssistantSettings } from "@/types";
interface RouteContext {
  params: Promise<{ id: string }>;
}

const settingsSchema = z.object({
  is_enabled: z.boolean().optional(),
  greeting_message: z.string().optional(),
  fallback_message: z.string().optional(),
  handoff_message: z.string().optional(),
  tone: z.string().optional(),
  lead_capture_prompt: z.string().optional(),
  lead_form_url: z.string().nullable().optional(),
  system_instructions: z.string().nullable().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const settings = await assistantService.getSettings(id);
    return NextResponse.json({ settings });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load settings" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = settingsSchema.parse(body);
    const settings = await assistantService.upsertSettings(id, {
      ...parsed,
      metadata: parsed.metadata ? toJson(parsed.metadata) : undefined,
    } as Partial<AssistantSettings>);    return NextResponse.json({ settings });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save settings" },
      { status: 500 },
    );
  }
}
