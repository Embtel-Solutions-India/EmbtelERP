import { useSelector } from 'react-redux'
import { Navigate, Outlet } from 'react-router-dom'
import { getHomePath } from '../../utils/roleRoutes'

export default function RoleRouteGuard({ allowedLevels, allowedDesignations, children }) {
  const { user, isAuthenticated } = useSelector((s) => s.auth)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const level = Number(user?.employeeLevel ?? user?.roleLevel ?? 0)
  const designation = (user?.designation || '').toLowerCase()

  let isAllowed = false

  if (allowedLevels && allowedLevels.includes(level)) {
    isAllowed = true
  }

  if (allowedDesignations) {
    const matched = allowedDesignations.some(d => designation.includes(d.toLowerCase()))
    if (matched) {
      isAllowed = true
    }
  }

  // Fallback: if no specific rules are defined, allow
  if (!allowedLevels && !allowedDesignations) {
    isAllowed = true
  }

  if (!isAllowed) {
    return <Navigate to={getHomePath(user)} replace />
  }

  return children ? children : <Outlet />
}
