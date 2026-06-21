# Security Review

## Server-Only Secrets

| Variable | Exposure |
|----------|----------|
| `OPENAI_API_KEY` | Server only — used in `lib/ai/service.ts` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only — `lib/supabase/admin.ts` |
| `WEBHOOK_SIGNING_SECRET` | Server only — webhook signatures |

Never prefix AI or service role keys with `NEXT_PUBLIC_`.

## Input Validation

- **Zod schemas** on all API routes
- **sanitizeString / sanitizeFormData** on lead input (`lib/validation/sanitize.ts`)
- **optionalUuid** helper rejects invalid optional UUIDs (`lib/validation/uuid.ts`)

## Rate Limiting

In-memory placeholder in `lib/rate-limit.ts`:

- Chat: 30 req/min per IP
- Leads: configured per route

**Production:** replace with Redis / Upstash.

## CORS

`middleware.ts` allows cross-origin requests for:
- `/widget/*`
- `/embed/*`
- `/api/leads`
- `/api/assistant/*`
- `/api/clients/[slug]/lead-form-config`

Admin routes are same-origin only (no CORS).

## Webhook Signatures

Outbound webhooks include `x-webhook-signature` HMAC-SHA256 header.

Verify with `lib/security/webhook-signature.ts`:

```typescript
verifyWebhookSignature(body, request.headers.get("x-webhook-signature"))
```

Set `WEBHOOK_SIGNING_SECRET` in production.

## Row Level Security

Supabase tables have RLS enabled. Admin operations use service role server-side.

## AI Safety

- Assistant: approved knowledge base only, no invented prices
- Content: forbidden claims from `content_settings`
- Offers: prices from database only

## Future Hardening

- [ ] Admin authentication (currently internal tool)
- [ ] `ADMIN_API_SECRET` middleware for admin routes
- [ ] Redis rate limiting
- [ ] Inbound webhook signature verification endpoint
