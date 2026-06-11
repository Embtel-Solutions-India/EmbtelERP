import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchImmigrationApprovals, submitImmigrationApproval } from '../redux/immigrationSlice'
import ImmigrationPriorityBadge from './ImmigrationPriorityBadge'
import { useImmigrationScope } from '../../../hooks/useImmigrationScope'

function ApprovalCard({ item }) {
  const dispatch = useDispatch()
  const [submitting, setSubmitting]   = useState(null) // 'approve' | 'reject' | 'info'
  const [showReject, setShowReject]   = useState(false)
  const [reason, setReason]           = useState('')

  const act = async (decision, r = '') => {
    setSubmitting(decision)
    await dispatch(submitImmigrationApproval({ id: item.id, decision, reason: r || undefined }))
    setSubmitting(null)
    setShowReject(false)
    setReason('')
  }

  const due = item.dueDate ? new Date(item.dueDate).toLocaleDateString() : null

  return (
    <AnimatePresence>
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: 30, transition: { duration: 0.2 } }}
        className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-100 dark:border-neutral-700 p-4 shadow-sm"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <ImmigrationPriorityBadge priority={item.priority} />
              {item.vertical && (
                <span className="text-[10px] bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-medium">
                  {item.vertical.name}
                </span>
              )}
              {due && <span className="text-[10px] text-neutral-400">Due {due}</span>}
            </div>
            <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 mb-1">{item.title}</h4>
            {item.description && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">{item.description}</p>
            )}
            <p className="text-[11px] text-neutral-400 mt-1">
              Requested by {item.requestedBy?.name ?? 'Unknown'} · {new Date(item.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Reject reason input */}
        {showReject && (
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Reason for rejection (optional)"
              className="flex-1 text-xs border border-neutral-200 dark:border-neutral-600 rounded-lg px-3 py-2 bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 focus:ring-2 focus:ring-red-400 focus:outline-none"
            />
            <button
              onClick={() => act('reject', reason)}
              disabled={!!submitting}
              className="px-3 py-2 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {submitting === 'reject' ? '…' : 'Confirm'}
            </button>
            <button
              onClick={() => { setShowReject(false); setReason('') }}
              className="px-3 py-2 text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Action buttons */}
        {!showReject && (
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => act('approve')}
              disabled={!!submitting}
              className="flex-1 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {submitting === 'approve' ? '…' : '✓ Approve'}
            </button>
            <button
              onClick={() => setShowReject(true)}
              disabled={!!submitting}
              className="flex-1 py-1.5 text-xs font-semibold bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 disabled:opacity-50 transition-colors"
            >
              ✗ Reject
            </button>
            <button
              onClick={() => act('info')}
              disabled={!!submitting}
              className="flex-1 py-1.5 text-xs font-semibold bg-neutral-50 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-600 disabled:opacity-50 transition-colors"
            >
              {submitting === 'info' ? '…' : '? Need Info'}
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

export default function ImmigrationApprovalList() {
  const dispatch = useDispatch()
  const { approvals, loadingApprovals } = useSelector(s => s.immigration)
  const scope = useImmigrationScope()

  useEffect(() => {
    dispatch(fetchImmigrationApprovals({
      verticalId: scope.scopeType === 'VERTICAL' ? scope.scopeId : undefined,
      limit: 50,
    }))
  }, [dispatch, scope.scopeType, scope.scopeId])

  const items = approvals?.items ?? []

  if (loadingApprovals && items.length === 0) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Pending Approvals</span>
        {items.length > 0 && (
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            {approvals.total}
          </span>
        )}
      </div>

      {items.map(item => <ApprovalCard key={item.id} item={item} />)}

      {items.length === 0 && (
        <div className="text-center py-16">
          <p className="text-2xl mb-2">✅</p>
          <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">All caught up!</p>
          <p className="text-xs text-neutral-400">No pending approvals</p>
        </div>
      )}
    </div>
  )
}
