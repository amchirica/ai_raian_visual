import { NextResponse } from "next/server";
import { z } from "zod";
import { offerService } from "@/lib/services/offer-service";

interface RouteContext {
  params: Promise<{ offerId: string }>;
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { offerId } = await context.params;
    const offer = await offerService.duplicateOffer(offerId);
    return NextResponse.json({ offer }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to duplicate offer" },
      { status: 500 },
    );
  }
}

export async function PATCH(_request: Request, context: RouteContext) {
  try {
    const { offerId } = await context.params;
    const offer = await offerService.regenerateWording(offerId);
    return NextResponse.json({ offer });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to regenerate wording" },
      { status: 500 },
    );
  }
}
