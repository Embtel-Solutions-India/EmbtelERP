# EmbtelERP — Remediation & Roadmap Backlog

> Companion to PRD §11–12. Turns the code review into prioritized, trackable work items. Each item has a severity, acceptance criteria, and a **ready-to-paste Claude Code prompt** written in the additive-only, phased style (read first → STOP → confirm → implement). Run them one at a time and review at each gate.

---

## P0 — Build is broken

**Problem:** `npm run build` (`tsc`) fails (~20 errors). Dev runs because `tsx` skips type-checking, so this is invisible until a production build. Clusters: query params typed `string | string[]` assigned to `string` (`admin.routes.ts`, `dashboard.routes.ts`); async route handlers returning `Response` instead of `void` (`calendar.routes.ts`, `dashboard.routes.ts`, `workspace.routes.ts`).

**Acceptance:** `npx tsc -p tsconfig.json --noEmit` exits 0; no runtime behavior changes; no `// @ts-ignore`.

**Claude Code prompt:**
> Read `Server/tsconfig.json` and run `npx tsc -p tsconfig.json --noEmit`. Fix every reported type error **without changing runtime behavior** and without `@ts-ignore`. For `string | string[]` query params, normalize with a small helper (`const first = (v) => Array.isArray(v) ? v[0] : v`) at the point of use. For async handlers flagged as returning `Response` instead of `void`, ensure they `return;` after `res.json(...)` / `res.status(...).json(...)` rather than returning the Response. Do not touch business logic or change any response shape. Show me the full list of errors before and after, and the diff. STOP for my approval before committing.

---

## P1 — Marketing → Sales handoff ✅ DONE (Phase 1)

**Status:** Implemented. `SalesLead.marketingLeadId` (nullable, unique) links back to the originating `MarketingLead`; `promoteMarketingLeadToSales` + `POST /marketing/leads/:id/promote` (Marketing Executive+, assignee validated to promoter's scope) create the linked sales lead, mark the marketing lead `CONVERTED`, and record `ASSIGNMENT_CHANGE`/`STATUS_CHANGE` — atomically. Migration `20260616_link_marketing_to_sales_lead` (additive).

**Original problem:** `MarketingLead` and `SalesLead` are disconnected — no FK, no promotion endpoint. The Marketing→Sales ownership chain in the org chart / spec does not exist in code. Marketing "CONVERTED" only stamps `convertedAt` on the marketing lead.

**Acceptance:** A marketer (or manager) can promote a `MarketingLead` to a `SalesLead`; the new sales lead carries source, original creator, and a link back to the marketing lead; the action is scope-checked and audit-logged; the marketing lead is marked converted; no existing tables altered destructively.

**Claude Code prompt:**
> Additive-only task. First read `Server/prisma/schema.prisma` (MarketingLead, SalesLead), `Server/src/services/marketing.service.ts`, `Server/src/services/salesLead.service.ts`, and `Server/src/services/scope.service.ts`. Report a plan, then STOP for approval. Then implement, in phases with a STOP after each:
> 1. **Schema (additive migration only):** add a nullable `marketingLeadId String? @unique` + relation on `SalesLead`; do not alter or drop anything existing.
> 2. **Service:** add `promoteMarketingLeadToSales(ctx, marketingLeadId)` that — within the caller's `DataScope` — creates a `SalesLead` (copying name/email/phone/source/estimatedValue, `createdById` = actor, `assignedToId` per existing create rules), links `marketingLeadId`, sets the `MarketingLead.status = CONVERTED` + `convertedAt`, and writes `recordActivity`/`recordAudit` with `ASSIGNMENT_CHANGE`. Reuse the existing `createSalesLead` scope/RBAC checks — do not duplicate them.
> 3. **Route:** `POST /marketing/leads/:id/promote` (authenticate + attachScope; blocked while impersonating, like all writes). Add a Zod validation if a body is needed.
> No mock data. Show the migration SQL and the diff at each gate.

---

## P1 — Lead lifecycle state-machine guard ✅ DONE (Phase 3)

**Status:** Implemented. A single `ALLOWED_TRANSITIONS` map in `salesLead.service` is enforced in `updateSalesLead`/`convertSalesLead`/`transferSalesLead` (illegal jumps → 400); conversion requires `paymentStatus` `PARTIALLY_DONE` or `DONE`. Every change is recorded in the new `LeadStatusHistory` (read: `GET /sales/leads/:id/status-history`). Migration `20260618_add_lead_status_history` (additive + backfill).

**Original problem:** `updateSalesLead` accepts any `status` via PATCH, so illegal jumps (e.g. `NEW → TRANSFERRED`) bypass the guard the `/transfer` endpoint enforces. Conversion also doesn't require payment completion, contrary to the intended lifecycle.

**Acceptance:** Only legal transitions succeed; illegal ones return 400; convert is gated on `paymentStatus = DONE` (confirm this rule first); existing valid flows unaffected.

**Claude Code prompt:**
> Read `Server/src/services/salesLead.service.ts` and the `SalesLeadStatus` enum. Add a single source-of-truth transition map (e.g. `NEW→[CONTACTED,LOST]`, `CONTACTED→[CONSULTATION_SCHEDULED,LOST]`, … `QUALIFIED→[CONVERTED,TRANSFERRED,LOST]`, `CONVERTED→[TRANSFERRED]`). Enforce it in `updateSalesLead`, `convertSalesLead`, and `transferSalesLead` — reject illegal transitions with `ApiError(400)`. Before coding, ask me to confirm: (a) the exact allowed transitions, and (b) whether `CONVERTED` should require `paymentStatus === DONE`. Do not change the audit/activity recording. Show the map and diff, STOP for approval.

---

## P2 — Two sources of truth for immigration fields

**Problem:** `SalesLead` already has all immigration columns, but `LeadImmigrationProfile` 1:1-duplicates them, and there are two different `computeLeadScore` functions. The live UI sends flat fields, so the profile is effectively never written — `createLeadWithImmigration` just adds a redundant extra query.

**Acceptance:** One canonical home for immigration data and one lead-score function; no UI regression; profile table either removed (with migration) or explicitly documented as deprecated.

**Claude Code prompt:**
> Read `Server/src/services/leadImmigration.service.ts`, `Server/src/services/salesLead.service.ts`, `Server/src/controllers/salesLead.controller.ts`, `Server/src/validations/salesLead.validation.ts`, and the client `Client/src/modules/sales/leads/leadFormConfig.js` + `Client/src/pages/Leads.jsx`. Confirm (and report to me) that the client sends flat `SalesLead` fields and never a nested `immigration` object. Then propose two options: (A) keep `LeadImmigrationProfile` and make the client/server actually use it, or (B) treat `SalesLead`'s own columns as canonical, delete the redundant `createLeadWithImmigration` indirection so `POST /sales/leads` calls `createSalesLead` directly, and mark `LeadImmigrationProfile` deprecated. STOP and let me pick. Whichever I choose, keep exactly one `computeLeadScore`. Do not drop the table without an explicit approval + migration.

---

## P2 — Revenue definition ✅ DONE (Phase 5)

**Status:** Implemented. One definition lives in `Server/src/services/revenue.ts` and is used by `immigration.service.ts`, `/sales/leaderboard`, and `/sales/team-stats`: **revenue = Σ collected `paymentAmount` of leads with `convertedAt` set (counts converted-then-TRANSFERRED), dated/bucketed by `convertedAt`.** No `updatedAt` re-dating; no schema change. Funnel stage `value` stays `estimatedValue` (pipeline, deliberately not revenue).

**Original problem:** Revenue/KPIs sum `estimatedValue` of CONVERTED leads, not collected `paymentAmount`/payments; `getRevenue` buckets by `updatedAt` not `convertedAt` (so later edits re-date revenue); TRANSFERRED (post-conversion) leads drop out of revenue.

**Acceptance:** A single documented revenue definition applied consistently across `immigration.service.ts`, `/sales/leaderboard`, `/sales/team-stats`; revenue dated by conversion, not last edit; converted-then-transferred leads still count.

**Claude Code prompt:**
> Read `Server/src/services/immigration.service.ts` and the `/sales/leaderboard` + `/sales/team-stats` handlers in `Server/src/routes/salesLead.routes.ts`. First ask me to confirm the revenue definition: (a) source = `estimatedValue` vs summed `paymentAmount`/payments, and (b) revenue date = `convertedAt`. Then apply it consistently: replace `updatedAt`-based monthly bucketing with `convertedAt`, and include leads whose status is `CONVERTED` **or** `TRANSFERRED` (i.e. count anything that was converted). Centralize the logic in one helper so all three call sites agree. No schema change unless I approve. Show the diff, STOP for approval.

---

## P3 — Dead / dev code in the source tree

**Problem:** `Server/src/test-db.ts`, `test-http.ts`, `list-configs.ts` are dev scripts, imported nowhere, shipped in `src`.

**Acceptance:** Removed from `src` (or moved to a `scripts/` folder excluded from the build), build still green.

**Claude Code prompt:**
> Confirm that `Server/src/test-db.ts`, `Server/src/test-http.ts`, and `Server/src/list-configs.ts` are not imported anywhere (`grep -rn` their basenames). If unused, move them to `Server/scripts/` (and exclude `scripts` from `tsconfig` build) or delete them — ask me which. Re-run `tsc --noEmit` to confirm the build stays green. STOP before committing.

---

## P3 — Standardize level-override precedence

**Problem:** `role.level ?? employee.level` (perspective checks) vs `employee.level ?? role.level` (`buildScope`) disagree when an employee's `level` override differs from their role.

**Acceptance:** One precedence helper used everywhere scope/level is resolved; behavior documented.

**Claude Code prompt:**
> Read `Server/src/services/scope.service.ts` and `perspective.service.ts`. There are two different orderings for resolving effective level (`role.level ?? employee.level` vs `employee.level ?? role.level`). Add one shared helper `effectiveLevel({ role, level })` and use it at every site. Ask me which precedence is correct (does a per-employee `level` override the role, or is it a fallback?) before changing behavior. Show all call sites changed, STOP for approval.

---

### Suggested order
P0 (build) → P1 (handoff, lifecycle guard) → P2 (dedup, revenue) → P3 (cleanup, precedence). Each prompt is self-contained; run, review at the STOP gate, approve, move on.
