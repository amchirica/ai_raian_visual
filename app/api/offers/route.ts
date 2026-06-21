import { NextResponse } from "next/server";
import { z } from "zod";
import { offerService } from "@/lib/services/offer-service";

const createSchema = z.object({
  client_id: z.string().uuid(),
  lead_id: z.string().uuid().optional(),
  package_id: z.string().uuid().optional(),
  title: z.string().min(1).optional(),
  total_amount: z.number().optional(),
  currency: z.string().optional(),
  use_ai_copy: z.boolean().optional(),
  mode: z.enum(["draft", "generate"]).default("draft"),
  contents: z.array(z.string()).optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("client_id");
    if (!clientId) {
      return NextResponse.json({ error: "client_id query param required" }, { status: 400 });
    }
    const offers = await offerService.listOffersForClient(clientId);
    return NextResponse.json({ offers });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list offers" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createSchema.parse(body);

    if (parsed.mode === "generate") {
      if (!parsed.lead_id) {
        return NextResponse.json({ error: "lead_id required for generate mode" }, { status: 400 });
      }
      const offer = await offerService.generateOffer({
        client_id: parsed.client_id,
        lead_id: parsed.lead_id,
        package_id: parsed.package_id,
        use_ai_copy: parsed.use_ai_copy,
      });
      return NextResponse.json({ offer }, { status: 201 });
    }

    if (!parsed.title || parsed.total_amount == null) {
      return NextResponse.json({ error: "title and total_amount required for draft" }, { status: 400 });
    }

    const offer = await offerService.createDraftOffer({
      client_id: parsed.client_id,
      lead_id: parsed.lead_id,
      package_id: parsed.package_id,
      title: parsed.title,
      total_amount: parsed.total_amount,
      currency: parsed.currency,
      contents: parsed.contents,
    });
    return NextResponse.json({ offer }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create offer" },
      { status: 500 },
    );
  }
}
