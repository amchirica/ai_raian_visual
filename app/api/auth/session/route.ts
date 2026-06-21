import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPlatformAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const admin = await getPlatformAdmin(user.id);
    if (!admin) {
      await supabase.auth.signOut();
      return NextResponse.json({ error: "Not authorized as platform admin" }, { status: 403 });
    }

    const db = createAdminClient();
    await db
      .from("platform_admins")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", user.id);

    return NextResponse.json({ admin });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Session check failed" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const admin = await getPlatformAdmin(user.id);
    if (!admin) {
      return NextResponse.json({ authenticated: false, error: "Not admin" }, { status: 403 });
    }

    return NextResponse.json({ authenticated: true, admin });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Session check failed" },
      { status: 500 },
    );
  }
}
