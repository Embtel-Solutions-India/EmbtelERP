// Widget = Card with a consistent header for dashboard sections

export function Widget({
  title,
  subtitle,
  action,
  children,
  className = '',
  loading = false,
  empty = false,
  emptyMessage = 'No data available',
}) {
  return (
    <div className={`card p-5 ${className}`}>
      {(title || action) && (
        <div className="flex items-start justify-between mb-4">
          <div>
            {title && (
              <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{subtitle}</p>
            )}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-4 bg-neutral-100 dark:bg-neutral-700 rounded animate-pulse ${
                i === 3 ? 'w-1/2' : i === 2 ? 'w-3/4' : 'w-full'
              }`}
            />
          ))}
        </div>
      ) : empty ? (
        <div className="py-8 text-center text-neutral-400 dark:text-neutral-500 text-sm">
          {emptyMessage}
        </div>
      ) : (
        children
      )}
    </div>
  )
}
