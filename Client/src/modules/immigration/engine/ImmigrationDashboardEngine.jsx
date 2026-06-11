import { useEffect, useCallback, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  fetchImmigrationKpis,
  fetchImmigrationVerticals,
  fetchImmigrationVerticalDetail,
  fetchImmigrationLeads,
  fetchImmigrationRevenue,
  clearVerticalDetail,
} from '../redux/immigrationSlice'
import {
  switchPerspective,
  resetPerspective,
} from '../../../redux/slices/perspectiveSlice'
import { useImmigrationScope } from '../../../hooks/useImmigrationScope'
import ImmigrationKpiSection    from '../widgets/ImmigrationKpiSection'
import VerticalRankingWidget    from '../widgets/VerticalRankingWidget'
import ImmigrationLeadFunnel    from '../widgets/ImmigrationLeadFunnel'
import ImmigrationRevenueChart  from '../widgets/ImmigrationRevenueChart'
import VerticalDetailView       from '../widgets/VerticalDetailView'

// ─── Breadcrumb ───────────────────────────────────────────────────────────────

function Breadcrumb({ items }) {
  return (
    <nav className="flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-neutral-300 dark:text-neutral-600">›</span>}
          {item.onClick ? (
            <button
              onClick={item.onClick}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors"
            >
              {item.label}
            </button>
          ) : (
            <span className="text-neutral-800 dark:text-neutral-200 font-semibold">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}

// ─── Scope constants ──────────────────────────────────────────────────────────

export const SCOPE_TYPES = {
  DIVISION: 'DIVISION',
  VERTICAL: 'VERTICAL',
}

// ─── Division View ────────────────────────────────────────────────────────────

function DivisionView({ onDrillDown }) {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(fetchImmigrationKpis())
    dispatch(fetchImmigrationVerticals())
    dispatch(fetchImmigrationLeads({}))
    dispatch(fetchImmigrationRevenue({ period: 'month' }))
  }, [dispatch])

  return (
    <div className="space-y-6">
      <ImmigrationKpiSection />
      <VerticalRankingWidget onDrillDown={onDrillDown} />
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="md:col-span-2">
          <ImmigrationLeadFunnel />
        </div>
        <div className="md:col-span-3">
          <ImmigrationRevenueChart />
        </div>
      </div>
    </div>
  )
}

// ─── Vertical View ────────────────────────────────────────────────────────────

function VerticalView({ verticalId }) {
  const dispatch = useDispatch()

  useEffect(() => {
    if (!verticalId) return
    dispatch(fetchImmigrationVerticalDetail(verticalId))
    dispatch(fetchImmigrationLeads({ verticalId }))
    dispatch(fetchImmigrationRevenue({ verticalId, period: 'month' }))
  }, [dispatch, verticalId])

  return <VerticalDetailView />
}

// ─── Engine ───────────────────────────────────────────────────────────────────

export default function ImmigrationDashboardEngine() {
  const [searchParams, setSearchParams] = useSearchParams()
  const dispatch = useDispatch()
  const scope = useImmigrationScope()

  // URL params are the rendering source-of-truth
  const urlScopeType = searchParams.get('scope') ?? SCOPE_TYPES.DIVISION
  const urlScopeId   = searchParams.get('id')    ?? null

  const { verticalDetail } = useSelector(s => s.immigration)

  // ── Sync perspective → URL params ─────────────────────────────────────────
  // When the sidebar tree changes the active perspective, mirror it to URL params
  // so the engine re-renders without a route change.
  const lastScopeKey = useRef(null)

  useEffect(() => {
    const key = `${scope.scopeType}:${scope.scopeId ?? ''}`
    if (lastScopeKey.current === key) return
    lastScopeKey.current = key

    if (scope.scopeType === 'DIVISION') {
      setSearchParams({})
    } else if (scope.scopeType === 'VERTICAL' && scope.scopeId) {
      setSearchParams({ scope: SCOPE_TYPES.VERTICAL, id: scope.scopeId })
    }
    // EMPLOYEE scope: show division view (no dedicated employee dashboard in this engine)
  }, [scope, setSearchParams])

  // ── Navigate to division (back button + breadcrumb) ───────────────────────
  const navigateToDivision = useCallback(() => {
    dispatch(clearVerticalDetail())
    dispatch(resetPerspective())
    setSearchParams({})
  }, [dispatch, setSearchParams])

  // ── Drill-down from VerticalRankingWidget ─────────────────────────────────
  // Also syncs the perspective session so the sidebar tree highlights correctly.
  const navigateToVertical = useCallback((vertical) => {
    dispatch(switchPerspective({ targetType: 'VERTICAL', targetId: vertical.id }))
    setSearchParams({ scope: SCOPE_TYPES.VERTICAL, id: vertical.id })
  }, [dispatch, setSearchParams])

  // ── Breadcrumb ────────────────────────────────────────────────────────────
  const breadcrumbItems = [
    {
      label: 'Immigration Division',
      onClick: urlScopeType !== SCOPE_TYPES.DIVISION ? navigateToDivision : null,
    },
  ]
  if (urlScopeType === SCOPE_TYPES.VERTICAL) {
    breadcrumbItems.push({
      label: verticalDetail?.name ?? 'Vertical',
      onClick: null,
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Breadcrumb + back navigation */}
      <div className="flex items-center justify-between">
        <Breadcrumb items={breadcrumbItems} />
        {urlScopeType !== SCOPE_TYPES.DIVISION && (
          <button
            onClick={navigateToDivision}
            className="flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 font-medium transition-colors"
          >
            ← Back to Division
          </button>
        )}
      </div>

      {/* Scope-specific content */}
      {urlScopeType === SCOPE_TYPES.DIVISION && (
        <DivisionView onDrillDown={navigateToVertical} />
      )}

      {urlScopeType === SCOPE_TYPES.VERTICAL && urlScopeId && (
        <VerticalView verticalId={urlScopeId} />
      )}
    </motion.div>
  )
}
