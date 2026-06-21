import { NextResponse } from "next/server";
import { z } from "zod";
import { assistantService } from "@/lib/services/assistant-service";
import { checkRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  client_slug: z.string().min(2),
  message: z.string().min(1).max(2000),
  conversation_id: z.string().uuid().nullish(),
  visitor_id: z.string().nullish(),
  history: z.array(z.object({ role: z.string(), content: z.string() })).optional(),
});

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
    const rate = checkRateLimit(`chat:${ip}`, 30, 60_000);
    if (!rate.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await request.json();
    const parsed = schema.parse(body);

    const result = await assistantService.chat(
      parsed.client_slug,
      parsed.message,
      parsed.conversation_id ?? undefined,
      parsed.visitor_id ?? undefined,
      parsed.history ?? [],
    );

    return NextResponse.json(result);
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
