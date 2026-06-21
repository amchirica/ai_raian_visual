import { NextResponse } from "next/server";
import { z } from "zod";
import { assistantService } from "@/lib/services/assistant-service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const faqSchema = z.object({
  id: z.string().uuid().optional(),
  question: z.string().min(1),
  answer: z.string().min(1),
  category: z.string().optional(),
  sort_order: z.number().optional(),
  is_active: z.boolean().optional(),
});

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const items = await assistantService.listFaqItems(id);
    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load FAQ" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = faqSchema.parse(body);
    const item = await assistantService.upsertFaqItem(id, parsed);
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save FAQ" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { searchParams } = new URL(request.url);
    const faqId = searchParams.get("id");
    if (!faqId) return NextResponse.json({ error: "id required" }, { status: 400 });
    await assistantService.deleteFaqItem(faqId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete FAQ" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const itemIds = body.item_ids as string[];
    if (!Array.isArray(itemIds)) {
      return NextResponse.json({ error: "item_ids required" }, { status: 400 });
    }
    for (let i = 0; i < itemIds.length; i++) {
      const items = await assistantService.listFaqItems(id);
      const item = items.find((f) => f.id === itemIds[i]);
      if (item) {
        await assistantService.upsertFaqItem(id, {
          id: item.id,
          question: item.question,
          answer: item.answer,
          category: item.category ?? undefined,
          sort_order: i,
          is_active: item.is_active,
        });
      }
    }
    const items = await assistantService.listFaqItems(id);
    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to reorder FAQ" },
      { status: 500 },
    );
  }
}
