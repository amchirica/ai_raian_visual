import { NextResponse } from "next/server";
import { z } from "zod";
import { catalogService } from "@/lib/services/catalog-service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const serviceSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  base_price: z.number().optional(),
  currency: z.string().optional(),
  sort_order: z.number().optional(),
  is_active: z.boolean().optional(),
});

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const services = await catalogService.listServices(id);
    return NextResponse.json({ services });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load services" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = serviceSchema.parse(body);
    const service = await catalogService.createService(id, parsed);
    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create service" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const body = await request.json();
    const serviceId = body.id as string;
    if (!serviceId) {
      return NextResponse.json({ error: "Service id required" }, { status: 400 });
    }
    const parsed = serviceSchema.partial().parse(body);
    const service = await catalogService.updateService(serviceId, parsed);
    return NextResponse.json(service);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update service" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get("id");
    if (!serviceId) {
      return NextResponse.json({ error: "Service id required" }, { status: 400 });
    }
    await catalogService.deleteService(serviceId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete service" },
      { status: 500 },
    );
  }
}
