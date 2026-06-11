import { useSelector } from 'react-redux'

/**
 * Derives the current immigration scope from the active perspective session.
 *
 * Returns { scopeType, scopeId } where scopeType is one of:
 *   "DIVISION"   — Immigration Head's full view (no active perspective)
 *   "VERTICAL"   — Drilling into one vertical
 *   "EMPLOYEE"   — Viewing a specific employee
 *
 * Vertical Managers (level 2) default to VERTICAL scope using their own
 * verticalId when no perspective session is active.
 */
export function useImmigrationScope() {
  const current = useSelector((s) => s.perspective.current)
  const user    = useSelector((s) => s.auth.user)

  if (!current) {
    const level = user?.employeeLevel ?? user?.roleLevel ?? 0
    if (level === 2 && user?.verticalId) {
      return { scopeType: 'VERTICAL', scopeId: user.verticalId }
    }
    return { scopeType: 'DIVISION', scopeId: null }
  }

  const { perspectiveType: t, perspectiveTargetId: id } = current

  if (t === 'VERTICAL')   return { scopeType: 'VERTICAL',  scopeId: id }
  if (t === 'DEPARTMENT') return { scopeType: 'VERTICAL',  scopeId: id }  // dept falls back to vertical view

  if (['EMPLOYEE', 'INTERN', 'MANAGER', 'HEAD'].includes(t))
    return { scopeType: 'EMPLOYEE', scopeId: id }

  // BUSINESS / BUSINESS_OWNER / ORGANIZATION → full division view
  return { scopeType: 'DIVISION', scopeId: null }
}
