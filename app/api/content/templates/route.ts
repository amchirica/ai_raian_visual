import { NextRequest, NextResponse } from "next/server";
import { contentService } from "@/lib/services/content-service";

export async function GET(request: NextRequest) {
  try {
    const clientId = request.nextUrl.searchParams.get("client_id") ?? undefined;
    const templates = await contentService.listTemplates(clientId);
    return NextResponse.json({ templates });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load templates" },
      { status: 500 },
    );
  }
}
