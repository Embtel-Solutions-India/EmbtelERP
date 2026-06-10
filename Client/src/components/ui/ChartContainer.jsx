// Consistent container for Recharts charts

export function ChartContainer({
  title,
  subtitle,
  action,
  children,
  height = 280,
  className = '',
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
          {action && <div>{action}</div>}
        </div>
      )}
      <div style={{ height }}>{children}</div>
    </div>
  )
}
