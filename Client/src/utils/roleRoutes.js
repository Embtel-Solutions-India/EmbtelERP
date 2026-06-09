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
  [['super admin', 'it head'],                         '/super-admin/dashboard'],
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
  [['documentation intern'],                            '/documentation-intern/dashboard'],
  [['marketing intern'],                                '/marketing-intern/dashboard'],
  [['sales intern'],                                    '/sales-intern/dashboard'],
  [['documentation'],                                   '/documentation/dashboard'],
  [['marketing'],                                       '/marketing/dashboard'],
  [['sales'],                                           '/sales/dashboard'],
  [['hr'],                                              '/hr/dashboard'],
  [['owner'],                                           '/owner/dashboard'],
]

export function getHomePath(userOrLevel) {
  const user = typeof userOrLevel === 'object' ? userOrLevel : { roleLevel: userOrLevel }

  // 1. Exact role enum match
  if (user?.role && ROLE_DASHBOARD_MAP[user.role]) {
    console.log('[Auth] role:', user.role, '→', ROLE_DASHBOARD_MAP[user.role])
    return ROLE_DASHBOARD_MAP[user.role]
  }

  // 2. Designation keyword match
  const designation = (user?.designation || '').toLowerCase()
  if (designation) {
    for (const [keywords, route] of DESIGNATION_ROUTE_MAP) {
      if (keywords.some(k => designation.includes(k))) {
        console.log('[Auth] designation:', user.designation, '→', route)
        return route
      }
    }
  }

  // 3. Numeric level fallback
  const level = Number(user?.roleLevel ?? user?.employeeLevel ?? userOrLevel ?? 1)
  const levelRoutes = {
    5: '/super-admin/dashboard',
    4: '/owner/dashboard',
    3: '/head/dashboard',
    2: '/sales-manager/dashboard',
    1: '/sales/dashboard',
    0: '/sales-intern/dashboard',
  }
  const route = levelRoutes[level] ?? '/sales/dashboard'
  console.log('[Auth] level:', level, '→', route)
  return route
}

/**
 * Human-readable label for a role level.
 */
export function getRoleLabel(roleLevel) {
  switch (Number(roleLevel)) {
    case 5:  return 'Super Admin'
    case 4:  return 'Business Owner'
    case 3:  return 'Business Head'
    case 2:  return 'Manager'
    case 1:  return 'Executive'
    case 0:  return 'Intern'
    default: return 'User'
  }
}
