# Embtel ERP Backend

Modular monolith backend for a multi-business ERP built with Express, PostgreSQL, Prisma, JWT, Redis, Zod, and Winston.

## Architecture

- Clean Architecture style with thin routes and centralized services
- Repository layer for database access
- Hierarchy + Perspective system instead of separate dashboards
- Data scope calculated centrally through recursive hierarchy traversal
- Extensible business, department, team, task, activity, and audit models

## Scripts

```bash
npm install
npm run dev
npm run build
npm run prisma:generate
npm run prisma:seed
```

## Environment

Required variables:

- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`

Optional variables:

- `PORT`
- `REDIS_URL`
- `CORS_ORIGIN`

## Notes

The hierarchy engine uses recursive SQL via Prisma `$queryRaw` for descendant traversal. The perspective engine only allows switching to self or descendants, which keeps the view-as feature safe for business owners and management.
