import { motion } from 'framer-motion'

export default function PageHeader({ title, subtitle, actions, breadcrumbs }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
    >
      <div>
        {breadcrumbs && (
          <div className="flex items-center gap-2 text-xs text-neutral-400 dark:text-neutral-500 mb-1">
            {breadcrumbs.map((b, i) => (
              <span key={i} className="flex items-center gap-2">
                {i > 0 && <span>/</span>}
                <span className={i === breadcrumbs.length - 1 ? 'text-neutral-600 dark:text-neutral-300 font-medium' : ''}>{b}</span>
              </span>
            ))}
          </div>
        )}
        <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">{title}</h1>
        {subtitle && <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </motion.div>
  )
}
