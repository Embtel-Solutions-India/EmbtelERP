# EmbtelERP — RBAC & Perspective Access Matrix

> Companion to PRD §5–6. Describes the authorization model exactly as enforced in code (`rbac.middleware.ts`, `scope.middleware.ts`, `scope.service.ts`, `perspective.service.ts`). Use this as the source of truth for any access-control work.

## 1. Role levels

| Level | Role | Org-chart equivalent |
|---|---|---|
| 0 | Intern | Sales/Marketing/Doc Intern |
| 1 | Executive | Sales/Marketing Executive, Recruitment Exec |
| 2 | Manager | Vertical Manager, Team/Sales/Marketing Manager |
| 3 | Head | Head of Immigration/Evaluations/IT, HR Manager |
| 4 | Business Owner | Business Owner Dashboard |
| 5 | Super Admin | Super Admin Dashboard |

`Employee.level` may override `Role.level` per person. **Known inconsistency:** the codebase resolves this override in two different orders (`role.level ?? employee.level` in perspective checks vs `employee.level ?? role.level` in `buildScope`). Standardize before relying on overrides.

## 2. Data-scope by level (what each level can *read*)

| Level | visibleEmployees | visibleBusinesses |
|---|---|---|
| 5 Super Admin | all employees | all businesses |
| 4 Business Owner | all employees in their organization | all businesses in their org |
| 3 Head | self + full descendant subtree; dept/team rolled up in their business | own business |
| 2 Manager | self + subtree; scoped to own vertical/team | own business |
| 0–1 Intern/Executive | self + direct subtree | own business |
| HR "workforce manager" (special case) | org-wide **employees only**; operational data (leads/sales) stays pinned to own business | own business |

Scope is computed once per request by `attachScope` and cached 60s per `user:perspective`.

## 3. Perspective switching rules

- One active `PerspectiveSession` per user at a time.
- A user may switch to: a Business / Business-Owner node (L4+ only), a Vertical or Team (must be in their business; L2 limited to own vertical/team), a Head node, or any descendant Employee.
- **Cannot** switch to a higher level than their own, cross-business, or cross-organization.
- **Impersonation is read-only:** while any non-self perspective is active, all `POST/PUT/PATCH/DELETE` return `403`. Switching changes what you *see*, never what you can *do*.
- Every switch writes an `AuditLog` entry (`PERSPECTIVE_SWITCH`).

## 4. Action matrix — Sales Leads (representative module)

Enforced inside `salesLead.service.ts`, not route middleware.

| Action | Intern (0) | Executive (1) | Manager (2) | Head (3) | Owner/Admin (4–5) |
|---|---|---|---|---|---|
| List leads | own only | own only | team/subtree | business | org / all |
| Create lead | ✗ (needs ≥1) | ✓ self-assigned | ✓ assign in scope | ✓ | ✓ |
| Update own lead | ✗ | ✓ | ✓ | ✓ | ✓ |
| Reassign (`assignedToId`) | ✗ | ✗ | ✓ in scope | ✓ | ✓ |
| Convert / Transfer | own only | own only | in scope | ✓ | ✓ |
| Delete lead | ✗ | ✗ | ✓ | ✓ | ✓ |

## 5. Route-level guards (where applied)

| Router | Guard |
|---|---|
| `/admin/*` | `requireRole(SUPER_ADMIN)` + per-route `requirePermission` (`roles:write`, `audit:read`) |
| `/immigration/*` | `requireRole(HEAD)` |
| `/hierarchy/organization-tree` | `requireRole(BUSINESS_OWNER)` + `requirePermission("dashboard:org")` |
| `/employees` writes | `requireRole(HEAD)` + `requirePermission("employees:write")` |
| `/sales/*`, `/marketing/*` | `authenticate` + `attachScope` only — **authorization enforced in-service** |
| everything else | `authenticate` + `attachScope` |

**Consistency note:** Sales/Marketing rely on in-service role checks rather than route middleware. That works, but a route-level `requireRole`/`requirePermission` pass would make the policy auditable in one place and prevent a future handler from forgetting the in-service check.

## 6. Permission codes seen in code
`audit:read`, `roles:write`, `employees:write`, `dashboard:org`. (Defined via `Permission` + `RolePermission`; extend here as new gated actions are added.)
