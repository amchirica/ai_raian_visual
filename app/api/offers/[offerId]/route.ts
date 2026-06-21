import { NextResponse } from "next/server";
import { z } from "zod";
import { offerService } from "@/lib/services/offer-service";
import { OFFER_STATUSES } from "@/lib/constants";

interface RouteContext {
  params: Promise<{ offerId: string }>;
}

const patchSchema = z.object({
  title: z.string().min(1).optional(),
  status: z.enum(OFFER_STATUSES).optional(),
  total_amount: z.number().optional(),
  currency: z.string().optional(),
  contents: z.array(z.string()).optional(),
});

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { offerId } = await context.params;
    const offer = await offerService.getOffer(offerId);
    if (!offer) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    }
    return NextResponse.json({ offer });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get offer" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { offerId } = await context.params;
    const body = await request.json();
    const parsed = patchSchema.parse(body);
    const offer = await offerService.updateOffer(offerId, parsed);
    return NextResponse.json({ offer });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update offer" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { offerId } = await context.params;
    await offerService.deleteOffer(offerId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete offer" },
      { status: 500 },
    );
  }
}
