import { NextResponse } from "next/server";
import { z } from "zod";
import { contentService } from "@/lib/services/content-service";

interface RouteContext {
  params: Promise<{ contentId: string }>;
}

const patchSchema = z.object({
  status: z.string().optional(),
  title: z.string().optional(),
  subject: z.string().nullable().optional(),
  body: z.string().optional(),
});

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { contentId } = await context.params;
    const content = await contentService.getContentById(contentId);
    if (!content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }
    return NextResponse.json({ content });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load content" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { contentId } = await context.params;
    const body = await request.json();
    const parsed = patchSchema.parse(body);

    if (parsed.status && !parsed.body && !parsed.title && parsed.subject === undefined) {
      const content = await contentService.updateContentStatus(contentId, parsed.status);
      return NextResponse.json({ content });
    }

    const existing = await contentService.getContentById(contentId);
    if (!existing) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    const content = await contentService.saveContent({
      id: contentId,
      client_id: existing.client_id,
      content_type: existing.content_type,
      title: parsed.title ?? existing.title ?? undefined,
      subject: parsed.subject !== undefined ? parsed.subject : existing.subject,
      body: parsed.body ?? existing.body,
      status: parsed.status ?? existing.status,
    });
    return NextResponse.json({ content });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update content" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { contentId } = await context.params;
    await contentService.deleteContent(contentId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete content" },
      { status: 500 },
    );
  }
}
