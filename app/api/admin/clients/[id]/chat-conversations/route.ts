import { NextResponse } from "next/server";
import { assistantService } from "@/lib/services/assistant-service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversation_id");

    if (conversationId) {
      const data = await assistantService.getConversationWithMessages(conversationId);
      return NextResponse.json(data);
    }

    const conversations = await assistantService.listConversations(id);
    return NextResponse.json({ conversations });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load conversations" },
      { status: 500 },
    );
  }
}
