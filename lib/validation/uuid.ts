import { z } from "zod";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUuid(value: string): boolean {
  return UUID_REGEX.test(value.trim());
}

/** Returns a UUID string or undefined if empty/invalid. */
export function pickOptionalUuid(value: string | undefined | null): string | undefined {
  if (value == null) return undefined;
  const trimmed = value.trim();
  if (!trimmed || !isValidUuid(trimmed)) return undefined;
  return trimmed;
}

function normalizeOptionalUuid(value: unknown): string | undefined {
  if (value == null || value === "") return undefined;
  if (typeof value !== "string") return undefined;
  return pickOptionalUuid(value);
}

function normalizeOptionalUuidNullable(value: unknown): string | null | undefined {
  if (value === null) return null;
  return normalizeOptionalUuid(value) ?? null;
}

/** Treats empty or invalid strings as undefined before UUID validation. */
export const optionalUuid = z.preprocess(
  normalizeOptionalUuid,
  z.string().uuid().optional(),
);

/** Treats empty or invalid strings as null before UUID validation. */
export const optionalUuidNullable = z.preprocess(
  normalizeOptionalUuidNullable,
  z.string().uuid().nullish(),
);
