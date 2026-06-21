/**
 * Applies 012_platform_auth.sql when DATABASE_URL (or SUPABASE_DB_URL) is set.
 * Otherwise prints instructions for Supabase SQL Editor.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const migrationPath = resolve(root, "supabase/migrations/012_platform_auth.sql");

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

const dbUrl = process.env.DATABASE_URL ?? process.env.SUPABASE_DB_URL;
const sql = readFileSync(migrationPath, "utf8");

async function main() {
  if (!dbUrl) {
    console.log("DATABASE_URL not set — run this SQL in Supabase Dashboard → SQL Editor:\n");
    console.log("---");
    console.log(sql);
    console.log("---\n");
    console.log("Then run: npm run seed:admin");
    return;
  }

  const pg = await import("pg").catch(() => null);
  if (!pg) {
    console.error("Install pg to run migrations locally: npm install --save-dev pg");
    process.exit(1);
  }

  const client = new pg.default.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(sql);
    console.log("Migration 012_platform_auth applied successfully.");
    console.log("Next: npm run seed:admin");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
