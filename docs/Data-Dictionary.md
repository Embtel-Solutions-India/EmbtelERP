# EmbtelERP — Data Dictionary

> Companion to PRD §4 & §7. Summarizes the Prisma models (`Server/prisma/schema.prisma`), their key fields, relationships, and the enums that constrain them. Field lists are representative, not exhaustive — consult `schema.prisma` for the full column set and indexes.

## 1. Organizational entities

| Model | Purpose | Key fields | Relations |
|---|---|---|---|
| `Organization` | Top tenant | `name`, `slug` (unique) | → Businesses, Employees |
| `Business` | A line of business | `name`, `code` (unique), `isActive` | → Departments, Verticals, Teams, Employees |
| `Department` | Optional functional unit (self-nesting) | `name`, `code`, `parentId` | tree via `DepartmentTree` |
| `Vertical` | Geographic / line sub-unit (v1, v2…) | `name`, `code` | → Teams, Employees |
| `Team` | Operating team | `name`, `code`, `departmentId?`, `verticalId?` | → Employees |
| `Role` | Numeric role | `name`, `level` (unique), `isSystem` | → RolePermission, Employees |
| `Permission` / `RolePermission` | Granular permission codes | `code` (unique) | join table |
| `Employee` | A person/login | `email` (unique), `passwordHash`, `roleId`, `level?`, `managerId?`, org/business/dept/team/vertical FKs | self-relation `ManagerSubordinates`; owns leads/tasks/etc. |
| `EmployeeHierarchy` | Closure table for fast subtree queries | `employeeId`, `managerId`, `depth` | unique on the triple |
| `PerspectiveSession` | Active perspective per user | `userId`, `perspectiveType`, `perspectiveTargetId` | one per user |
| `Session` | Auth/session store | `token` (unique), `expiresAt`, `data` | — |

## 2. Marketing

| Model | Key fields | Status enum |
|---|---|---|
| `MarketingCampaign` | `name`, budget, dates, `status` | `MarketingCampaignStatus` (DRAFT…CANCELLED) |
| `MarketingTask` | `title`, `status`, assignee | `MarketingTaskStatus` |
| `MarketingLead` | `name`, `source`, `status`, `estimatedValue`, `convertedAt`, `leadScore` (auto, derived via the shared sales `computeLeadScore`), + capture fields synced with `SalesLead` (`company`, `whatsappNumber`, `countryOfResidence`, `nationality`, `visaCategory`, `interestedVisa`, `priorityLevel`, `currentStatus`, `education`, `workExperienceYears`, `familyImmigrationRequired`, `budgetAvailable`, `urgencyLevel`, `priority`/Lead-Temperature, `expectedInvestment`, `consultationRequired`, `consultationDate`) — all nullable; carried into the SalesLead on promotion | `MarketingLeadStatus`, `VisaCategory`, `PriorityLevel`, `LeadCurrentStatus` |
| `MarketingActivity` | `type`, `title`, links to lead/task/campaign | `MarketingActivityType` |
| `MarketingKPI` | `metricType`, `value`, `target`, period | `MarketingKPIType` |

## 3. Sales

| Model | Key fields | Enums |
|---|---|---|
| `SalesLead` | `leadCode` (unique), contact + immigration + qualification + payment + lifecycle fields, `leadScore` (derived), `estimatedValue`, `convertedAt`, `transferredAt`, `marketingLeadId` (nullable, unique — link back to the originating `MarketingLead` when promoted) | `SalesLeadStatus`, `SalesLeadPaymentStatus`, `VisaCategory`, `PriorityLevel`, `LeadCurrentStatus` |
| `SalesTask` | `taskCode` (unique), `taskType`, `status`, `result`, `dueDate`, `nextFollowUpDate` | `SalesTaskType`, `SalesTaskStatus`, `SalesTaskResult` |
| `SalesTarget` (+`SalesTargetHistory`) | `targetCode`, `category`, `metric`, `targetValue`, parent/child breakdown, assignment | `SalesTargetCategory/Metric/Status`, `SalesTargetHistoryAction` |
| `LeadAssignmentHistory` | never-overwritten ownership chain per `SalesLead`: `leadId`, `fromEmployeeId`/`toEmployeeId` (soft refs), `changedById`, `reason`, `note`, `createdAt` | `LeadAssignmentReason` |
| `LeadStatusHistory` | never-overwritten lifecycle trail per `SalesLead`: `leadId`, `fromStatus`/`toStatus`, `changedById`, `note`, `createdAt`. Writes gated by the transition state-machine in `salesLead.service` | `SalesLeadStatus` |

### Enum reference (selected)
- **`SalesLeadStatus`:** NEW · CONTACTED · CONSULTATION_SCHEDULED · DOCUMENTS_REQUESTED · QUALIFIED · CONVERTED · TRANSFERRED · LOST
- **`SalesLeadPaymentStatus`:** INITIATED · IN_PROGRESS · DONE · PARTIALLY_DONE
- **`VisaCategory`:** H1B · L1A · L1B · O1 · TN · E3 · EB1 · EB2_NIW · FAMILY_GREEN_CARD · MARRIAGE_BASED · BUSINESS_VISA · VISITOR_VISA · PERMANENT_RESIDENCY
- **`SalesTaskResult`:** CONNECTED · NO_RESPONSE · INTERESTED · NOT_INTERESTED · CALL_BACK_LATER · CONSULTATION_BOOKED · DOCUMENTS_RECEIVED · PAYMENT_RECEIVED · CONVERTED · LOST_LEAD
- **`LeadAssignmentReason`:** CREATED · PROMOTED_FROM_MARKETING · REASSIGNED · TRANSFERRED

> **Field-naming caution:** `SalesLead.priorityLevel` (PriorityLevel enum) and `SalesLead.priority` (string `hot`/`warm`/`cold`, labeled "Interested Level" in the UI) are two distinct fields. Don't conflate them.

## 4. Cross-cutting

| Model | Purpose | Enum |
|---|---|---|
| `Task` | Generic task (separate from Sales/Marketing tasks); links to `SalesLead` via `SalesLeadTasks` | — |
| `Document` | File/metadata records | — |
| `Activity` | Lightweight activity feed | — |
| `AuditLog` | Immutable before/after audit trail | `ActivityAction` (CREATE…PERSPECTIVE_SWITCH, LOGIN/LOGOUT) |
| `Notification` | Actor→recipient notifications | — |
| `DashboardConfig` | Role-driven widget layout config | — |
| `CalendarEvent` | Scheduling | `CalendarEventType/Status/Priority` |

## 5. Lead history model (important)
There are **no dedicated append-only `LeadAssignmentHistory` / `LeadStatusHistory` tables.** Lead ownership and status history are reconstructed from `AuditLog` entries (`ASSIGNMENT_CHANGE`, `STATUS_CHANGE`, `PAYMENT_STATUS_CHANGE`, each with `before`/`after` JSON) plus the `Activity` feed. If a strict, first-class lead-journey table is required, it must be added (see Remediation).

## 6. Conventions
- IDs: `cuid()`. Money: `Decimal(14,2)`. Human codes: `LD-000123`, `taskCode`, `targetCode`, business/dept/vertical `code`.
- Timestamps: `createdAt` / `updatedAt` on nearly all models.
- Heavy indexing on FK columns (org/business/team/vertical/assignee/status) for scoped queries.
