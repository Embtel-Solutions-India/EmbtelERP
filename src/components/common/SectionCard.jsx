import { motion } from 'framer-motion'

export default function SectionCard({ title, subtitle, actions, children, className = '', noPadding = false, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`card ${noPadding ? '' : 'p-5'} ${className}`}
    >
      {(title || actions) && (
        <div className={`flex items-center justify-between ${noPadding ? 'px-5 pt-5 pb-4' : 'mb-4'}`}>
          <div>
            {title && <h3 className="section-title">{title}</h3>}
            {subtitle && <p className="section-subtitle mt-0.5">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </motion.div>
  )
}
