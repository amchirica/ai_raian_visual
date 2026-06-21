import { NextResponse } from "next/server";
import { z } from "zod";
import { clientService } from "@/lib/services/client-service";
import { aiService } from "@/lib/ai";

const chatSchema = z.object({
  message: z.string().min(1),
  history: z.array(z.object({ role: z.string(), content: z.string() })).optional(),
});

interface RouteContext {
  params: Promise<{ clientSlug: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { clientSlug } = await context.params;
    const client = await clientService.getClientBySlug(clientSlug);

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = chatSchema.parse(body);

    const reply = await aiService.chatReply(
      client.id,
      parsed.message,
      parsed.history ?? [],
    );

    return NextResponse.json({ reply });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Chat failed" },
      { status: 500 },
    );
  }
}
