import { NextResponse } from "next/server";
import { z } from "zod";
import { packageService } from "@/lib/services/package-service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const schema = z.object({
  subject: z.string().optional(),
  body: z.string().min(10),
  metadata: z.record(z.unknown()).optional(),
});

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const template = await packageService.getOfferTemplate(id);
    return NextResponse.json({ template });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load template" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = schema.parse(body);
    const template = await packageService.upsertOfferTemplate(id, parsed);
    return NextResponse.json({ template });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save template" },
      { status: 500 },
    );
  }
}
