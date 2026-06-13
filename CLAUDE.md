# CLAUDE.md — EmbtelERP working agreement

You are working on EmbtelERP, a multi-business ERP. Read this fully before doing anything.

## Repo layout
- `Server/` — Express + TypeScript (ESM), Prisma → PostgreSQL, JWT auth, Zod validation. Dev via `tsx`, build via `tsc`.
- `Client/` — React + Vite + MUI + Redux Toolkit + React Router.
- `docs/` — the source-of-truth specs. **Read the relevant doc before any task:**
  - `docs/PRD.md` — what the system does + scope (Documentation module is OUT of scope).
  - `docs/Data-Dictionary.md` — Prisma models, fields, enums.
  - `docs/API-Reference.md` — every endpoint + guard.
  - `docs/RBAC-and-Perspective-Matrix.md` — the access/perspective model.
  - `docs/Remediation-and-Roadmap.md` — the prioritized backlog; I will point you at one item at a time.

## HARD RULES (never violate without explicit approval)
1. **Additive-only.** Do not modify, rename, drop, or refactor existing tables, columns, routes, components, or services. Only add new ones. New DB columns must be nullable with safe defaults.
2. **No existing UI/UX changes.** Reuse existing shared components and the dashboard engine. Do not restyle or re-lay-out anything that already ships.
3. **No mock / seed / demo data.** Wire to real data; render empty states when there's none.
4. **No destructive migrations.** Additive migrations only. Never DROP / ALTER...DROP / rename without my written go-ahead.
5. **Stay in scope.** Touch only the files the current task needs. Do not "drive-by" fix unrelated things — list them for me instead.

## WORKFLOW (every task)
1. **Plan first.** Start in plan mode. Read the relevant `docs/` file + the actual code, then present a plan and the exact list of files you'll add/change. STOP and wait for my approval.
2. **One backlog item per session/branch.** Don't bundle.
3. **Phase + gate.** For multi-step work, STOP after each phase with a summary + diff and wait for approval before continuing.
4. **Verify before done.** Run `cd Server && npx tsc -p tsconfig.json --noEmit` (must exit 0). Report results.
5. **Never commit without my explicit OK.** I review the diff in VS Code Source Control first.

## Commands
- Server dev: `cd Server && npm run dev` · build/typecheck: `npm run build` / `npx tsc --noEmit` · lint: `npm run lint`
- Client dev: `cd Client && npm run dev` · build: `npm run build`

## Known landmines (see docs/Remediation-and-Roadmap.md)
- `tsc` build currently fails — don't mask errors with @ts-ignore.
- `SalesLead.priority` (hot/warm/cold) != `SalesLead.priorityLevel` (enum). Don't conflate.
- `MarketingLead` and `SalesLead` are NOT linked yet.
- `LeadImmigrationProfile` is redundant/effectively unused — confirm with me before touching it.
- Writes are blocked while a perspective is active (read-only impersonation) — preserve this.
