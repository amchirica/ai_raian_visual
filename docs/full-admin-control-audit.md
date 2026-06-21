# Full Admin Control Audit

Last updated: MVP internal owner-control pass.

## Security warnings

| Item | Status |
|------|--------|
| Multi-user admin auth | **Post-MVP** — no RBAC built |
| Public deployment | **Must** protect `/admin` and `/api/admin` via Cloudflare Access, Basic Auth, VPN, or reverse-proxy |
| Optional env guard | Set `ADMIN_ACCESS_PASSWORD` to enable HTTP Basic Auth on admin routes |
| Automatic email/WhatsApp | **Post-MVP** — MVP uses copy-to-clipboard + mark-as-sent |
| SaaS billing | **Post-MVP** |
| Public client accounts | **Post-MVP** |

## Post-MVP classification summary

| Feature | Decision |
|---------|----------|
| Admin authentication / multi-user | Document + optional `ADMIN_ACCESS_PASSWORD` guard |
| Automatic email/WhatsApp sending | Post-MVP; manual approval kept |
| SaaS billing | Post-MVP |
| Public client accounts | Post-MVP |
| Package features UI | **Implemented** |
| Lead field reorder | **Implemented** (move up/down) |
| Dedicated webhooks table | **Implemented** (migration `011`) |
| Webhook delivery log history | Post-MVP (last_status on row only) |
| Missing CRUD actions | **Implemented** for MVP-critical entities |

---

## Per-page CRUD matrix

### `/admin` — Dashboard
| Action | Status |
|--------|--------|
| Read stats | ✅ |
| Navigate to modules | ✅ |

### `/admin/settings` — System Control
| Action | Status |
|--------|--------|
| Environment status | ✅ Implemented |
| OpenAI key yes/no | ✅ |
| Supabase connected yes/no | ✅ |
| Admin exposure warning | ✅ |
| Post-MVP limitations list | ✅ |
| Widget base URL | ✅ |

### `/admin/clients` — Client list
| Action | Status |
|--------|--------|
| List clients | ✅ |
| Create client | ✅ `/admin/clients/new` |
| View/configure | ✅ |
| Delete client | ⚠️ Intentionally omitted — disable via `is_active` on client detail (cascade risk) |

### `/admin/clients/[id]` — Client overview
| Action | Status |
|--------|--------|
| View overview stats | ✅ |
| Edit client + profile | ✅ `ClientConfigForm` |
| Enable/disable client | ✅ via form |
| Recent activity log | ✅ **Added** |
| Module shortcuts | ✅ incl. webhooks |

### `/admin/clients/[id]/profile`
| Action | Status |
|--------|--------|
| Update business profile | ✅ |

### `/admin/clients/[id]/services`
| Action | Status |
|--------|--------|
| Create | ✅ |
| Edit | ✅ **Added** |
| Delete | ✅ |
| Enable/disable | ✅ |

### `/admin/clients/[id]/packages`
| Action | Status |
|--------|--------|
| Create package | ✅ |
| Edit package | ✅ **Added** |
| Delete package | ✅ **Added** |
| Enable/disable package | ✅ **Added** |
| Duplicate package | ✅ **Added** |
| Package features CRUD | ✅ **Added** |
| Feature reorder (up/down) | ✅ **Added** |
| Extras create/edit/delete | ✅ **Added** |
| Pricing rules create/delete/toggle | ✅ **Added** |

### `/admin/clients/[id]/lead-fields`
| Action | Status |
|--------|--------|
| Create | ✅ |
| Edit (label, type, options, placeholder, help) | ✅ **Added** |
| Delete | ✅ |
| Enable/disable | ✅ |
| Required toggle | ✅ |
| Reorder (up/down) | ✅ (was already present) |

### `/admin/clients/[id]/faq`
| Action | Status |
|--------|--------|
| Create | ✅ |
| Edit | ✅ **Added** |
| Delete | ✅ |
| Enable/disable | ✅ **Added** |
| Reorder (up/down) | ✅ **Added** |

### `/admin/clients/[id]/webhooks`
| Action | Status |
|--------|--------|
| Create | ✅ **New page** |
| Edit | ✅ |
| Delete | ✅ |
| Enable/disable | ✅ |
| Set event type + URL + secret placeholder | ✅ |
| Test with sample payload | ✅ |
| Last delivery status | ✅ `last_status` on row |

### `/admin/clients/[id]/widget-settings`
| Action | Status |
|--------|--------|
| Configure lead form + chat widgets | ✅ |
| Enable/disable | ✅ |
| Preview/copy embed | ✅ via client overview |

### `/admin/clients/[id]/assistant`
| Action | Status |
|--------|--------|
| Configure assistant | ✅ |
| View conversations | ✅ |
| Convert to lead | ✅ |
| Archive conversation | ✅ resolve status |

### `/admin/leads`, `/admin/leads/[id]`
| Action | Status |
|--------|--------|
| List/filter | ✅ |
| View detail | ✅ |
| Edit status | ✅ |
| Archive | ✅ **Added** (`archived` status) |
| Generate offer | ✅ |
| Follow-ups | ✅ |

### `/admin/offers`, `/admin/offers/[id]`
| Action | Status |
|--------|--------|
| List/view | ✅ |
| Mark sent | ✅ |
| Duplicate | ✅ |
| Regenerate wording | ✅ |
| PDF preview | ✅ |
| Archive | ✅ **Added** |
| Delete | ⚠️ Archive preferred (offers linked to leads/workflows) |

### `/admin/follow-ups`
| Action | Status |
|--------|--------|
| Create sequence | ✅ |
| Generate/edit/copy | ✅ |
| Approve/mark sent | ✅ |
| Reschedule | ✅ **Added** (datetime in edit) |
| Delete scheduled item | ✅ **Added** |

### `/admin/content`, `/admin/generated-content/[id]`
| Action | Status |
|--------|--------|
| List/filter | ✅ |
| Edit/save | ✅ |
| Approve/archive | ✅ |
| Copy | ✅ |
| Delete permanently | ✅ **Added** |

---

## Missing actions fixed in this pass

1. Package edit/delete/disable/duplicate
2. Package features full UI with reorder
3. Package extras edit/delete
4. Pricing rules delete/disable
5. FAQ edit/enable/reorder
6. Services inline edit
7. Lead fields inline edit
8. Lead archive
9. Offer archive
10. Content hard delete
11. Follow-up delete + manual reschedule
12. Webhooks table + admin CRUD + test
13. Client activity log panel
14. System control settings page
15. Optional `ADMIN_ACCESS_PASSWORD` middleware guard
16. `archived` lead/offer statuses in constants

## Actions intentionally disabled or deferred

- **Client hard delete** — use `is_active: false`; avoids orphaning related data
- **Offer hard delete** — use archive
- **Automatic outbound email/WhatsApp** — manual only
- **Webhook delivery history table** — only last_status per webhook row

## Owner-control checklist

- [x] Full CRUD or archive/disable for MVP-critical entities
- [x] Package Features UI working
- [x] Lead field ordering working (up/down)
- [x] Webhooks table + configuration UI
- [x] No important admin page read-only without reason
- [x] No dead buttons in MVP flows
- [x] Post-MVP items documented
- [x] Admin safety warning on settings page
- [x] Raian Visual remains seed data only
- [x] `npm run typecheck` passes
- [x] `npm run build` passes

## Database migration required

Run migration `011_webhooks_table.sql` in Supabase before using the webhooks admin page. Dispatcher falls back to `clients.settings.webhooks` and env vars if the table is missing or empty.
