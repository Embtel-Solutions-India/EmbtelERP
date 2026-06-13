import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Close, Save } from '@mui/icons-material'
import SelectField from './SelectField'

export default function ActionFormModal({
  open,
  title,
  subtitle,
  fields,
  initialValues = {},
  submitLabel = 'Save',
  onClose,
  onSubmit,
}) {
  const [values, setValues] = useState(initialValues)

  useEffect(() => {
    if (open) setValues(initialValues)
  }, [open, initialValues])

  const handleChange = (name, value) => {
    setValues((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    onSubmit(values)
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/50 px-4 py-6 backdrop-blur-sm"
        >
          <motion.form
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleSubmit}
            className="card w-full max-w-2xl max-h-[90vh] overflow-hidden"
          >
            <div className="flex items-start justify-between gap-4 border-b border-neutral-100 px-5 py-4 dark:border-neutral-700">
              <div>
                <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">{title}</h2>
                {subtitle && <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">{subtitle}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-700 dark:hover:text-neutral-200"
                aria-label="Close form"
              >
                <Close fontSize="small" />
              </button>
            </div>

            <div className="grid max-h-[62vh] grid-cols-1 gap-4 overflow-y-auto p-5 sm:grid-cols-2">
              {fields.map((field) => {
                const className = field.fullWidth ? 'sm:col-span-2' : ''
                const commonProps = {
                  id: field.name,
                  name: field.name,
                  required: field.required,
                  value: values[field.name] ?? '',
                  onChange: (event) => handleChange(field.name, event.target.value),
                  className: 'input-field',
                  placeholder: field.placeholder,
                }

                return (
                  <label key={field.name} className={`block ${className}`}>
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                      {field.label}
                    </span>
                    {field.type === 'select' ? (
                      <SelectField
                        id={field.name}
                        name={field.name}
                        value={values[field.name] ?? ''}
                        options={field.options}
                        disabled={field.disabled}
                        placeholder={field.placeholder}
                        onChange={(value) => handleChange(field.name, value)}
                      />
                    ) : field.type === 'textarea' ? (
                      <textarea {...commonProps} rows={field.rows || 4} />
                    ) : (
                      <input
                        {...commonProps}
                        type={field.type || 'text'}
                        min={field.min}
                        max={field.max}
                        step={field.step}
                      />
                    )}
                  </label>
                )
              })}
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-neutral-100 px-5 py-4 dark:border-neutral-700 sm:flex-row sm:justify-end">
              <button type="button" onClick={onClose} className="btn-secondary text-sm">
                Cancel
              </button>
              <button type="submit" className="btn-primary flex items-center justify-center gap-2 text-sm">
                <Save fontSize="small" /> {submitLabel}
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
