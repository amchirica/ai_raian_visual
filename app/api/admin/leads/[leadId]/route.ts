import { NextResponse } from "next/server";
import { z } from "zod";
import { leadService } from "@/lib/services/lead-service";
import { clientService } from "@/lib/services/client-service";
import { updateLeadSchema } from "@/lib/validation/lead";

interface RouteContext {
  params: Promise<{ leadId: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { leadId } = await context.params;
    const lead = await leadService.getLeadById(leadId);
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const client = await clientService.getClientById(lead.client_id);
    return NextResponse.json({ lead, client });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get lead" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { leadId } = await context.params;
    const body = await request.json();
    const parsed = updateLeadSchema.parse(body);
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

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { leadId } = await context.params;
    await leadService.deleteLead(leadId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete lead" },
      { status: 500 },
    );
  }
}
