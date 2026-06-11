import { useDispatch, useSelector } from 'react-redux'
import { Home as HomeIcon, ChevronRight } from '@mui/icons-material'
import {
  switchPerspective,
  resetPerspective,
} from '../../../redux/slices/perspectiveSlice'
import { useImmigrationScope } from '../../../hooks/useImmigrationScope'

/**
 * In-page breadcrumb bar for immigration head pages.
 * Renders only when a perspective is active (i.e., not viewing division-wide).
 * Clicking a crumb navigates back to that ancestor scope.
 * Matches the sidebar's PerspectiveBreadcrumb design system.
 */
export default function ImmigrationBreadcrumb() {
  const dispatch    = useDispatch()
  const currentInfo = useSelector(s => s.perspective.currentInfo)
  const scope       = useImmigrationScope()

  // Only visible when there is an active scope perspective
  if (scope.scopeType === 'DIVISION') return null

  const breadcrumb = currentInfo?.breadcrumb ?? []

  const handleReset = () => dispatch(resetPerspective())

  const handleCrumb = (crumb) => {
    if (crumb.type) {
      dispatch(switchPerspective({ targetType: crumb.type, targetId: crumb.id }))
    }
  }

  return (
    <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 text-xs flex-wrap">
      {/* Division root — always clickable */}
      <button
        onClick={handleReset}
        className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
      >
        <HomeIcon style={{ fontSize: 13 }} />
        <span>Immigration Division</span>
      </button>

      {/* Dynamic crumbs from perspective info */}
      {breadcrumb.map((crumb, i) => (
        <span key={crumb.id} className="flex items-center gap-1">
          <ChevronRight style={{ fontSize: 13 }} className="text-neutral-400" />
          {i < breadcrumb.length - 1 ? (
            <button
              onClick={() => handleCrumb(crumb)}
              className="text-indigo-500 dark:text-indigo-400 hover:underline font-medium"
            >
              {crumb.label}
            </button>
          ) : (
            <span className="text-neutral-700 dark:text-neutral-300 font-semibold">
              {crumb.label}
            </span>
          )}
        </span>
      ))}

      {/* Fallback label when breadcrumb is empty but scope is active */}
      {breadcrumb.length === 0 && scope.scopeId && (
        <span className="flex items-center gap-1">
          <ChevronRight style={{ fontSize: 13 }} className="text-neutral-400" />
          <span className="text-neutral-700 dark:text-neutral-300 font-semibold">
            {currentInfo?.label ?? 'Vertical'}
          </span>
        </span>
      )}

      {/* Reset pill */}
      <button
        onClick={handleReset}
        className="ml-auto flex items-center gap-0.5 text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
      >
        ✕ Reset scope
      </button>
    </div>
  )
}
