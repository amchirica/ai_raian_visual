# Admin authentication setup

Platform admin access uses **Supabase Auth** (email + password) plus a `platform_admins` profile table.

## Quick setup

1. **Apply database migration** (creates `platform_admins`):

   ```bash
   npm run db:migrate:auth
   ```

   If `DATABASE_URL` is not set, copy the printed SQL into **Supabase Dashboard → SQL Editor** and run it.

2. **Create the admin user**:

   ```bash
   npm run seed:admin
   ```

   Uses `PLATFORM_ADMIN_EMAIL` and `PLATFORM_ADMIN_PASSWORD` from `.env.local`.

3. **Sign in** at `/admin/login`.

## Default credentials (local)

| Field    | Value                    |
|----------|--------------------------|
| Email    | `admin@raianvisual`      |
| Password | (set in `.env.local`)    |

Change the password in Supabase Auth or re-run `npm run seed:admin` after updating `PLATFORM_ADMIN_PASSWORD`.

## Database schema

Migration: `supabase/migrations/012_platform_auth.sql`

```sql
platform_admins (
  id UUID PRIMARY KEY → auth.users(id),
  email TEXT UNIQUE,
  full_name TEXT,
  role TEXT ('super_admin' | 'admin'),
  is_active BOOLEAN,
  last_login_at TIMESTAMPTZ,
  metadata JSONB,
  created_at, updated_at
)
```

RLS: authenticated users can `SELECT` their own row only. Server operations use the service role key.

## How it works

- **Middleware** refreshes the Supabase session and protects `/admin/*` and internal API routes.
- Only users with an active row in `platform_admins` can access the admin panel.
- **Public** routes stay open: widgets, embed, lead form POST, assistant chat POST.
- **Logout**: sidebar button → `POST /api/auth/logout`.

## Environment variables

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser + middleware session |
| `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY` | Seed script + server admin checks |
| `PLATFORM_ADMIN_EMAIL` | Admin email for seed |
| `PLATFORM_ADMIN_PASSWORD` | Admin password for seed |
| `DATABASE_URL` | Optional — auto-run migration via `pg` |

## Supabase Dashboard

Enable **Email** provider under Authentication → Providers.

## Security notes

- Never expose `SUPABASE_SECRET_KEY` or `PLATFORM_ADMIN_PASSWORD` to the client.
- For production, use a strong unique password and HTTPS.
- Widget/embed endpoints remain public by design (scoped by `client_slug`).
