import { NextResponse } from "next/server";
import { followupService } from "@/lib/services/followup-service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("client_id") ?? undefined;
    const leadId = searchParams.get("lead_id") ?? undefined;
    const offerId = searchParams.get("offer_id") ?? undefined;

    const followups = await followupService.listScheduled({ clientId, leadId, offerId });
    return NextResponse.json({ followups });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list follow-ups" },
      { status: 500 },
    );
  }
}
