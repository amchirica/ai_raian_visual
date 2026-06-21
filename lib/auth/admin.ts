import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface PlatformAdmin {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  is_active: boolean;
}

export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getPlatformAdmin(userId: string): Promise<PlatformAdmin | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("platform_admins")
    .select("id, email, full_name, role, is_active")
    .eq("id", userId)
    .eq("is_active", true)
    .maybeSingle();
  return data as PlatformAdmin | null;
}

export async function requirePlatformAdmin(): Promise<PlatformAdmin> {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  const admin = await getPlatformAdmin(user.id);
  if (!admin) throw new Error("Forbidden");

  return admin;
}
