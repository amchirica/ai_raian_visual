import { NextResponse } from "next/server";
import { offerService } from "@/lib/services/offer-service";

interface RouteContext {
  params: Promise<{ offerId: string }>;
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { offerId } = await context.params;
    const offer = await offerService.markSent(offerId);
    return NextResponse.json({ offer });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to mark offer as sent" },
      { status: 500 },
    );
  }
}
