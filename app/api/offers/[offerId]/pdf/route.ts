import { NextResponse } from "next/server";
import { offerService } from "@/lib/services/offer-service";
import { clientService } from "@/lib/services/client-service";
import { generateOfferPdf } from "@/lib/pdf";

interface RouteContext {
  params: Promise<{ offerId: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { offerId } = await context.params;
    const offer = await offerService.getOffer(offerId);
    if (!offer) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    }

    const profile = await clientService.getBusinessProfile(offer.client_id);
    if (!profile) {
      return NextResponse.json({ error: "Business profile not found" }, { status: 404 });
    }

    const { buffer, filename } = await generateOfferPdf({ offer, profile });
    const contentType = filename.endsWith(".pdf") ? "application/pdf" : "text/html";

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "PDF generation failed" },
      { status: 500 },
    );
  }
}
