import { useState, useMemo, useEffect, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, isSameDay, isSameMonth, isToday, addMonths, subMonths,
  addWeeks, subWeeks, subDays, eachDayOfInterval
} from 'date-fns'
import { ChevronLeft, ChevronRight, Schedule, Close, Edit, Delete, Add } from '@mui/icons-material'
import SectionCard from '../common/SectionCard'
import {
  fetchCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  EVENT_COLORS,
  EVENT_TYPE_LABELS,
} from '../../redux/slices/calendarSlice'

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

const EVENT_TYPES = Object.keys(EVENT_TYPE_LABELS)

const PRIORITY_OPTS = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
const STATUS_OPTS   = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'POSTPONED']

const FILTER_TYPES = ['ALL', ...EVENT_TYPES]

// ─── Empty form state ────────────────────────────────────────────────────────
const EMPTY_FORM = {
  title: '',
  description: '',
  eventType: 'MEETING',
  status: 'SCHEDULED',
  priority: 'MEDIUM',
  date: format(new Date(), 'yyyy-MM-dd'),
  startTime: '09:00',
  endTime: '10:00',
  assignedToId: '',
  relatedModule: '',
}

// ─── Tiny input helper ────────────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'w-full px-3 py-2 text-sm border border-slate-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-400 transition'
const selectCls = inputCls

// ─── Create / Edit Modal ──────────────────────────────────────────────────────
function EventModal({ isOpen, onClose, initialData, onSave, saving, title }) {
  const [form, setForm] = useState(initialData || EMPTY_FORM)

  useEffect(() => { setForm(initialData || EMPTY_FORM) }, [initialData, isOpen])

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  if (!isOpen) return null
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 16 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 16 }}
          onClick={e => e.stopPropagation()}
          className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-gray-800">
            <h2 className="font-bold text-slate-800 dark:text-slate-100 text-base">{title}</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors">
              <Close fontSize="small" className="text-slate-400" />
            </button>
          </div>

          {/* Form */}
          <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
            <Field label="Event Title *">
              <input
                type="text"
                value={form.title}
                onChange={e => set('title', e.target.value)}
                placeholder="e.g. Discovery Call with Arjun"
                className={inputCls}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Type">
                <select value={form.eventType} onChange={e => set('eventType', e.target.value)} className={selectCls}>
                  {EVENT_TYPES.map(t => <option key={t} value={t}>{EVENT_TYPE_LABELS[t]}</option>)}
                </select>
              </Field>
              <Field label="Priority">
                <select value={form.priority} onChange={e => set('priority', e.target.value)} className={selectCls}>
                  {PRIORITY_OPTS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Field label="Date *">
                <input type="date" value={form.date} onChange={e => set('date', e.target.value)} className={inputCls} />
              </Field>
              <Field label="Start Time">
                <input type="time" value={form.startTime} onChange={e => set('startTime', e.target.value)} className={inputCls} />
              </Field>
              <Field label="End Time">
                <input type="time" value={form.endTime} onChange={e => set('endTime', e.target.value)} className={inputCls} />
              </Field>
            </div>

            <Field label="Status">
              <select value={form.status} onChange={e => set('status', e.target.value)} className={selectCls}>
                {STATUS_OPTS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </Field>

            <Field label="Description">
              <textarea
                rows={3}
                value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Additional notes..."
                className={`${inputCls} resize-none`}
              />
            </Field>

            <Field label="Related Module (optional)">
              <select value={form.relatedModule} onChange={e => set('relatedModule', e.target.value)} className={selectCls}>
                <option value="">None</option>
                <option value="lead">Lead</option>
                <option value="campaign">Campaign</option>
                <option value="task">Task</option>
                <option value="employee">Employee</option>
              </select>
            </Field>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-100 dark:border-gray-800">
            <button onClick={onClose} className="btn-secondary text-sm px-4 py-2 rounded-xl">Cancel</button>
            <button
              onClick={() => onSave(form)}
              disabled={saving || !form.title || !form.date}
              className="btn-primary text-sm px-5 py-2 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Event'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Event Detail Drawer ──────────────────────────────────────────────────────
function EventDrawer({ event, onClose, onEdit, onDelete, deleting }) {
  if (!event) return null
  const color = EVENT_COLORS[event.eventType] || EVENT_COLORS.OTHER
  const label = EVENT_TYPE_LABELS[event.eventType] || event.eventType

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:justify-center bg-slate-950/40 px-0 sm:px-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
          className="bg-white dark:bg-gray-900 border-l border-slate-200 dark:border-gray-700 h-full w-full sm:w-96 sm:h-auto sm:rounded-2xl shadow-2xl flex flex-col"
        >
          {/* Top strip */}
          <div className="h-1.5 w-full rounded-t-2xl" style={{ backgroundColor: color }} />

          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors" title="Edit event">
                <Edit fontSize="small" className="text-primary-500" />
              </button>
              <button
                onClick={onDelete}
                disabled={deleting}
                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors disabled:opacity-50"
                title="Delete event"
              >
                <Delete fontSize="small" className="text-red-500" />
              </button>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors">
                <Close fontSize="small" className="text-slate-400" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg leading-tight">{event.title}</h3>
              <p className="text-sm text-slate-400 dark:text-slate-500 flex items-center gap-1.5 mt-1.5">
                <Schedule style={{ fontSize: 14 }} />
                {format(new Date(event.date), 'EEEE, MMMM d, yyyy')}
                {event.startTime && ` · ${event.startTime}${event.endTime ? ' – ' + event.endTime : ''}`}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 dark:bg-gray-800/50 rounded-xl p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Priority</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{event.priority}</p>
              </div>
              <div className="bg-slate-50 dark:bg-gray-800/50 rounded-xl p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Status</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{event.status?.replace('_', ' ')}</p>
              </div>
            </div>

            {event.description && (
              <div className="bg-slate-50 dark:bg-gray-800/50 rounded-xl p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Notes</p>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">{event.description}</p>
              </div>
            )}

            {event.relatedModule && (
              <div className="bg-slate-50 dark:bg-gray-800/50 rounded-xl p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Related Module</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 capitalize">{event.relatedModule}</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Main CalendarWidget ──────────────────────────────────────────────────────
export default function CalendarWidget() {
  const dispatch = useDispatch()
  const { events, loading, creating, updating } = useSelector(s => s.calendar)
  const { user } = useSelector(s => s.auth)

  const [current, setCurrent] = useState(new Date())
  const [viewMode, setViewMode] = useState('month')
  const [selectedDay, setSelectedDay] = useState(new Date())
  const [filterType, setFilterType] = useState('ALL')

  // Modal states
  const [createOpen, setCreateOpen] = useState(false)
  const [editEvent, setEditEvent]   = useState(null)  // event being edited
  const [detailEvent, setDetailEvent] = useState(null)  // event shown in drawer
  const [prefillDate, setPrefillDate] = useState(null)

  // Fetch events when month changes
  useEffect(() => {
    const start = format(startOfMonth(current), 'yyyy-MM-dd')
    const end   = format(endOfMonth(addMonths(current, 1)), 'yyyy-MM-dd')
    dispatch(fetchCalendarEvents({ startDate: start, endDate: end }))
  }, [dispatch, current])

  const handleNext = () => {
    if (viewMode === 'month') setCurrent(addMonths(current, 1))
    else if (viewMode === 'week') setCurrent(addWeeks(current, 1))
    else setCurrent(addDays(current, 1))
  }
  const handlePrev = () => {
    if (viewMode === 'month') setCurrent(subMonths(current, 1))
    else if (viewMode === 'week') setCurrent(subWeeks(current, 1))
    else setCurrent(subDays(current, 1))
  }

  // All events filtered by type and aggregated with meetings/tasks from Redux
  const { list: meetings } = useSelector(s => s.meetings || { list: [] })
  const { list: tasks }    = useSelector(s => s.tasks    || { list: [] })

  const allEvents = useMemo(() => {
    const list = [...events]

    // Merge local meeting slice events
    meetings.forEach(m => {
      list.push({
        id: `meet-${m.id}`,
        title: m.title || `Meeting – ${m.client || 'Client'}`,
        date: m.date,
        eventType: 'MEETING',
        startTime: m.time,
        status: 'SCHEDULED',
        priority: 'MEDIUM',
        description: m.location,
        _readonly: true,
      })
    })
    // Merge task deadlines
    tasks.forEach(t => {
      if (t.dueDate) {
        const isFollowUp = String(t.title + ' ' + (t.description || '')).toLowerCase().includes('follow')
        list.push({
          id: `task-${t.id}`,
          title: t.title,
          date: t.dueDate,
          eventType: isFollowUp ? 'FOLLOWUP' : 'TASK',
          priority: (t.priority || 'medium').toUpperCase(),
          status: (t.status || 'SCHEDULED').toUpperCase(),
          description: t.description,
          _readonly: true,
        })
      }
    })

    return list
  }, [events, meetings, tasks])

  const filteredEvents = useMemo(() =>
    filterType === 'ALL' ? allEvents : allEvents.filter(e => e.eventType === filterType),
    [allEvents, filterType]
  )

  const getEventsForDay = useCallback((day) =>
    filteredEvents.filter(e => isSameDay(new Date(e.date), day)),
    [filteredEvents]
  )

  // ── Calendar grid cells ───────────────────────────────────────────────────
  const monthStart = startOfMonth(current)
  const monthEnd   = endOfMonth(current)
  const weekStart  = startOfWeek(current)
  const weekEnd    = endOfWeek(current)

  const dayCells = useMemo(() => {
    if (viewMode === 'month') return eachDayOfInterval({ start: startOfWeek(monthStart), end: endOfWeek(monthEnd) })
    if (viewMode === 'week')  return eachDayOfInterval({ start: weekStart, end: weekEnd })
    return [current]
  }, [viewMode, current, monthStart, monthEnd, weekStart, weekEnd])

  const dayEvents = getEventsForDay(selectedDay)

  // ── CRUD handlers ─────────────────────────────────────────────────────────
  async function handleCreate(form) {
    await dispatch(createCalendarEvent(form))
    setCreateOpen(false)
    setPrefillDate(null)
  }

  async function handleEdit(form) {
    if (!editEvent) return
    await dispatch(updateCalendarEvent({ id: editEvent.id, ...form }))
    setEditEvent(null)
    setDetailEvent(null)
  }

  async function handleDelete(event) {
    if (event._readonly) return
    if (!window.confirm(`Delete "${event.title}"?`)) return
    await dispatch(deleteCalendarEvent(event.id))
    setDetailEvent(null)
  }

  function openCreateForDay(day) {
    setPrefillDate(format(day, 'yyyy-MM-dd'))
    setCreateOpen(true)
  }

  function openEditFromDrawer() {
    if (!detailEvent || detailEvent._readonly) return
    setEditEvent(detailEvent)
    setDetailEvent(null)
  }

  const createInitial = prefillDate
    ? { ...EMPTY_FORM, date: prefillDate }
    : EMPTY_FORM

  const editInitial = editEvent
    ? {
        title: editEvent.title || '',
        description: editEvent.description || '',
        eventType: editEvent.eventType || 'MEETING',
        status: editEvent.status || 'SCHEDULED',
        priority: editEvent.priority || 'MEDIUM',
        date: editEvent.date ? format(new Date(editEvent.date), 'yyyy-MM-dd') : '',
        startTime: editEvent.startTime || '09:00',
        endTime: editEvent.endTime || '10:00',
        assignedToId: editEvent.assignedToId || '',
        relatedModule: editEvent.relatedModule || '',
      }
    : EMPTY_FORM

  return (
    <>
      <SectionCard
        title="Calendar"
        subtitle="Schedule & event management"
        delay={0.3}
        actions={
          <div className="flex items-center gap-2">
            {/* View mode toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-gray-800 rounded-xl p-1 gap-0.5">
              {['month', 'week', 'day'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                    viewMode === mode
                      ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
            {/* Add Event */}
            <button
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-1 btn-primary text-xs px-3 py-1.5 rounded-xl"
            >
              <Add style={{ fontSize: 14 }} />
              Add
            </button>
          </div>
        }
      >
        {/* ── Filter Bar ───────────────────────────────────────────────────── */}
        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
          {['ALL', 'MEETING', 'FOLLOWUP', 'TASK', 'DEADLINE', 'CAMPAIGN', 'APPROVAL'].map(ft => (
            <button
              key={ft}
              onClick={() => setFilterType(ft)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase transition-all ${
                filterType === ft
                  ? 'text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-gray-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-gray-700'
              }`}
              style={filterType === ft ? { backgroundColor: ft === 'ALL' ? '#6366f1' : EVENT_COLORS[ft] } : {}}
            >
              {ft === 'ALL' ? 'All' : EVENT_TYPE_LABELS[ft] || ft}
            </button>
          ))}
        </div>

        {/* ── Navigation ────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {viewMode === 'month' && format(current, 'MMMM yyyy')}
            {viewMode === 'week'  && `Week of ${format(weekStart, 'MMM d, yyyy')}`}
            {viewMode === 'day'   && format(current, 'EEEE, MMM d, yyyy')}
          </h4>
          <div className="flex items-center gap-1">
            <button onClick={handlePrev} className="btn-secondary p-1.5 rounded-lg">
              <ChevronLeft style={{ fontSize: 16 }} />
            </button>
            <button onClick={() => { setCurrent(new Date()); setSelectedDay(new Date()) }} className="btn-secondary text-xs px-2.5 py-1.5 rounded-lg">
              Today
            </button>
            <button onClick={handleNext} className="btn-secondary p-1.5 rounded-lg">
              <ChevronRight style={{ fontSize: 16 }} />
            </button>
          </div>
        </div>

        {/* ── Day Labels ────────────────────────────────────────────────────── */}
        {viewMode !== 'day' && (
          <div className="grid grid-cols-7 gap-px mb-1 text-center">
            {DAY_LABELS.map(d => (
              <div key={d} className="text-xs font-semibold text-slate-400 dark:text-slate-500 py-1">{d}</div>
            ))}
          </div>
        )}

        {/* ── Calendar Grid ─────────────────────────────────────────────────── */}
        <div className={`grid ${viewMode === 'day' ? 'grid-cols-1' : 'grid-cols-7'} gap-1`}>
          {dayCells.map((day, idx) => {
            const dayEvts   = getEventsForDay(day)
            const sameMonth = isSameMonth(day, current)
            const today     = isToday(day)
            const selected  = isSameDay(day, selectedDay)

            return (
              <motion.div
                key={idx}
                whileHover={{ scale: viewMode === 'day' ? 1 : 1.04 }}
                onClick={() => { setSelectedDay(day); if (viewMode === 'day') setViewMode('day') }}
                onDoubleClick={() => openCreateForDay(day)}
                className={`relative flex flex-col items-center p-1.5 rounded-xl cursor-pointer transition-all min-h-[52px] ${
                  !sameMonth && viewMode === 'month' ? 'opacity-30' : ''
                } ${
                  selected
                    ? 'bg-primary-50 dark:bg-primary-950/20 border-2 border-primary-500'
                    : today
                    ? 'bg-slate-100 dark:bg-gray-800 border-2 border-transparent'
                    : 'hover:bg-slate-50 dark:hover:bg-gray-800/40 border-2 border-transparent'
                }`}
              >
                <span className={`text-xs font-bold ${today ? 'text-primary-600 dark:text-primary-400' : 'text-slate-700 dark:text-slate-300'}`}>
                  {viewMode === 'day' ? format(day, 'EEEE, MMMM d') : format(day, 'd')}
                </span>

                {dayEvts.length > 0 && (
                  <div className={`w-full mt-1 space-y-0.5 ${viewMode === 'month' ? 'hidden sm:block' : ''}`}>
                    {dayEvts.slice(0, 2).map((e) => (
                      <div
                        key={e.id}
                        onClick={(evt) => { evt.stopPropagation(); setDetailEvent(e) }}
                        className="text-[9px] px-1 py-0.5 rounded font-semibold truncate text-white leading-none"
                        style={{ backgroundColor: EVENT_COLORS[e.eventType] || '#94a3b8' }}
                      >
                        {e.title}
                      </div>
                    ))}
                    {dayEvts.length > 2 && (
                      <div className="text-[9px] text-center text-slate-400 font-bold">+{dayEvts.length - 2}</div>
                    )}
                  </div>
                )}

                {/* Mobile dot indicators */}
                {dayEvts.length > 0 && viewMode === 'month' && (
                  <div className="flex gap-0.5 mt-0.5 sm:hidden">
                    {dayEvts.slice(0, 3).map(e => (
                      <span key={e.id} className="w-1 h-1 rounded-full" style={{ backgroundColor: EVENT_COLORS[e.eventType] || '#94a3b8' }} />
                    ))}
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* ── Selected Day Event List ────────────────────────────────────────── */}
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {format(selectedDay, 'MMM d')} — {dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''}
            </h5>
            <button
              onClick={() => openCreateForDay(selectedDay)}
              className="text-xs text-primary-600 dark:text-primary-400 font-semibold hover:underline flex items-center gap-0.5"
            >
              <Add style={{ fontSize: 13 }} /> Add
            </button>
          </div>
          {dayEvents.length > 0 ? (
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {dayEvents.map(e => (
                <div
                  key={e.id}
                  onClick={() => setDetailEvent(e)}
                  className="flex items-center gap-2 p-2 rounded-xl border border-slate-100 dark:border-gray-800 hover:bg-slate-50 dark:hover:bg-gray-800/40 cursor-pointer transition-colors"
                >
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: EVENT_COLORS[e.eventType] || '#94a3b8' }} />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex-1 truncate">{e.title}</span>
                  {e.startTime && <span className="text-[10px] text-slate-400 flex-shrink-0">{e.startTime}</span>}
                  <span className="text-[10px] text-slate-400 capitalize flex-shrink-0">{EVENT_TYPE_LABELS[e.eventType] || e.eventType}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No events. Double-click a day or tap "+ Add" to schedule.</p>
          )}
        </div>

        {loading && (
          <div className="mt-2 text-center text-xs text-slate-400 animate-pulse">Loading events…</div>
        )}
      </SectionCard>

      {/* ── Create Modal ─────────────────────────────────────────────────────── */}
      <EventModal
        isOpen={createOpen}
        onClose={() => { setCreateOpen(false); setPrefillDate(null) }}
        initialData={createInitial}
        onSave={handleCreate}
        saving={creating}
        title="Create Event"
      />

      {/* ── Edit Modal ───────────────────────────────────────────────────────── */}
      <EventModal
        isOpen={!!editEvent}
        onClose={() => setEditEvent(null)}
        initialData={editInitial}
        onSave={handleEdit}
        saving={updating}
        title="Edit Event"
      />

      {/* ── Event Detail Drawer ──────────────────────────────────────────────── */}
      <EventDrawer
        event={detailEvent}
        onClose={() => setDetailEvent(null)}
        onEdit={openEditFromDrawer}
        onDelete={() => handleDelete(detailEvent)}
        deleting={updating}
      />
    </>
  )
}
