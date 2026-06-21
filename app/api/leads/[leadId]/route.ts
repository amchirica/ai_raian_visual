import { NextResponse } from "next/server";
import { z } from "zod";
import { leadService } from "@/lib/services/lead-service";

interface RouteContext {
  params: Promise<{ leadId: string }>;
}

const patchSchema = z.object({
  status: z.string().optional(),
  ai_summary: z.string().optional(),
  ai_recommendation: z.string().optional(),
});

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { leadId } = await context.params;
    const lead = await leadService.getLeadById(leadId);
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }
    return NextResponse.json({ lead });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load lead" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { leadId } = await context.params;
    const body = await request.json();
    const parsed = patchSchema.parse(body);
    const lead = await leadService.updateLead(leadId, parsed);
    return NextResponse.json({ lead });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update lead" },
      { status: 500 },
    );
  }
}
