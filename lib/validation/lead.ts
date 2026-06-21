import { z } from "zod";
import { LEAD_CATEGORIES, LEAD_STATUSES } from "@/lib/constants";

export const createLeadSchema = z.object({
  client_slug: z.string().min(2).optional(),
  client_id: z.string().uuid().optional(),
  source: z.string().max(100).optional(),
  name: z.string().max(200).optional(),
  email: z.string().email().max(200).optional().or(z.literal("")),
  phone: z.string().max(50).optional(),
  company: z.string().max(200).optional(),
  message: z.string().max(5000).optional(),
  form_data: z.record(z.union([z.string(), z.array(z.string()), z.number(), z.boolean()])).optional(),
}).refine((data) => data.client_slug || data.client_id, {
  message: "Either client_slug or client_id is required",
});

export const submitLeadSchema = z.object({
  source: z.string().max(100).optional(),
  name: z.string().max(200).optional(),
  email: z.string().email().max(200).optional().or(z.literal("")),
  phone: z.string().max(50).optional(),
  company: z.string().max(200).optional(),
  message: z.string().max(5000).optional(),
  form_data: z.record(z.union([z.string(), z.array(z.string()), z.number(), z.boolean()])).optional(),
});

export const updateLeadSchema = z.object({
  status: z.enum(LEAD_STATUSES).optional(),
  score_category: z.enum(LEAD_CATEGORIES).optional(),
  name: z.string().max(200).optional(),
  email: z.string().email().max(200).optional().or(z.literal("")),
  phone: z.string().max(50).optional(),
  company: z.string().max(200).optional(),
  message: z.string().max(5000).optional(),
});

export const leadFieldSchema = z.object({
  field_key: z.string().min(1).max(80).regex(/^[a-z0-9_]+$/),
  label: z.string().min(1).max(200),
  field_type: z.enum([
    "text", "email", "phone", "date", "select", "multi_select",
    "textarea", "number", "budget_range", "checkbox",
  ]),
  placeholder: z.string().max(300).nullable().optional(),
  options: z.array(z.union([z.string(), z.object({ value: z.string(), label: z.string() })])).optional(),
  is_required: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const reorderLeadFieldsSchema = z.object({
  field_ids: z.array(z.string().uuid()).min(1),
});
