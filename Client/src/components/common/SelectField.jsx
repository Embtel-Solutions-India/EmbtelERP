import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { KeyboardArrowDown, Check } from '@mui/icons-material'

/**
 * Themed dropdown that matches `.input-field` styling. Replaces the native
 * <select> so the open list follows the app theme (light/dark) instead of the
 * OS default rendering. The list is portaled to <body> with fixed positioning
 * so it is never clipped by a scrolling modal/overflow container.
 */
export default function SelectField({
  id,
  name,
  value,
  onChange,
  options = [],
  disabled = false,
  placeholder = 'Select…',
  className = '',
}) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState(null)
  const triggerRef = useRef(null)
  const listRef = useRef(null)

  const selected = options.find((o) => String(o.value) === String(value ?? ''))

  const place = () => {
    const el = triggerRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    setCoords({ left: r.left, top: r.bottom + 4, width: r.width })
  }

  useLayoutEffect(() => {
    if (!open) return
    place()
    const reposition = () => place()
    // capture=true so scrolling inside the modal also repositions the list
    window.addEventListener('scroll', reposition, true)
    window.addEventListener('resize', reposition)
    return () => {
      window.removeEventListener('scroll', reposition, true)
      window.removeEventListener('resize', reposition)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e) => {
      if (triggerRef.current?.contains(e.target) || listRef.current?.contains(e.target)) return
      setOpen(false)
    }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const pick = (opt) => {
    onChange(opt.value)
    setOpen(false)
  }

  return (
    <>
      <button
        type="button"
        id={id}
        ref={triggerRef}
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`input-field flex items-center justify-between text-left ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${className}`}
      >
        <span className={`truncate ${selected ? '' : 'text-neutral-400 dark:text-neutral-500'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <KeyboardArrowDown
          fontSize="small"
          className={`shrink-0 text-neutral-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && coords && createPortal(
        <ul
          ref={listRef}
          role="listbox"
          aria-labelledby={id}
          style={{ position: 'fixed', left: coords.left, top: coords.top, width: coords.width, zIndex: 60 }}
          className="max-h-60 overflow-y-auto rounded-xl border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-600 dark:bg-neutral-800"
        >
          {options.length === 0 ? (
            <li className="px-4 py-2 text-sm text-neutral-400">No options</li>
          ) : (
            options.map((opt) => {
              const active = String(opt.value) === String(value ?? '')
              return (
                <li key={String(opt.value)} role="option" aria-selected={active}>
                  <button
                    type="button"
                    onClick={() => pick(opt)}
                    className={`flex w-full items-center justify-between gap-2 px-4 py-2 text-left text-sm transition-colors ${
                      active
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                        : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-700'
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {active && <Check style={{ fontSize: 16 }} className="shrink-0" />}
                  </button>
                </li>
              )
            })
          )}
        </ul>,
        document.body,
      )}
    </>
  )
}
