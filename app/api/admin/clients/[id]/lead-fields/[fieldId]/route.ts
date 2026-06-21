import { NextResponse } from "next/server";
import { z } from "zod";
import { leadFieldService } from "@/lib/services/lead-field-service";
import { leadFieldSchema } from "@/lib/validation/lead";
import { toJson } from "@/lib/utils";

interface RouteContext {
  params: Promise<{ id: string; fieldId: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { fieldId } = await context.params;
    const body = await request.json();
    const parsed = leadFieldSchema.partial().parse(body);
    const field = await leadFieldService.updateField(fieldId, {
      ...parsed,
      options: parsed.options ? toJson(parsed.options) : undefined,
      metadata: parsed.metadata ? toJson(parsed.metadata) : undefined,
    });
    return NextResponse.json(field);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update field" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { fieldId } = await context.params;
    await leadFieldService.deleteField(fieldId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete field" },
      { status: 500 },
    );
  }
}
