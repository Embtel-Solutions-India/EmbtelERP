import { useEffect, useRef } from 'react'

/**
 * Lightweight real-time refresh for dashboards (no RTK Query rearchitecture).
 * Runs `refresh` on mount (and whenever `deps` change), and again when the tab
 * regains focus / visibility or the network reconnects — so dashboards reflect
 * the latest backend data after the user switches tabs, returns to the app, or
 * data changed elsewhere. Focus refetches are throttled to avoid request storms.
 *
 * Each dashboard fires many fetch thunks per refresh, so the focus/visibility
 * throttle defaults to 60s: returning to a tab within a minute reuses the data
 * already loaded rather than re-firing every endpoint. Mount/deps changes still
 * refresh immediately, so navigation always shows current data.
 *
 * @param {() => void} refresh  re-dispatch the screen's fetch thunks
 * @param {Array} deps          deps that should force an immediate refresh
 * @param {{ minIntervalMs?: number }} [opts]
 */
export function useAutoRefresh(refresh, deps = [], { minIntervalMs = 60000 } = {}) {
  const refreshRef = useRef(refresh)
  refreshRef.current = refresh
  const lastRunRef = useRef(0)

  // Immediate run on mount and whenever deps change.
  useEffect(() => {
    lastRunRef.current = Date.now()
    refreshRef.current?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  // Refetch on focus / visibility / reconnect (throttled).
  useEffect(() => {
    const run = () => {
      const now = Date.now()
      if (now - lastRunRef.current < minIntervalMs) return
      lastRunRef.current = now
      refreshRef.current?.()
    }
    const onVisible = () => { if (document.visibilityState === 'visible') run() }
    window.addEventListener('focus', run)
    window.addEventListener('online', run)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('focus', run)
      window.removeEventListener('online', run)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [minIntervalMs])
}
