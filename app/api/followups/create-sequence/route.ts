import { NextResponse } from "next/server";
import { z } from "zod";
import { FOLLOWUP_CHANNELS } from "@/lib/constants";
import { followupService } from "@/lib/services/followup-service";
import { optionalUuid } from "@/lib/validation/uuid";

const schema = z.object({
  client_id: z.string().uuid(),
  lead_id: optionalUuid,
  offer_id: optionalUuid,
  name: z.string().min(1),
  trigger_event: z.string().optional(),
  require_approval: z.boolean().optional(),
  steps: z.array(
    z.object({
      delay_hours: z.number().int().min(1),
      channel: z.enum(FOLLOWUP_CHANNELS),
      name: z.string().optional(),
      subject: z.string().optional(),
      body_template: z.string().optional(),
    }),
  ).min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.parse(body);
    const result = await followupService.createSequence({
      client_id: parsed.client_id,
      lead_id: parsed.lead_id ?? undefined,
      offer_id: parsed.offer_id ?? undefined,
      name: parsed.name,
      trigger_event: parsed.trigger_event,
      require_approval: parsed.require_approval,
      steps: parsed.steps,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create sequence" },
      { status: 500 },
    );
  }
}
