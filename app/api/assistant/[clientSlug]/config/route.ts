import { NextResponse } from "next/server";
import { assistantService } from "@/lib/services/assistant-service";

interface RouteContext {
  params: Promise<{ clientSlug: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { clientSlug } = await context.params;
    const config = await assistantService.getPublicConfig(clientSlug);
    if (!config) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }
    return NextResponse.json(config);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load config" },
      { status: 500 },
    );
  }
}
