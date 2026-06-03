import { useSelector } from 'react-redux'

const VIEW_ONLY_ROLES = ['sales executive', 'marketing executive']
const CRUD_ROLE_KEYWORDS = ['head', 'manager', 'owner', 'admin']

export default function useTeamPermissions() {
  const { user } = useSelector((s) => s.auth)
  const role = (user?.role || '').toLowerCase()

  const isViewOnly = VIEW_ONLY_ROLES.includes(role)
  const hasCrudRole = CRUD_ROLE_KEYWORDS.some((keyword) => role.includes(keyword))

  return {
    user,
    canView: Boolean(user),
    canEdit: !isViewOnly && hasCrudRole,
    isViewOnly,
  }
}
