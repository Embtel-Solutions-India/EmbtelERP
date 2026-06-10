// A flexible card container matching WowDash card design

export function Card({ children, className = '', noPad = false, hover = false, ...props }) {
  return (
    <div
      className={`card ${noPad ? '' : 'p-5'} ${hover ? 'hover:shadow-card-hover hover:-translate-y-0.5 cursor-pointer transition-all duration-300' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`flex items-start justify-between mb-5 ${className}`}>
      <div>
        <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-100 leading-tight">
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}

export function CardBody({ children, className = '' }) {
  return <div className={className}>{children}</div>
}
