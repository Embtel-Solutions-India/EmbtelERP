/**
 * Central role → dashboard route resolver.
 *
 * Priority order:
 *   1. `user.role` — exact enum match (most precise, requires backend to send it)
 *   2. `user.designation` — keyword substring match (case-insensitive)
 *   3. `user.roleLevel` / `user.employeeLevel` — numeric level fallback
 *
 * Role enum values expected from POST /auth/login  { employee.role }:
 *   SUPER_ADMIN | BUSINESS_OWNER | HEAD_OF_IMMIGRATION | HEAD_OF_EVALUATION
 *   VERTICAL_MANAGER | SALES_HEAD | MARKETING_MANAGER | DOCUMENTATION_MANAGER
 *   SALES_EXECUTIVE | MARKETING_EXECUTIVE | DOCUMENTATION_EXECUTIVE
 *   SALES_INTERN | MARKETING_INTERN | DOCUMENTATION_INTERN
 *   HR_MANAGER | HR_EXECUTIVE | RECRUITMENT_EXECUTIVE | PROFESSOR
 *
 * Level semantics (mirrors Server Role.level):
 *   5 = Super Admin
 *   4 = Business Owner
 *   3 = Business Head (Immigration Head, Evaluation Head, etc.)
 *   2 = Manager tier (Vertical Manager, Sales Head, Marketing Manager, etc.)
 *   1 = Executive tier (Sales Exec, Marketing Exec, HR, IT, etc.)
 *   0 = Intern
 */

export const ROLE_DASHBOARD_MAP = {
  SUPER_ADMIN:             '/super-admin/dashboard',
  BUSINESS_OWNER:          '/owner/dashboard',
  HEAD_OF_IMMIGRATION:     '/head/dashboard',
  HEAD_OF_EVALUATION:      '/head-evaluation/dashboard',
  VERTICAL_MANAGER:        '/vertical/dashboard',
  SALES_HEAD:              '/sales-manager/dashboard',
  MARKETING_MANAGER:       '/marketing-manager/dashboard',
  DOCUMENTATION_MANAGER:   '/documentation-manager/dashboard',
  SALES_EXECUTIVE:         '/sales/dashboard',
  MARKETING_EXECUTIVE:     '/marketing/dashboard',
  DOCUMENTATION_EXECUTIVE: '/documentation/dashboard',
  SALES_INTERN:            '/sales-intern/dashboard',
  MARKETING_INTERN:        '/marketing-intern/dashboard',
  DOCUMENTATION_INTERN:    '/documentation-intern/dashboard',
  HR_MANAGER:              '/hr/dashboard',
  HR_EXECUTIVE:            '/hr-executive/dashboard',
  RECRUITMENT_EXECUTIVE:   '/recruitment/dashboard',
  PROFESSOR:               '/professor/dashboard',
}

// Designation keyword → route. Checked in order; first match wins.
// Uses designation.includes(keyword) — case-insensitive.
const DESIGNATION_ROUTE_MAP = [
  // IT development team (own isolated dashboard) — must win over the generic
  // 'sales'/level fallbacks below, so IT devs/leads don't land on Sales.
  [['it head', 'development team lead', 'developer'],  '/it/dashboard'],
  [['super admin'],                                    '/super-admin/dashboard'],
  [['immigration head', 'head of immigration'],         '/head/dashboard'],
  [['evaluation head', 'head of evaluation'],           '/head-evaluation/dashboard'],
  [['vertical manager'],                                '/vertical/dashboard'],
  [['business owner'],                                  '/owner/dashboard'],
  [['sales head', 'sales manager'],                     '/sales-manager/dashboard'],
  [['marketing manager'],                               '/marketing-manager/dashboard'],
  [['documentation manager'],                           '/documentation-manager/dashboard'],
  [['hr manager'],                                      '/hr/dashboard'],
  [['hr executive'],                                    '/hr-executive/dashboard'],
  [['recruitment executive', 'recruitment executive'],  '/recruitment/dashboard'],
  [['professor'],                                       '/professor/dashboard'],
  // Generic evaluation staff (exec/intern/manager) — 'evaluation head' is matched
  // above, so only non-head evaluation roles fall through to here.
  [['evaluation'],                                      '/evaluation/dashboard'],
  [['documentation intern'],                            '/documentation-intern/dashboard'],
  [['marketing intern'],                                '/marketing-intern/dashboard'],
  [['sales intern'],                                    '/sales-intern/dashboard'],
  [['documentation'],                                   '/documentation/dashboard'],
  [['marketing'],                                       '/marketing/dashboard'],
  [['sales'],                                           '/sales/dashboard'],
  [['hr'],                                              '/hr/dashboard'],
  [['owner'],                                           '/owner/dashboard'],
]

// Operating-tier dashboards keyed by department → level (0 intern, 1 exec, 2 manager).
const DEPARTMENT_DASHBOARDS = {
  sales: {
    0: '/sales-intern/dashboard',
    1: '/sales/dashboard',
    2: '/sales-manager/dashboard',
  },
  marketing: {
    0: '/marketing-intern/dashboard',
    1: '/marketing/dashboard',
    2: '/marketing-manager/dashboard',
  },
  documentation: {
    0: '/documentation-intern/dashboard',
    1: '/documentation/dashboard',
    2: '/documentation-manager/dashboard',
  },
}

// Detect the department from any available context (team/vertical/department name
// + designation). Team name is the most reliable signal — e.g. a "Social Media
// Executive" or "Senior Case Manager" carries no department keyword in their title,
// but their team ("Marketing Team" / "Documentation Team") does.
function detectDepartment(ctx) {
  if (/market/.test(ctx)) return 'marketing'
  if (/document|case|production|processing/.test(ctx)) return 'documentation'
  if (/sales/.test(ctx)) return 'sales'
  return null
}

export function getHomePath(userOrLevel) {
  const user = typeof userOrLevel === 'object' ? userOrLevel : { roleLevel: userOrLevel }

  // 1. Exact role enum match
  if (user?.role && ROLE_DASHBOARD_MAP[user.role]) {
    return ROLE_DASHBOARD_MAP[user.role]
  }

  // Role level drives role-based routing. A user with no department team is
  // routed purely by their role — e.g. role level 4 (General Manager) →
  // /head/dashboard — never the level fallback's Sales default.
  const level = Number(user?.roleLevel ?? user?.employeeLevel ?? userOrLevel ?? 1)

  // 2. Team + role resolution for the operating tiers (intern/exec/manager).
  //    Department is taken from the TEAM (and vertical/department) only — not the
  //    designation. If there's no team, this is skipped and the user falls through
  //    to role-based routing below.
  const ctx = [user?.teamName, user?.verticalName, user?.departmentName]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  const department = ctx ? detectDepartment(ctx) : null
  if (department && level >= 0 && level <= 2) {
    return DEPARTMENT_DASHBOARDS[department][level] ?? DEPARTMENT_DASHBOARDS[department][1]
  }

  // 3. Designation keyword match (heads, owner, vertical manager, HR, IT, professor…)
  const designation = (user?.designation || '').toLowerCase()
  if (designation) {
    for (const [keywords, route] of DESIGNATION_ROUTE_MAP) {
      if (keywords.some(k => designation.includes(k))) {
        return route
      }
    }
  }

  // 4. Numeric level fallback
  const levelRoutes = {
    6: '/super-admin/dashboard',
    5: '/owner/dashboard',
    4: '/head/dashboard',
    3: '/sales-manager/dashboard', // Vertical Manager — manager-style landing
    2: '/sales-manager/dashboard',
    1: '/sales/dashboard',
    0: '/sales-intern/dashboard',
  }
  const route = levelRoutes[level] ?? '/sales/dashboard'
  return route
}

/**
 * Human-readable label for a role level.
 */
export function getRoleLabel(roleLevel) {
  switch (Number(roleLevel)) {
    case 6:  return 'Super Admin'
    case 5:  return 'Business Owner'
    case 4:  return 'General Manager'
    case 3:  return 'Vertical Manager'
    case 2:  return 'Team Lead'
    case 1:  return 'Executive'
    case 0:  return 'Intern'
    default: return 'User'
  }
}
