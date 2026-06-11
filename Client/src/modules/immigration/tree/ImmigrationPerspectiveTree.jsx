import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Search as SearchIcon } from '@mui/icons-material'
import {
  fetchImmigrationHierarchyTree,
  switchPerspective,
  resetPerspective,
} from '../../../redux/slices/perspectiveSlice'
import ImmigrationTreeNode from './ImmigrationTreeNode'

/**
 * Standalone immigration perspective tree component.
 * Can be embedded in any page for role-scoped vertical/department/employee navigation.
 * Uses the same perspectiveSlice state as the sidebar's Hierarchy section.
 */
export default function ImmigrationPerspectiveTree({ className = '' }) {
  const dispatch = useDispatch()
  const { hierarchyTree, loading, current } = useSelector(s => s.perspective)
  const [search, setSearch] = useState('')

  useEffect(() => {
    dispatch(fetchImmigrationHierarchyTree())
  }, [dispatch])

  const handleSelect = (targetType, targetId) => {
    dispatch(switchPerspective({ targetType, targetId }))
  }

  const handleReset = () => dispatch(resetPerspective())

  // Filter tree by search query (matches node names recursively)
  const filterTree = (nodes, q) => {
    if (!q) return nodes
    const lower = q.toLowerCase()
    return nodes
      .map(node => {
        const childMatches = filterTree(node.children ?? [], q)
        if (node.name.toLowerCase().includes(lower) || childMatches.length > 0) {
          return { ...node, children: childMatches }
        }
        return null
      })
      .filter(Boolean)
  }

  const visibleTree = filterTree(hierarchyTree, search)
  const activeId    = current?.perspectiveTargetId ?? null

  return (
    <div className={`bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 ${className}`}>
      {/* Header */}
      <div className="px-3.5 py-2.5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-600">
          Perspective
        </span>
        {activeId && (
          <button
            onClick={handleReset}
            className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
          >
            Reset
          </button>
        )}
      </div>

      {/* Search */}
      <div className="px-3 pt-2 pb-1">
        <div className="flex items-center gap-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg px-2.5 py-1.5">
          <SearchIcon style={{ fontSize: 13 }} className="text-neutral-400 flex-shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search verticals, teams…"
            className="flex-1 text-xs bg-transparent outline-none text-neutral-700 dark:text-neutral-300 placeholder-neutral-400"
          />
        </div>
      </div>

      {/* Tree */}
      <div className="pb-2 px-1.5 max-h-80 overflow-y-auto scrollbar-thin">
        {loading && visibleTree.length === 0 ? (
          <div className="py-4 text-center text-xs text-neutral-400">Loading…</div>
        ) : visibleTree.length === 0 ? (
          <div className="py-4 text-center text-xs text-neutral-400">
            {search ? 'No matches' : 'No hierarchy data'}
          </div>
        ) : (
          visibleTree.map(node => (
            <ImmigrationTreeNode
              key={node.id}
              node={node}
              depth={0}
              activeId={activeId}
              onSelect={handleSelect}
            />
          ))
        )}
      </div>
    </div>
  )
}
