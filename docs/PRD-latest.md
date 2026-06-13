# EmbtelERP — Product Requirements Document (Consolidated, Latest)

**Version:** 1.5 (consolidated) · **Date:** June 13, 2026
**Supersedes:** PRD 14 (codebase-grounded) — keeps its scope as the system of record
**Method:** PRD 14 defines *what we build now*. Detail is pulled from PRD 13 **only** where it fills a gap in a requirement that already exists in PRD 14. Everything PRD-13-only is deferred (see §11). Items required by PRD 13 but not yet in the codebase are tagged **(enhancement)**; everything else reflects current behavior.

---

## 1. Overview

EmbtelERP is a multi-business, role-based ERP for an organization running several lines of business (Immigration, Credentials/International Evaluation, plus internal HR and IT) under one umbrella, sized for ~50–100 employees across verticals (brands). Its defining trait is a **perspective-based access system**: a senior user can switch perspective to see the system exactly as a business, vertical, team, or subordinate sees it, while what they can read or change is enforced server-side by their place in the hierarchy.

**Initial operational scope (this version):** Authentication & role-based navigation, the perspective system, the **Marketing** module, the **Sales** module (Leads, Tasks, Targets/KPIs), the **Immigration Head** analytics dashboard, and shared cross-cutting services (calendar, audit, activity, dashboard engine). All other business modules from the long-term vision are deferred (§11).

**Architecture:** TypeScript/Express + Prisma/PostgreSQL API; React (Vite + MUI + Redux Toolkit) client. Responsive web (desktop + mobile).

## 2. Goals

- Give every role a dashboard and navigation scoped to exactly what they may see — no more, no less.
- Let managers operate "as" their subordinates (read-only) for oversight, without separate logins.
- Run Marketing and Sales operations of each business (campaigns, leads, follow-up tasks, targets/KPIs) in one system.
- Give the business head a single analytics surface across all verticals (KPIs, leads, revenue, team, approvals, escalations).
- Keep a complete, queryable, immutable audit trail of who did what, when.

## 3. Tech Stack

| Layer | Technology |
|---|---|
| API | Node.js, Express 4, TypeScript (ESM) |
| ORM / DB | Prisma → PostgreSQL |
| Auth | JWT (access tokens), bcryptjs |
| Validation | Zod (per-route body schemas) |
| Caching | Redis (+ in-process scope cache) |
| Logging | Winston |
| Tests | Vitest |
| Client | React 18, Vite, MUI, Redux Toolkit, React Router, react-hook-form, Recharts, dnd-kit |

> Conflict resolved: PRD 13 proposed Next.js + shadcn/Tailwind + Vercel/Supabase. The shipped system is Express + React/MUI; the current stack stands.

## 4. Organizational Model

```
Organization
  └─ Business (e.g. Immigration, Credentials Evaluation, HR, IT)
       ├─ Department (optional, parent/child tree)
       ├─ Vertical  (geographic / brand sub-units, e.g. v1, v2, v3 — added via config)
       │     └─ Team   (Sales, Marketing; other team types deferred)
       └─ Team → Employee
```

Every `Employee` belongs to one organization and business, optionally a department, vertical, and team, and carries a `managerId` (+ a denormalized `EmployeeHierarchy` closure table with `depth`) so subtrees resolve in one query. New verticals are added via admin config.

### 4.1 Roles & levels

| Level | Role | Org-chart / PRD-13 equivalent |
|---|---|---|
| 0 | Intern | Sales/Marketing Intern |
| 1 | Executive | Sales/Marketing team member |
| 2 | Manager | **Team Lead** — one per vertical, manages the teams beneath |
| 3 | Head | **General Manager / brand head** — sees all verticals in the business |
| 4 | Business Owner | Owner — all businesses in the org |
| 5 | Super Admin | Sees everything |

`Employee.level` may override `Role.level` per person. *(Standardize the override precedence — see remediation backlog.)*

## 5. Perspective System (core differentiator)

### 5.1 Concept
A user has a home scope (self + subtree) and may switch perspective to any node they're authorized for — Business, Vertical, Team, or a subordinate Employee. A `PerspectiveSession` row records the one active perspective per user. This is the productized form of PRD 13's "tenant scoping: every query auto-filtered by vertical."

### 5.2 Enforcement (server-side, defense-in-depth)
- `authenticate` → verifies JWT, populates `req.user`.
- `attachScope` → loads the active `PerspectiveSession`, computes the effective `DataScope` (`visibleEmployees`, `visibleBusinesses`, `visibleDepartments`, `visibleTeams`), attaches `currentPerspective` / `effectiveUser`.
- **Read-only impersonation:** while a non-self perspective is active, any `POST/PUT/PATCH/DELETE` returns 403. Switching is for viewing, never acting as someone else.
- `validatePerspectiveAccess` + `validateScopeBoundaries` enforce target within business/vertical/team and at/below the viewer's level (no escalation, no cross-business/cross-org reads).
- Resolution by level: L5 → all; L4 → whole organization; HR "workforce managers" → org-wide *employee* visibility but operational data pinned to their business; everyone else → own node + descendant subtree.

### 5.3 Performance
`getDataScope` caches the resolved promise keyed by `user:perspective` for 60s so the ~15 concurrent requests a dashboard fires collapse into one computation; `invalidateScopeCache(userId?)` clears it after hierarchy/role mutations.

## 6. Auth, Account Lifecycle & Navigation

- **Login:** email + password (no social auth). JWT carries `employeeId`, `organizationId`, `roleLevel`, `employeeLevel`, `permissions`.
- **Permissions:** `Permission` + `RolePermission` codes gate sensitive admin/employee/hierarchy/immigration routes via `requirePermission` / `requireRole`.
- **Password reset via email.** **(enhancement)**
- **Account activation / deactivation** by Admin or Super Admin (`Employee.isActive`).
- **Dynamic, role-aware navigation** — sidebar items driven by role + permissions + module + vertical rather than hardcoded routes: collapsible groups, in-sidebar search, favorites/pinned, recently accessed, and role-aware quick actions (e.g. Sales → "Add Lead"). **(enhancement — client currently uses static route maps.)**

## 7. Modules

### 7.1 Marketing
Models: `MarketingCampaign`, `MarketingTask`, `MarketingLead`, `MarketingActivity`, `MarketingKPI`.
- Campaigns (DRAFT→ACTIVE→PAUSED→COMPLETED→CANCELLED); tasks (TODO→…→COMPLETED); leads (NEW→CONTACTED→QUALIFIED→CONVERTED→LOST); activity logging; KPI tracking.
- Role-scoped dashboards: `/marketing/dashboard/{manager,executive,intern}`. All records tagged org/business/vertical/team and filtered by `DataScope`.
- **Lead capture synced with Sales:** `MarketingLead` carries the same qualification fields as the Sales Add-Lead form (contact, visa/immigration interest, budget, urgency, interested level, consultation) plus an auto `leadScore` (derived by the shared `computeLeadScore` — no second scorer). All fields nullable/additive.
- **Marketing → Sales handoff:** `POST /marketing/leads/:id/promote` (Marketing Executive+; body `{ assignedToId, teamId?, verticalId? }`). Creates a linked `SalesLead` (assigned to a Sales Executive within the promoter's scope), **copies the synced capture fields across**, marks the marketing lead `CONVERTED`, and records the ownership-chain events — all in one transaction. The `SalesLead.marketingLeadId` link is unique, so a marketing lead can be promoted at most once.
- **Tracked work-unit fields (from PRD 13):** campaign name & type, target audience, service promoted, emails sent, open rate, click rate, leads generated, conversions. **(enhancement where fields are not yet modeled.)**

### 7.2 Sales — Leads
Model: `SalesLead` (immigration fields live directly on `SalesLead`; the redundant 1:1 `LeadImmigrationProfile` was consolidated away and dropped — see remediation P2).
- **Lifecycle:** `NEW → CONTACTED → CONSULTATION_SCHEDULED → DOCUMENTS_REQUESTED → QUALIFIED → CONVERTED → TRANSFERRED` (+ `LOST`). Interested level: Hot / Warm / Cold.
- **Pipeline stages configurable per vertical.** **(enhancement — stages are a fixed enum today.)**
- **Lead source tracking** with a controlled list: campaign, referral, walk-in, website (+ Facebook/Google/WhatsApp as used). **(enhancement — `source` is currently a free string.)**
- **Assignment:** executives self-assigned; managers (L2+, e.g. Team Lead) assign within scope.
- **Follow-up scheduling with reminders.** **(enhancement — `SalesTask.nextFollowUpDate` exists; reminder notifications are not yet wired.)**
- **Lead-to-client conversion workflow:** `POST /sales/leads/:id/convert`; transfer to next stage via `POST /sales/leads/:id/transfer` (only from QUALIFIED/CONVERTED).
- **Lead score** is derived (read-only), 0–100, recomputed on every create/update from interested level, urgency, budget, experience, consultation, family, and stage.
- **Payment / billing (manual record-keeping, no gateway):** `paymentStatus` (INITIATED / IN_PROGRESS / PARTIALLY_DONE / DONE), `paymentAmount`, plus `paymentDate` and `paymentMethod` (free text: cash/check/wire/card). **(enhancement — date/method fields net-new.)**
- **Revenue (one definition, `services/revenue.ts`):** revenue = Σ collected `paymentAmount` of leads that were converted (`convertedAt` set, so converted-then-transferred still counts), dated/bucketed by `convertedAt` — never `updatedAt`. Applied consistently across immigration analytics, `/sales/leaderboard`, and `/sales/team-stats`. (Pipeline funnel `value` is `estimatedValue` — potential, not collected revenue.)
- **Sales work-unit / KPI inputs (from PRD 13):** calls made, emails sent, leads added, deal value, daily revenue, weekly forecast, service interest, visa category. Surfaced on the Sales Executive dashboard. **(enhancement where not yet captured.)**
- **Ownership chain:** `LeadAssignmentHistory` records every ownership change (initial assignment, Marketing→Sales promotion, reassignment, transfer) as a never-overwritten row. Read via `GET /sales/leads/:id/history`.
- **Lifecycle state machine:** status changes are validated against a single transition map (e.g. `NEW→{CONTACTED,LOST}`, `QUALIFIED→{CONVERTED,TRANSFERRED,LOST}`, `CONVERTED→{TRANSFERRED}`); illegal jumps return 400. Conversion additionally requires `paymentStatus` of `PARTIALLY_DONE` or `DONE`. Every change is recorded in `LeadStatusHistory`, read via `GET /sales/leads/:id/status-history`.
- **Lead timeline (one-screen view):** `GET /sales/leads/:id/timeline` — a read-only projection returning `{ lead, origin, summary, timeline }`. The `timeline` merges status, ownership, follow-up-task, and payment events chronologically; `summary` surfaces origin (generated-by), first contact, consultation, conversion, transfer, current owner, and collected payment. Read-only — not a source of truth.
- API: `GET/POST /sales/leads`, `PATCH/DELETE /sales/leads/:id` (delete L2+), `GET /sales/leads/:id/history`, `GET /sales/leads/:id/status-history`, `GET /sales/leads/:id/timeline`, `POST /sales/leads/:id/{convert,transfer}`.

### 7.3 Sales — Tasks
Model: `SalesTask` — typed follow-ups (Call, WhatsApp, Email, Consultation, Document Collection, Payment Follow-up, etc.) with result, next-follow-up date, completion. API `/sales/tasks`.
- Managers (Team Lead) may assign tasks to any member in their vertical scope.
- **Due-date reminders / notification alerts** on tasks. **(enhancement.)**

### 7.4 Sales — Targets & KPIs
Models: `SalesTarget` (+ `SalesTargetHistory`). Hierarchical targets (parent/child) by category/metric (leads, activity, conversion, revenue), with assignment, reassignment, cancellation, and full history. `/sales/targets/*`, plus `/sales/leaderboard` and `/sales/team-stats`.
- **Configurable KPI targets per role per vertical; actual-vs-target %.** Managers set targets, Head reviews, Super Admin overrides.
- **Condition bands (from PRD 13):** Power ≥100% · Affluence 80–99% · Normal 60–79% · Emergency 40–59% · Danger <40%. **(enhancement — band classification net-new.)**

### 7.5 Business / Immigration Head Dashboard & Reporting
Read-only analytics (requires `HEAD`+): `/immigration/{tree,kpis,verticals,verticals/:id,leads,revenue,cases,team,team/:id,approvals,escalations,reports}` + `PATCH /immigration/approvals/:taskId`. Aggregates across all verticals in scope.
- **Report types (from PRD 13):** personal performance (member), team (manager), cross-vertical (head), pipeline analytics, conversion funnels, revenue forecasting. **(enhancement where reports don't yet exist.)**

### 7.6 Cross-cutting services
- **Dashboard engine:** `DashboardConfig` + `defaultDashboardConfig` + client `DashboardLayoutEngine` render role-driven widget layouts; `resolveAggregationScope` centralizes scope→employee/team-id resolution.
- **Calendar & meetings:** `CalendarEvent` (type/status/priority) under `/calendar`. Meeting types (client consultation, team standup, review, etc.), daily/weekly/monthly/team views, participant availability checking, and auto-reminders. **(enhancement for views/availability/reminders.)** External Zoom/Google integrations deferred (§11).
- **Tasks (generic):** `Task` model under `/tasks`, distinct from Sales/Marketing tasks.
- **Activity & Audit:** `Activity` (per-user feed; viewable by manager for own team, head for own business, admin/super-admin) and `AuditLog` — immutable before/after snapshots with action classification (CREATE/UPDATE/STATUS_CHANGE/PAYMENT_STATUS_CHANGE/ASSIGNMENT_CHANGE/PERSPECTIVE_SWITCH/LOGIN/LOGOUT). **Add `ipAddress` to audit entries** for compliance. **(enhancement.)**
- **In-app notifications & reminders:** `Notification` (actor→recipient) for meeting scheduled, task assigned, follow-up/RFE deadlines, approvals. In-app + email channels only in this scope. **(enhancement — model exists; routing/reminders not yet wired.)** SMS/Twilio/WhatsApp deferred (§11).
- **Employees / Hierarchy / Admin:** CRUD and org-structure management, permission-gated.

## 8. Data Integrity & History
No dedicated append-only `*History` tables for leads; lead ownership and status history are reconstructed from `AuditLog` (`ASSIGNMENT_CHANGE`, `STATUS_CHANGE`, `PAYMENT_STATUS_CHANGE` with before/after) plus the `Activity` feed. A first-class lead-journey table may be added if strict, queryable history is required (remediation backlog).

## 9. Non-functional Requirements
- **Scope enforced server-side** for every read and write; the client never decides visibility. Impersonation is strictly read-only.
- **Scale:** ~50–100 employees across verticals.
- **Responsive** desktop + mobile from day one.
- **Performance targets:** page load < 2s; standard CRUD API < 500ms; lead/list queries paginated.
- **Pagination:** default page size 20, max 100; report default date range 1 year.
- **Money** fields `Decimal(14,2)`; human-readable unique codes (`LD-000123`, task/target codes).
- **Field validation:** names (letters/hyphens/apostrophes, ≤50 chars), email (RFC 5322), phone (international), dates well-formed.
- Scope computation must not add per-widget DB round-trips (promise cache).

## 10. Primary User Journeys
1. **Sales Executive:** create/qualify lead → log follow-up tasks (with reminders) → convert → transfer; own-KPI dashboard.
2. **Sales Head / Team Lead (Vertical Manager):** team leaderboard, team-stats, all in-scope leads; set/assign targets; review KPI bands.
3. **Marketing:** run campaigns, capture leads, log activities, track KPIs; (future) hand leads to Sales.
4. **Business Owner / Head:** switch perspective across businesses/verticals; read aggregated KPIs, revenue, approvals, escalations, reports.
5. **Any manager:** switch into a subordinate's perspective (read-only) to review their day.

## 11. Out of Scope / Deferred (this version)

Carried over from PRD 14 and expanded with PRD-13-only scope that we are **not** building initially:

- **Documentation / Case-management:** no `Case` model or Documentation workspace; `SalesLead.status = TRANSFERRED` only marks intent to hand off.
- **Visa Services / INS Zoom case lifecycle:** USCIS case entities, form templates (I-129/I-140), dynamic form-filling/auto-fill, petition assembly, filing/RFE tracking, OCR (Document AI), S3 document vault, concurrency locks.
- **International Evaluation specifics:** evaluation orders, Professor management, expert-letter tracking, IE QC workflow.
- **HR module (full):** onboarding flows, attendance/work-hour tracking, leave management, hiring/ATS, discipline/compliance, EOD reports. (Account activation in §6 is the only HR-adjacent piece kept.)
- **IT Development module:** sprint board, issue/ticket system, feedback forms, credential vault, IT reporting.
- **Client portal (USAIS):** separate app, client auth, client document submission, OCR review.
- **External integrations:** Twilio click-to-call/SMS, SMTP2GO/email-provider campaigns, WhatsApp, Google Calendar/Zoom/Meet, AWS S3.
- **Other PRD-13 features:** global search, knowledge base / SOPs, corporation/university partner management, client intake-form links, document management as a standalone module.
- **Marketing → Sales handoff** as a productized link (planned next — §12).

## 12. Initial Build Sequencing
Build only §1–§10 scope. Recommended order (pairs with the remediation/roadmap backlog):
1. **Stabilize:** fix the failing `tsc` build; standardize level-override precedence; remove dead/dev scripts.
2. **Sales lifecycle integrity:** state-machine guard on status transitions; single revenue definition; consolidate the duplicate immigration profile / lead-score.
3. **Marketing → Sales handoff:** first-class promotion of a `MarketingLead` into a `SalesLead` with ownership history.
4. **Enhancements (as prioritized):** reminders/notifications, KPI condition bands, configurable pipeline stages, dynamic sidebar, payment date/method, audit `ipAddress`, report types.

---

## Appendix A — Gap-fill provenance (what came from PRD 13)
| PRD 14 requirement | Detail added from PRD 13 |
|---|---|
| Auth (§6) | Email/password only, password reset, account activation/deactivation, dynamic role-aware sidebar |
| Org model (§4) | GM=Head/brand, TL=Manager-per-vertical, team types, ~50–100 scale, config-added verticals |
| Marketing (§7.1) | Campaign/marketing work-unit fields & KPI inputs |
| Sales Leads (§7.2) | Configurable pipeline stages, source list, follow-up reminders, conversion workflow, sales work-units, payment date/method (manual billing) |
| Sales Tasks (§7.3) | Manager-assigns-in-vertical, due-date reminders |
| Targets/KPIs (§7.4) | Per-role/vertical targets, Power/Affluence/Normal/Emergency/Danger bands |
| Head dashboard (§7.5) | Personal/team/cross-vertical reports, funnels, revenue forecasting |
| Cross-cutting (§7.6) | Meeting types/views/availability, audit `ipAddress`, activity-feed viewer scoping, in-app notifications |
| NFRs (§9) | Scale, mobile, perf targets, pagination, field validation |

## Appendix B — Conflicts resolved
- **Stack:** PRD 13 (Next.js/shadcn/Vercel) → superseded by shipped Express + React/MUI.
- **Role naming:** PRD 13 names (Super Admin / GM / TL / member) mapped onto PRD 14 numeric levels 0–5; numeric levels are authoritative.
- **Documentation/Case flow:** PRD 13 treats it as core; kept out of scope per PRD 14.
