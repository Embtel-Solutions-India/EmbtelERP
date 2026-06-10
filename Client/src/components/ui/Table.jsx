import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Search as SearchIcon } from '@mui/icons-material'

export function Table({
  columns,
  data = [],
  searchable = false,
  searchPlaceholder = 'Search...',
  pageSize = 10,
  loading = false,
  emptyMessage = 'No records found',
  className = '',
}) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [sort, setSort] = useState({ key: null, dir: 'asc' })

  const filtered = useMemo(() => {
    if (!search) return data
    const q = search.toLowerCase()
    return data.filter((row) =>
      Object.values(row).some((v) => String(v).toLowerCase().includes(q))
    )
  }, [data, search])

  const sorted = useMemo(() => {
    if (!sort.key) return filtered
    return [...filtered].sort((a, b) => {
      const av = a[sort.key]
      const bv = b[sort.key]
      if (av == null) return 1
      if (bv == null) return -1
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true })
      return sort.dir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sort])

  const pages = Math.ceil(sorted.length / pageSize)
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize)

  const toggleSort = (key) => {
    setSort((prev) => ({
      key,
      dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc',
    }))
    setPage(0)
  }

  return (
    <div className={`card overflow-hidden ${className}`}>
      {searchable && (
        <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-700">
          <div className="relative max-w-xs">
            <SearchIcon
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              style={{ fontSize: 16 }}
            />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(0)
              }}
              placeholder={searchPlaceholder}
              className="input-field pl-8 py-2 text-sm"
            />
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={col.sortable !== false ? () => toggleSort(col.key) : undefined}
                  className={
                    col.sortable !== false
                      ? 'cursor-pointer select-none hover:bg-neutral-100 dark:hover:bg-neutral-700/50'
                      : ''
                  }
                  style={{ width: col.width }}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable !== false && sort.key === col.key && (
                      <span className="text-primary-500">
                        {sort.dir === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col.key}>
                      <div className="h-4 bg-neutral-100 dark:bg-neutral-700 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : paged.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="text-center py-10 text-neutral-400 dark:text-neutral-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paged.map((row, i) => (
                <motion.tr
                  key={row.id ?? i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                >
                  {columns.map((col) => (
                    <td key={col.key}>
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="px-4 py-3 border-t border-neutral-100 dark:border-neutral-700 flex items-center justify-between text-sm">
          <span className="text-neutral-500 dark:text-neutral-400">
            Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, sorted.length)} of{' '}
            {sorted.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed text-neutral-600 dark:text-neutral-400 transition-colors"
            >
              ← Prev
            </button>
            {Array.from({ length: Math.min(pages, 5) }).map((_, i) => {
              const p = pages <= 5 ? i : Math.max(0, Math.min(pages - 5, page - 2)) + i
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                    p === page
                      ? 'bg-primary-600 text-white'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700'
                  }`}
                >
                  {p + 1}
                </button>
              )
            })}
            <button
              onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
              disabled={page >= pages - 1}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed text-neutral-600 dark:text-neutral-400 transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
