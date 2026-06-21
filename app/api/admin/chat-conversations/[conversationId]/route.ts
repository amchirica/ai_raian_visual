import { NextResponse } from "next/server";
import { z } from "zod";
import { assistantService } from "@/lib/services/assistant-service";

interface RouteContext {
  params: Promise<{ conversationId: string }>;
}

const patchSchema = z.object({
  status: z.string().optional(),
  handoff_requested: z.boolean().optional(),
  action: z.enum(["resolve"]).optional(),
});

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { conversationId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const parsed = patchSchema.parse(body);

    if (parsed.action === "resolve" || parsed.status === "resolved") {
      await assistantService.resolveConversation(conversationId);
      return NextResponse.json({ success: true });
    }

    const conversation = await assistantService.updateConversation(conversationId, {
      status: parsed.status,
      handoff_requested: parsed.handoff_requested,
    });
    return NextResponse.json({ conversation });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update conversation" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { conversationId } = await context.params;
    await assistantService.deleteConversation(conversationId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete conversation" },
      { status: 500 },
    );
  }
}
