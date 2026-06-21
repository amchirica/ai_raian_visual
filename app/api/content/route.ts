import { NextResponse } from "next/server";
import { contentService } from "@/lib/services/content-service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("client_id") ?? undefined;
    const status = searchParams.get("status") ?? undefined;
    const leadId = searchParams.get("lead_id") ?? undefined;
    const offerId = searchParams.get("offer_id") ?? undefined;

    const items = await contentService.listContent({
      clientId,
      status,
      leadId,
      offerId,
    });
    return NextResponse.json({ content: items });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list content" },
      { status: 500 },
    );
  }
}
