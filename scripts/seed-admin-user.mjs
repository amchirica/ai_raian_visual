/**
 * Creates the platform admin in Supabase Auth + platform_admins table.
 * Requires migration 012_platform_auth.sql applied first.
 *
 * Usage: npm run seed:admin
 * Env: PLATFORM_ADMIN_EMAIL, PLATFORM_ADMIN_PASSWORD (or .env.local)
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnvFile(filename) {
  const path = resolve(root, filename);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
const email = process.env.PLATFORM_ADMIN_EMAIL ?? "admin@raianvisual";
const password = process.env.PLATFORM_ADMIN_PASSWORD;
const fullName = process.env.PLATFORM_ADMIN_NAME ?? "Raian Visual Admin";

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY (or SERVICE_ROLE_KEY).");
  process.exit(1);
}

if (!password) {
  console.error("Missing PLATFORM_ADMIN_PASSWORD in .env.local");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function ensureMigration() {
  const { error } = await admin.from("platform_admins").select("id").limit(1);
  if (error?.code === "42P01" || error?.message?.includes("does not exist")) {
    console.error(
      "\nTable platform_admins not found. Run migration first:\n" +
        "  Supabase Dashboard → SQL Editor → paste supabase/migrations/012_platform_auth.sql\n" +
        "  Or: npm run db:migrate:auth\n",
    );
    process.exit(1);
  }
  if (error) {
    console.error("Could not verify platform_admins table:", error.message);
    process.exit(1);
  }
}

async function findUserByEmail(targetEmail) {
  let page = 1;
  while (page <= 10) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const match = data.users.find((u) => u.email?.toLowerCase() === targetEmail.toLowerCase());
    if (match) return match;
    if (data.users.length < 200) break;
    page += 1;
  }
  return null;
}

async function main() {
  await ensureMigration();

  let user = await findUserByEmail(email);

  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (error) throw error;
    user = data.user;
    console.log("Created auth user:", email);
  } else {
    const { error } = await admin.auth.admin.updateUserById(user.id, {
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (error) throw error;
    console.log("Updated existing auth user:", email);
  }

  const { error: profileError } = await admin.from("platform_admins").upsert(
    {
      id: user.id,
      email,
      full_name: fullName,
      role: "super_admin",
      is_active: true,
    },
    { onConflict: "id" },
  );

  if (profileError) throw profileError;

  console.log("\nPlatform admin ready:");
  console.log("  Email:   ", email);
  console.log("  User ID: ", user.id);
  console.log("  Login:   ", (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000") + "/admin/login");
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
