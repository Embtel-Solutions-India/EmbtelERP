import { motion } from 'framer-motion'

export default function SectionCard({ title, subtitle, actions, children, className = '', noPadding = false, delay = 0 }) {
  const isFixedFlex = className.includes('flex-col')

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`card ${noPadding ? '' : 'p-5'} ${className}`}
    >
      {(title || actions) && (
        <div
          className={`flex items-center justify-between ${noPadding ? 'px-5 pt-5 pb-4' : 'mb-4'} ${isFixedFlex ? 'flex-shrink-0' : ''}`}
        >
          <div className="min-w-0">
            {title && <h3 className="section-title truncate">{title}</h3>}
            {subtitle && <p className="section-subtitle mt-0.5 truncate">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2 flex-shrink-0 ml-3">{actions}</div>}
        </div>
      )}
      {children}
    </motion.div>
  )
}
