# Business Hierarchy System

## Overview

The EmbtelERP hierarchy system implements a multi-level organizational structure with perspective-based data access. The hierarchy flows from Super Admin down through Business Owner, Business Heads, Vertical Managers, Team Managers, and Employees.

## Hierarchy Structure

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
    │   └── HR Manager (Level 2)
    │       └── HR Executive (Level 1)
    │           ├── Recruitment Executive (Level 1)
    │           └── HR Intern (Level 0)
    └── IT Services & Inhouse Team
        └── IT Head (Level 2)
            ├── Sales Team
            ├── Marketing Team
            └── Development Team
```

## Role Levels

| Level | Role                            | Scope                 |
| ----- | ------------------------------- | --------------------- |
| 5     | Super Admin                     | Everything            |
| 4     | Business Owner                  | All businesses        |
| 3     | Head (of Business)              | Business scope        |
| 2     | Vertical Manager / Team Manager | Vertical / Team scope |
| 1     | Executive                       | Self + direct reports |
| 0     | Intern                          | Self only             |

## Database Models

### Employee

- `id` - UUID primary key
- `businessId` - FK to Business
- `verticalId` - FK to Vertical (nullable)
- `teamId` - FK to Team (nullable)
- `departmentId` - FK to Department (nullable)
- `roleId` - FK to Role
- `reportsToId` - FK to Employee (manager)
- `managerId` - FK to Employee (alternative manager reference)
- `level` - Numeric level (0-5)
- `designation` - Job title string
- `isActive` - Soft delete flag

### Business

- `id` - UUID primary key
- `name` - Business name
- `code` - Business code
- `organizationId` - FK to Organization
- `isActive` - Soft delete flag

### Vertical

- `id` - UUID primary key
- `name` - Vertical name
- `code` - Vertical code
- `businessId` - FK to Business
- `isActive` - Soft delete flag

### Team

- `id` - UUID primary key
- `name` - Team name
- `code` - Team code
- `businessId` - FK to Business
- `verticalId` - FK to Vertical (nullable)
- `isActive` - Soft delete flag

## Perspective Types

| Type         | Description         | Target          |
| ------------ | ------------------- | --------------- |
| ORGANIZATION | Entire organization | Organization ID |
| BUSINESS     | Single business     | Business ID     |
| HEAD         | Business head scope | Employee ID     |
| VERTICAL     | Vertical scope      | Vertical ID     |
| DEPARTMENT   | Department scope    | Department ID   |
| TEAM         | Team scope          | Team ID         |
| EMPLOYEE     | Individual employee | Employee ID     |

## API Endpoints

### Hierarchy

- `GET /hierarchy/tree` - Get hierarchy tree for current perspective
- `GET /hierarchy/organization-tree` - Get full organization tree
- `GET /hierarchy/business/:businessId/tree` - Get business hierarchy
- `GET /hierarchy/descendants/:id` - Get employee descendants
- `GET /hierarchy/ancestors/:id` - Get employee ancestors
- `GET /hierarchy/node-descendants/:id` - Get node descendants with details
- `GET /hierarchy/available-perspectives` - Get available perspectives
- `GET /hierarchy/managers/:id` - Get employee managers

### Dashboard

- `GET /dashboard/overview` - Dashboard overview with KPIs
- `GET /dashboard/performance` - Performance metrics
- `GET /dashboard/insights` - AI-like insights
- `GET /dashboard/team` - Team rankings

### Perspectives

- `GET /perspectives` - Get available perspectives
- `GET /perspectives/current` - Get current perspective
- `POST /perspectives/switch` - Switch perspective
- `POST /perspectives/reset` - Reset to self

## Permission Enforcement

Permissions are enforced at multiple levels:

1. **Authentication Middleware** - Validates JWT token
2. **Scope Middleware** - Attaches data scope based on role
3. **Perspective Service** - Validates perspective access
4. **Dashboard Service** - Filters data by scope

### Access Rules

- **Super Admin (Level 5)**: Access to everything
- **Business Owner (Level 4)**: Access to own business, all verticals/teams
- **Head (Level 3)**: Access to own business scope
- **Vertical Manager (Level 2)**: Access to own vertical and teams
- **Team Manager (Level 2)**: Access to own team
- **Executive (Level 1)**: Self + direct reports
- **Intern (Level 0)**: Self only

## Data Flow

1. User authenticates → JWT issued
2. Frontend fetches available perspectives → Hierarchy tree displayed
3. User selects perspective → POST /perspectives/switch
4. Dashboard fetches data → GET /dashboard/overview (respects perspective)
5. Backend validates access → Filters data by scope
6. Frontend renders dashboard → Auto-refreshes on perspective change

## Frontend Components

### Sidebar

- Displays hierarchy explorer tree
- Shows breadcrumb navigation for current perspective
- Allows clicking any node to switch perspective
- Shows VERTICAL, HEAD, TEAM, EMPLOYEE node types

### Dashboard

- Fetches data based on active perspective
- Shows stat cards, performance charts, insights
- Auto-refreshes when perspective changes
- Displays team rankings

### Redux Slice (perspectiveSlice)

- `fetchPerspectives` - Get available perspectives
- `switchPerspective` - Switch to target
- `resetPerspective` - Reset to self
- `fetchCurrentPerspective` - Get current perspective info
- `fetchOrganizationTree` - Get full org tree
- `fetchBusinessTree` - Get business tree

## Testing

### Hierarchy Tree Tests

- Test full organization tree structure
- Test business hierarchy tree
- Test node ancestors/descendants
- Test perspective switching

### Dashboard Tests

- Test overview aggregation
- Test performance metrics
- Test insights generation
- Test team rankings

### Permission Tests

- Test Super Admin access
- Test Business Owner access
- Test Head access
- Test Vertical Manager access
- Test Team Manager access
- Test Executive access
- Test Intern access
- Test cross-business denial
