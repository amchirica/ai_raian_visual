import { NextResponse } from "next/server";
import { z } from "zod";
import { followupService } from "@/lib/services/followup-service";

const schema = z.object({
  scheduled_id: z.string().uuid(),
  action: z.enum(["sent", "approve"]).default("sent"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.parse(body);
    const scheduled =
      parsed.action === "approve"
        ? await followupService.approveScheduled(parsed.scheduled_id)
        : await followupService.markSent(parsed.scheduled_id);
    return NextResponse.json({ scheduled });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Update failed" },
      { status: 500 },
    );
  }
}
