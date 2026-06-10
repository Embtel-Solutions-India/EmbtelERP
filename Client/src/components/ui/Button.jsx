// Button with variants: primary, secondary, ghost, danger, success, outline
// size: sm, md (default), lg
import { motion } from 'framer-motion'

const VARIANT_CLS = {
  primary:   'btn-primary',
  secondary: 'btn-secondary',
  ghost:     'btn-ghost',
  danger:    'btn-danger',
  success:   'bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all duration-200 inline-flex items-center gap-2 active:scale-95',
  outline:   'border border-primary-500 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 font-semibold rounded-xl transition-all duration-200 inline-flex items-center gap-2',
}

const SIZE_CLS = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  loading = false,
  disabled = false,
  ...props
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      className={`${VARIANT_CLS[variant] || VARIANT_CLS.primary} ${SIZE_CLS[size] || SIZE_CLS.md} ${disabled || loading ? 'opacity-60 cursor-not-allowed' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin h-3.5 w-3.5 flex-shrink-0"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </motion.button>
  )
}
