# Hierarchy Redesign: Immigration Business Deep Structure

## Overview

This document outlines the required changes to implement the requested hierarchy structure under the **Immigration Business**, adding a **Vertical Manager** layer between the Head of Immigration and the three functional teams (Sales, Marketing, Documentation), each with their own Manager → Executive → Intern chain.

---

## 1. Hierarchy Tree Design

```
Super Admin (Level 5)
└── Business Owner (Level 4)
    ├── Immigration Business
    │   └── Head of Immigration (Level 3)
    │       └── Vertical Manager (Level 2)
    │           ├── Sales Head (Level 2)
    │           │   └── Sales Executive (Level 1)
    │           │       └── Sales Intern (Level 0)
    │           ├── Marketing Manager (Level 2)
    │           │   └── Marketing Executive (Level 1)
    │           │       └── Marketing Intern (Level 0)
    │           └── Documentation Manager (Level 2)
    │               └── Documentation Executive (Level 1)
    │                   └── Documentation Intern (Level 0)
    ├── Credential Evaluation Business
    │   └── Head of Evaluation (Level 3)
    │       └── Vertical Manager (Level 2)
    │           ├── Sales Head (Level 2)
    │           ├── Marketing Manager (Level 2)
    │           ├── Documentation Manager (Level 2)
    │           └── Professors (Level 1)
    ├── HR Department
    │   └── HR Manager (Level 3)
    │       └── HR Executive (Level 1)
    │           └── Recruitment Executive (Level 1)
    │               └── HR Intern (Level 0)
    └── IT Services & Inhouse Team
        └── IT Head (Level 3)
            ├── Sales Team Lead (Level 2)
            ├── Marketing Team Lead (Level 2)
            └── Development Team Lead (Level 2)
```

### Key Structural Changes

| Change                                                                     | Description                                                              |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **Vertical Manager added**                                                 | New Level 2 role between Head of Immigration and the three team managers |
| **Sales Head → Sales Executive → Sales Intern**                            | 3-level chain under Sales                                                |
| **Marketing Manager → Marketing Executive → Marketing Intern**             | 3-level chain under Marketing                                            |
| **Documentation Manager → Documentation Executive → Documentation Intern** | 3-level chain under Documentation                                        |
| **HR Intern added**                                                        | New Level 0 under Recruitment Executive                                  |
| **Vertical Manager reports to Head of Immigration**                        | All three team managers report to Vertical Manager                       |

---

## 2. Required Database Changes

### 2.1 Schema Changes (schema.prisma)

**No schema changes required.** The existing schema already supports this hierarchy:

- `Employee.reportsToId` — supports the manager chain
- `Employee.verticalId` — links to the Immigration Operations vertical
- `Employee.teamId` — links to Sales/Marketing/Documentation teams
- `Employee.level` — supports levels 0-5
- `Employee.designation` — stores job title
- `EmployeeHierarchy` — supports recursive hierarchy lookups

The existing models (`Business`, `Vertical`, `Team`, `Employee`, `Role`, `EmployeeHierarchy`) are sufficient.

### 2.2 Vertical & Team Structure (Already Exists)

| Business                          | Vertical                                 | Teams                                  |
| --------------------------------- | ---------------------------------------- | -------------------------------------- |
| Immigration (code: `immigration`) | Immigration Operations (code: `imm-ops`) | Sales Team (code: `imm-sales`)         |
|                                   |                                          | Marketing Team (code: `imm-marketing`) |
|                                   |                                          | Documentation Team (code: `imm-docs`)  |

**No new Verticals or Teams needed.** The existing structure already has the correct setup.

---

## 3. Required Seed Changes

### 3.1 New Designation Templates

Add to `designationTemplates` in `seed.ts`:

```typescript
"Sales Intern": "Sales Intern",
"Marketing Intern": "Marketing Intern",
"Documentation Intern": "Documentation Intern",
"HR Intern": "HR Intern",
```

These already exist in the current seed file.

### 3.2 Employee Creation Order (Immigration Business)

The seed must create employees in this order:

```
1. Super Admin (level 5) — already exists
2. Business Owner (level 4) — already exists
3. Head of Immigration (level 3) — already exists
4. Vertical Manager (level 2) — already exists
5. Sales Head (level 2) — already exists, reportsToId → Vertical Manager
6. Marketing Manager (level 2) — already exists, reportsToId → Vertical Manager
7. Documentation Manager (level 2) — already exists, reportsToId → Vertical Manager
8. Sales Executive (level 1) — already exists, reportsToId → Sales Head
9. Marketing Executive (level 1) — already exists, reportsToId → Marketing Manager
10. Documentation Executive (level 1) — already exists, reportsToId → Documentation Manager
11. Sales Intern (level 0) — already exists, reportsToId → Sales Executive
12. Marketing Intern (level 0) — already exists, reportsToId → Marketing Executive
13. Documentation Intern (level 0) — already exists, reportsToId → Documentation Executive
```

### 3.3 What Already Works

The current seed already creates:

- ✅ Super Admin (level 5)
- ✅ Business Owner (level 4)
- ✅ Head of Immigration (level 3)
- ✅ Vertical Manager (level 2) — reports to Head of Immigration
- ✅ Sales Head (level 2) — reports to Vertical Manager
- ✅ Marketing Manager (level 2) — reports to Vertical Manager
- ✅ Documentation Manager (level 2) — reports to Vertical Manager
- ✅ Sales Executive (level 1) — reports to Sales Head
- ✅ Marketing Executive (level 1) — reports to Marketing Manager
- ✅ Documentation Executive (level 1) — reports to Documentation Manager
- ✅ Interns (level 0) — reports to respective Executives

### 3.4 What Needs to Change in Seed

| Change                              | Current State           | Required State                                                                    |
| ----------------------------------- | ----------------------- | --------------------------------------------------------------------------------- |
| Sales Head `reportsToId`            | `verticalManagerImm.id` | ✅ Already correct                                                                |
| Marketing Manager `reportsToId`     | `verticalManagerImm.id` | ✅ Already correct                                                                |
| Documentation Manager `reportsToId` | `verticalManagerImm.id` | ✅ Already correct                                                                |
| Intern designations                 | Generic "Intern"        | Should be "Sales Intern", "Marketing Intern", "Documentation Intern", "HR Intern" |
| HR Intern                           | Missing                 | Add HR Intern under Recruitment Executive                                         |

**Specific seed changes needed:**

1. **Fix intern designations** — Currently interns get `"${parent.designation?.replace("Executive", "Intern") ?? "Intern"}"` which produces "Sales Intern", "Marketing Intern", "Documentation Intern" correctly. ✅ Already correct.

2. **Add HR Intern** — Currently HR has no intern. Add one under `recruitmentExecutive`:

   ```typescript
   const hrIntern = await prisma.employee.create({
     data: {
       organizationId: organization.id,
       businessId: hrBusiness.id,
       teamId: hrRecruitmentTeam.id,
       verticalId: hrVertical.id,
       roleId: roles[0].id,
       reportsToId: recruitmentExecutive.id,
       firstName: "HR Intern",
       lastName: "Trainee",
       email: "hr.intern@embtelerp.com",
       passwordHash,
       designation: "HR Intern",
       level: 0,
     },
   });
   ```

3. **Ensure intern-to-executive mapping is correct** — The current loop creates interns for each executive. With 9 executive templates × 2 each = 18 executives, and 18 interns. This needs to be verified that the first 3 executives (Sales Exec Imm 1, Sales Exec Imm 2, Marketing Exec Imm 1) get interns with correct designations.

---

## 4. Required RBAC Changes

### 4.1 Role Levels (Already Correct)

| Level | Role           | Employees                                                                                                            |
| ----- | -------------- | -------------------------------------------------------------------------------------------------------------------- |
| 5     | Super Admin    | Super Admin                                                                                                          |
| 4     | Business Owner | Business Owner                                                                                                       |
| 3     | Head           | Head of Immigration, Head of Evaluation, HR Manager, IT Head                                                         |
| 2     | Manager        | Vertical Manager, Sales Head, Marketing Manager, Documentation Manager, Professors, IT Leads                         |
| 1     | Executive      | Sales Executives, Marketing Executives, Documentation Executives, HR Executive, Recruitment Executive, IT Executives |
| 0     | Intern         | Sales Interns, Marketing Interns, Documentation Interns, HR Intern                                                   |

### 4.2 Permission Changes

**No new permissions needed.** The existing permission set covers all roles:

| Permission Code            | Assigned To                     |
| -------------------------- | ------------------------------- |
| `employee.read`            | Business Owner                  |
| `employee.write`           | Business Owner                  |
| `task.read`                | —                               |
| `task.write`               | —                               |
| `audit.read`               | Super Admin                     |
| `marketing.read`           | All roles                       |
| `marketing.write`          | Super Admin, Executive, Manager |
| `marketing.dashboard`      | All roles except Intern         |
| `dashboard.business_owner` | Business Owner                  |
| `dashboard.head`           | Head                            |
| `dashboard.vertical`       | Manager                         |
| `dashboard.team_manager`   | Manager                         |
| `dashboard.employee`       | Executive, Intern               |

### 4.3 What Needs to Change in RBAC

| Change                                                       | Reason              |
| ------------------------------------------------------------ | ------------------- |
| Add `dashboard.vertical` permission to Manager (level 2)     | ✅ Already assigned |
| Add `dashboard.team_manager` permission to Manager (level 2) | ✅ Already assigned |
| Add `dashboard.employee` permission to Executive (level 1)   | ✅ Already assigned |
| Add `dashboard.employee` permission to Intern (level 0)      | ✅ Already assigned |

**No RBAC changes required.** The existing permission assignments already support the new hierarchy.

---

## 5. Required Perspective Changes

### 5.1 Perspective Types (Already Supported)

| Perspective Type | Description         | Used By                                                      |
| ---------------- | ------------------- | ------------------------------------------------------------ |
| `BUSINESS`       | Business-level view | Business Owner                                               |
| `HEAD`           | Head-level view     | Head of Immigration, Head of Evaluation, HR Manager, IT Head |
| `VERTICAL`       | Vertical-level view | Vertical Manager                                             |
| `TEAM`           | Team-level view     | Sales Head, Marketing Manager, Documentation Manager         |
| `EMPLOYEE`       | Employee-level view | Executives, Interns                                          |

### 5.2 Perspective Service Changes

**No changes required to perspective service.** The existing `buildHierarchyTree` function already:

1. ✅ Lists businesses → verticals → teams → employees
2. ✅ Supports VERTICAL perspective type
3. ✅ Supports HEAD perspective type
4. ✅ Supports TEAM perspective type
5. ✅ Validates perspective access via `validatePerspectiveAccess`

### 5.3 Scope Service Changes

**No changes required to scope service.** The existing `buildScope` function already:

1. ✅ Level 5 (Super Admin) — sees everything
2. ✅ Level 4 (Business Owner) — sees own business
3. ✅ Level 3 (Head) — sees business scope via descendants
4. ✅ Level 2 (Manager) — sees own vertical/team via descendants
5. ✅ Level 1 (Executive) — sees self + direct reports
6. ✅ Level 0 (Intern) — sees self only

### 5.4 Dashboard Service Changes

**No changes required.** The existing `determineAggregationLevel` function already maps:

| Perspective Type | Aggregation Level           |
| ---------------- | --------------------------- |
| `BUSINESS`       | `BUSINESS_OWNER` (level 4+) |
| `HEAD`           | `HEAD`                      |
| `VERTICAL`       | `VERTICAL`                  |
| `TEAM`           | `TEAM_MANAGER` (level 2+)   |
| `EMPLOYEE`       | `DESCENDANT` (level 1+)     |

---

## 6. Summary of Required Changes

| #   | Area                    | Change Required                                                               | Complexity |
| --- | ----------------------- | ----------------------------------------------------------------------------- | ---------- |
| 1   | **Schema**              | None — existing schema supports the hierarchy                                 | ✅ None    |
| 2   | **Seed**                | Add HR Intern under Recruitment Executive                                     | Low        |
| 3   | **Seed**                | Verify intern designations are correct (Sales Intern, Marketing Intern, etc.) | Low        |
| 4   | **RBAC**                | None — existing permissions cover all roles                                   | ✅ None    |
| 5   | **Perspective Service** | None — existing code supports VERTICAL, HEAD, TEAM, EMPLOYEE types            | ✅ None    |
| 6   | **Scope Service**       | None — existing level-based scoping works correctly                           | ✅ None    |
| 7   | **Dashboard Service**   | None — existing aggregation levels map correctly                              | ✅ None    |
| 8   | **Hierarchy Service**   | None — existing recursive queries work with the manager chain                 | ✅ None    |

### Actual Code Changes Needed

Only **one file** needs modification: `Server/prisma/seed.ts`

1. Add HR Intern employee record
2. Ensure intern designations are properly mapped to "Sales Intern", "Marketing Intern", "Documentation Intern", "HR Intern"

---

## 7. Verification Checklist

- [ ] Vertical Manager exists and reports to Head of Immigration
- [ ] Sales Head reports to Vertical Manager (not Head of Immigration)
- [ ] Marketing Manager reports to Vertical Manager
- [ ] Documentation Manager reports to Vertical Manager
- [ ] Sales Executive reports to Sales Head
- [ ] Marketing Executive reports to Marketing Manager
- [ ] Documentation Executive reports to Documentation Manager
- [ ] Sales Intern reports to Sales Executive
- [ ] Marketing Intern reports to Marketing Executive
- [ ] Documentation Intern reports to Documentation Executive
- [ ] HR Intern exists and reports to Recruitment Executive
- [ ] All employees have correct `level` values
- [ ] All employees have correct `designation` values
- [ ] `EmployeeHierarchy` records are built correctly for all employees
- [ ] Perspective switching works for VERTICAL, HEAD, TEAM, EMPLOYEE types
- [ ] Dashboard aggregation works at all levels
