/**
 * Maps a numeric roleLevel (0–5) returned by POST /auth/login
 * to the user's home route after authentication.
 *
 * Level semantics (mirrors Server Role.level):
 *   5 = Super Admin
 *   4 = Business Owner
 *   3 = Business Head (Immigration Head, etc.)
 *   2 = Manager tier (Vertical Manager, Sales Head, Marketing Manager, etc.)
 *   1 = Executive tier (Sales Exec, Marketing Exec, HR, IT, etc.)
 *   0 = Intern
 */
export function getHomePath(roleLevel) {
  switch (Number(roleLevel)) {
    case 5:  return '/demo/super-admin'
    case 4:  return '/demo/business-owner'
    case 3:  return '/demo/business'
    case 2:  return '/demo/manager'
    case 1:  return '/sales/dashboard'
    case 0:  return '/demo/intern'
    default: return '/sales/dashboard'
  }
}

/**
 * Human-readable label for a role level.
 * Used in UI elements (breadcrumbs, profile cards, etc.)
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
