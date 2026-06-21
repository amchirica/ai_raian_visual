import { NextResponse } from "next/server";
import { z } from "zod";
import { followupService } from "@/lib/services/followup-service";

const schema = z.object({
  client_id: z.string().uuid(),
  scheduled_id: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.parse(body);
    const scheduled = await followupService.generateMessage(
      parsed.client_id,
      parsed.scheduled_id,
    );
    return NextResponse.json({ scheduled });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 },
    );
  }
}
