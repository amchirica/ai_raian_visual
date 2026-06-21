import { NextResponse } from "next/server";
import { z } from "zod";
import { offerService } from "@/lib/services/offer-service";

const schema = z.object({
  client_id: z.string().uuid(),
  lead_id: z.string().uuid(),
  package_id: z.string().uuid().optional(),
  extra_ids: z.array(z.string().uuid()).optional(),
  use_ai_copy: z.boolean().optional(),
  regenerate_wording_only: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.parse(body);
    const offer = await offerService.generateOffer(parsed);
    return NextResponse.json({ offer }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate offer" },
      { status: 500 },
    );
  }
}
