import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Close, Save, Search } from '@mui/icons-material'

// Searchable single-select used for the "Related Lead" field. Stores the option
// value (lead id) while letting the user type to filter by label.
function LeadSelect({ value, onChange, options = [], placeholder = 'Search…' }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const boxRef = useRef(null)

  const selected = options.find((o) => o.value === value)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options.slice(0, 50)
    return options.filter((o) => o.label.toLowerCase().includes(q)).slice(0, 50)
  }, [query, options])

  useEffect(() => {
    const onDocClick = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  return (
    <div className="relative" ref={boxRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" style={{ fontSize: 16 }} />
        <input
          type="text"
          className="input-field pl-9"
          placeholder={placeholder}
          value={open ? query : (selected?.label ?? '')}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => { setOpen(true); setQuery('') }}
        />
      </div>
      {open && (
        <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-neutral-200 bg-white shadow-lg dark:border-neutral-600 dark:bg-neutral-800">
          <button type="button" onClick={() => { onChange(''); setOpen(false) }}
            className="block w-full px-4 py-2 text-left text-sm text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700">
            — No lead —
          </button>
          {filtered.map((o) => (
            <button key={o.value} type="button"
              onClick={() => { onChange(o.value); setOpen(false) }}
              className="block w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700">
              {o.label}
            </button>
          ))}
          {filtered.length === 0 && <p className="px-4 py-2 text-sm text-neutral-400">No matches</p>}
        </div>
      )}
    </div>
  )
}

/**
 * Schema-driven, sectioned modal form built on react-hook-form + zod.
 * Used by BOTH Add and Update flows (mode = 'create' | 'edit') so they always
 * share field structure, validation and components.
 */
export default function SchemaForm({
  open,
  title,
  subtitle,
  sections,
  schema,
  defaultValues,
  mode = 'create',
  loading = false,
  submitLabel = 'Save',
  leadOptions = [],
  onClose,
  onSubmit,
}) {
  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  })

  // Preload existing record (edit) or reset to defaults (create) whenever opened.
  useEffect(() => { if (open) reset(defaultValues) }, [open, defaultValues, reset])

  const submit = async (values) => {
    await onSubmit(values)
  }

  const renderField = (field) => {
    const err = errors[field.name]?.message
    const base = 'input-field'
    const control_ = (() => {
      switch (field.type) {
        case 'readonly':
          return <input className={`${base} opacity-70`} readOnly placeholder={field.placeholder}
            {...register(field.name)} />
        case 'textarea':
          return <textarea className={base} rows={field.rows || 3} {...register(field.name)} />
        case 'select':
          return (
            <select className={base} {...register(field.name)}>
              <option value="">{field.required ? 'Select…' : '—'}</option>
              {field.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          )
        case 'checkbox':
          return (
            <label className="flex items-center gap-2 pt-1">
              <input type="checkbox" className="h-4 w-4 rounded border-neutral-300" {...register(field.name)} />
              <span className="text-sm text-neutral-600 dark:text-neutral-300">Yes</span>
            </label>
          )
        case 'lead-select':
          return (
            <Controller name={field.name} control={control}
              render={({ field: f }) => (
                <LeadSelect value={f.value} onChange={f.onChange} options={leadOptions} />
              )} />
          )
        case 'number':
          return <input type="number" className={base} min={field.min} step={field.step}
            {...register(field.name)} />
        default:
          return <input type={field.type || 'text'} className={base} placeholder={field.placeholder}
            {...register(field.name)} />
      }
    })()

    return (
      <label key={field.name} className={`block ${field.fullWidth ? 'sm:col-span-2' : ''}`}>
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          {field.label}{field.required && <span className="text-red-500"> *</span>}
        </span>
        {control_}
        {err && <span className="mt-1 block text-xs text-red-500">{err}</span>}
      </label>
    )
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/50 px-4 py-6 backdrop-blur-sm"
        >
          <motion.form
            initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }} transition={{ duration: 0.2 }}
            onSubmit={handleSubmit(submit)}
            className="card w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col"
          >
            <div className="flex items-start justify-between gap-4 border-b border-neutral-100 px-5 py-4 dark:border-neutral-700">
              <div>
                <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">{title}</h2>
                {subtitle && <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">{subtitle}</p>}
              </div>
              <button type="button" onClick={onClose} aria-label="Close form"
                className="rounded-xl p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-700">
                <Close fontSize="small" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {sections.map((section) => (
                <fieldset key={section.title}>
                  <legend className="mb-3 text-sm font-bold text-primary-600 dark:text-primary-400">
                    {section.title}
                  </legend>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {section.fields.map(renderField)}
                  </div>
                </fieldset>
              ))}
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-neutral-100 px-5 py-4 dark:border-neutral-700 sm:flex-row sm:justify-end">
              <button type="button" onClick={onClose} className="btn-secondary text-sm">Cancel</button>
              <button type="submit" disabled={isSubmitting || loading}
                className="btn-primary flex items-center justify-center gap-2 text-sm disabled:opacity-60">
                <Save fontSize="small" /> {isSubmitting ? 'Saving…' : submitLabel}
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export { LeadSelect }
