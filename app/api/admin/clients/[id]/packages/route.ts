import { NextResponse } from "next/server";
import { z } from "zod";
import { packageService } from "@/lib/services/package-service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const packageSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  price: z.number().optional(),
  currency: z.string().optional(),
  is_active: z.boolean().optional(),
  sort_order: z.number().optional(),
});

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const [packages, extras, rules, features] = await Promise.all([
      packageService.listPackages(id),
      packageService.listExtras(id, { activeOnly: false }),
      packageService.listPricingRules(id),
      packageService.listAllFeatures(id),
    ]);
    return NextResponse.json({ packages, extras, pricing_rules: rules, features });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load packages" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const type = body.type as string;

    if (type === "extra") {
      const extra = await packageService.createExtra(id, body);
      return NextResponse.json(extra, { status: 201 });
    }

    if (type === "feature") {
      const feature = await packageService.createFeature(id, body.package_id, body);
      return NextResponse.json(feature, { status: 201 });
    }

    if (type === "pricing_rule") {
      const rule = await packageService.createPricingRule(id, body);
      return NextResponse.json(rule, { status: 201 });
    }

    if (type === "duplicate_package") {
      const pkg = await packageService.duplicatePackage(id, body.package_id);
      return NextResponse.json(pkg, { status: 201 });
    }

    const parsed = packageSchema.parse(body);
    const pkg = await packageService.createPackage(id, parsed);
    return NextResponse.json(pkg, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const body = await request.json();
    const type = body.type as string;
    const itemId = body.id as string;
    if (!itemId) return NextResponse.json({ error: "id required" }, { status: 400 });

    if (type === "package") {
      const pkg = await packageService.updatePackage(itemId, body);
      return NextResponse.json(pkg);
    }
    if (type === "extra") {
      const extra = await packageService.updateExtra(itemId, body);
      return NextResponse.json(extra);
    }
    if (type === "feature") {
      const feature = await packageService.updateFeature(itemId, body);
      return NextResponse.json(feature);
    }
    if (type === "pricing_rule") {
      const rule = await packageService.updatePricingRule(itemId, body);
      return NextResponse.json(rule);
    }
    if (type === "reorder_features") {
      const featureIds = body.feature_ids as string[];
      for (let i = 0; i < featureIds.length; i++) {
        await packageService.updateFeature(featureIds[i], { sort_order: i });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown type" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const itemId = searchParams.get("id");
    if (!type || !itemId) {
      return NextResponse.json({ error: "type and id required" }, { status: 400 });
    }

    if (type === "package") await packageService.deletePackage(itemId);
    else if (type === "extra") await packageService.deleteExtra(itemId);
    else if (type === "feature") await packageService.deleteFeature(itemId);
    else if (type === "pricing_rule") await packageService.deletePricingRule(itemId);
    else return NextResponse.json({ error: "Unknown type" }, { status: 400 });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete" },
      { status: 500 },
    );
  }
}
