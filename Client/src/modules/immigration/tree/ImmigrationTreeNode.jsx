import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AccountTree as VerticalIcon,
  Group as DeptIcon,
  Person as PersonIcon,
  ExpandMore,
  ChevronRight,
} from '@mui/icons-material'

function getNodeIcon(nodeType, roleLevel) {
  if (nodeType === 'vertical')   return <VerticalIcon style={{ fontSize: 14 }} className="text-amber-500 flex-shrink-0" />
  if (nodeType === 'department') return <DeptIcon     style={{ fontSize: 14 }} className="text-green-500 flex-shrink-0"  />
  return <PersonIcon style={{ fontSize: 14 }} className="text-purple-500 flex-shrink-0" />
}

/**
 * Tree node for the immigration perspective tree.
 * Supports expand/collapse, depth-based indent, active highlight.
 *
 * Props:
 *   node        — { id, name, nodeType, roleLevel, designation, memberCount, children }
 *   depth       — nesting depth (0 = root)
 *   activeId    — currently selected node id
 *   onSelect    — (targetType, targetId) => void
 */
export default function ImmigrationTreeNode({ node, depth = 0, activeId, onSelect }) {
  const [expanded, setExpanded] = useState(depth < 1)
  const hasChildren = node.children?.length > 0
  const isActive    = activeId === node.id

  const targetType =
    node.nodeType === 'vertical'   ? 'VERTICAL'
    : node.nodeType === 'department' ? 'DEPARTMENT'
    : 'EMPLOYEE'

  const handleClick = () => {
    if (hasChildren) setExpanded(x => !x)
    onSelect(targetType, node.id)
  }

  return (
    <div>
      <button
        onClick={handleClick}
        className={`w-full flex items-center gap-1.5 py-1.5 rounded-lg text-xs transition-colors ${
          isActive
            ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
            : 'hover:bg-neutral-50 dark:hover:bg-neutral-700/50 text-neutral-600 dark:text-neutral-400'
        }`}
        style={{ paddingLeft: `${10 + depth * 14}px`, paddingRight: '8px' }}
      >
        {hasChildren ? (
          <span className="flex-shrink-0 w-3.5 h-3.5 flex items-center justify-center">
            {expanded
              ? <ExpandMore style={{ fontSize: 13 }} />
              : <ChevronRight style={{ fontSize: 13 }} />
            }
          </span>
        ) : (
          <span className="w-3.5 flex-shrink-0" />
        )}

        {getNodeIcon(node.nodeType, node.roleLevel)}

        <span className="truncate font-medium leading-none flex-1 text-left">
          {node.name}
        </span>

        {node.memberCount != null && (
          <span className="text-[9px] text-neutral-400 dark:text-neutral-500 bg-neutral-100 dark:bg-neutral-700 px-1.5 py-0.5 rounded-full flex-shrink-0">
            {node.memberCount}
          </span>
        )}

        {isActive && (
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
        )}
      </button>

      <AnimatePresence>
        {hasChildren && expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
          >
            {node.children.map(child => (
              <ImmigrationTreeNode
                key={child.id}
                node={child}
                depth={depth + 1}
                activeId={activeId}
                onSelect={onSelect}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
