import { NextResponse } from "next/server";
import { z } from "zod";
import { leadFieldService } from "@/lib/services/lead-field-service";
import { leadFieldSchema, reorderLeadFieldsSchema } from "@/lib/validation/lead";
import { toJson } from "@/lib/utils";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const fields = await leadFieldService.listFields(id, true);
    return NextResponse.json({ fields });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list fields" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = leadFieldSchema.parse(body);
    const field = await leadFieldService.createField(id, {
      ...parsed,
      options: toJson(parsed.options ?? []),
      metadata: toJson(parsed.metadata ?? {}),
    });
    return NextResponse.json(field, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create field" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const reorder = reorderLeadFieldsSchema.safeParse(body);
    if (reorder.success) {
      const fields = await leadFieldService.reorderFields(id, reorder.data.field_ids);
      return NextResponse.json({ fields });
    }
    return NextResponse.json({ error: "Invalid reorder payload" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to reorder fields" },
      { status: 500 },
    );
  }
}
