import { NextResponse } from "next/server";
import { z } from "zod";
import { contentService } from "@/lib/services/content-service";
import { toJson } from "@/lib/utils";
import type { ContentSettings } from "@/types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const settingsSchema = z.object({
  industry: z.string().optional(),
  tone_of_voice: z.string().optional(),
  target_audience: z.string().nullable().optional(),
  brand_positioning: z.string().nullable().optional(),
  forbidden_claims: z.array(z.string()).optional(),
  preferred_cta: z.string().nullable().optional(),
  default_locale: z.string().optional(),
});

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const settings = await contentService.getSettings(id);
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
    const settings = await contentService.upsertSettings(id, {
      ...parsed,
      forbidden_claims: parsed.forbidden_claims ? toJson(parsed.forbidden_claims) : undefined,
    } as Partial<ContentSettings>);
    return NextResponse.json({ settings });
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
