const VARIANT_CLS = {
  success: 'badge-success',
  warning: 'badge-warning',
  danger:  'badge-danger',
  error:   'badge-danger',
  info:    'badge-info',
  primary: 'badge-primary',
  purple:  'badge-purple',
  neutral: 'badge-neutral',
}

export function Badge({ variant = 'neutral', children, className = '' }) {
  return (
    <span className={`badge ${VARIANT_CLS[variant] || VARIANT_CLS.neutral} ${className}`}>
      {children}
    </span>
  )
}
