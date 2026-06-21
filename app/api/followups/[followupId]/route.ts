import { NextResponse } from "next/server";
import { z } from "zod";
import { followupService } from "@/lib/services/followup-service";

interface RouteContext {
  params: Promise<{ followupId: string }>;
}

const patchSchema = z.object({
  subject: z.string().nullable().optional(),
  body: z.string().min(1).optional(),
  scheduled_for: z.string().optional(),
  status: z.string().optional(),
  channel: z.string().optional(),
  action: z.enum(["approve", "sent"]).optional(),
});

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { followupId } = await context.params;
    const body = await request.json();
    const parsed = patchSchema.parse(body);

    if (parsed.action === "approve") {
      const followup = await followupService.approveScheduled(followupId);
      return NextResponse.json({ followup });
    }
    if (parsed.action === "sent") {
      const followup = await followupService.markSent(followupId);
      return NextResponse.json({ followup });
    }

    const followup = await followupService.updateScheduled(followupId, {
      subject: parsed.subject,
      body: parsed.body,
      scheduled_for: parsed.scheduled_for,
      status: parsed.status,
      channel: parsed.channel,
    });
    return NextResponse.json({ followup });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update follow-up" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { followupId } = await context.params;
    await followupService.deleteScheduled(followupId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete follow-up" },
      { status: 500 },
    );
  }
}
