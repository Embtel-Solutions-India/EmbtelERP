import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

// ── Async Thunks ─────────────────────────────────────────────────────────────

export const fetchCalendarEvents = createAsyncThunk(
  'calendar/fetchEvents',
  async ({ startDate, endDate } = {}, { rejectWithValue }) => {
    try {
      const params = {}
      if (startDate) params.startDate = startDate
      if (endDate)   params.endDate   = endDate
      const res = await api.get('/calendar', { params })
      return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []
    } catch (err) {
      return rejectWithValue(err?.message || 'Failed to fetch events')
    }
  }
)

export const createCalendarEvent = createAsyncThunk(
  'calendar/createEvent',
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post('/calendar', data)
      return res?.data || res
    } catch (err) {
      return rejectWithValue(err?.message || 'Failed to create event')
    }
  }
)

export const updateCalendarEvent = createAsyncThunk(
  'calendar/updateEvent',
  async ({ id, ...data }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/calendar/${id}`, data)
      return res?.data || res
    } catch (err) {
      return rejectWithValue(err?.message || 'Failed to update event')
    }
  }
)

export const deleteCalendarEvent = createAsyncThunk(
  'calendar/deleteEvent',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/calendar/${id}`)
      return id
    } catch (err) {
      return rejectWithValue(err?.message || 'Failed to delete event')
    }
  }
)

// ── Event type colours ────────────────────────────────────────────────────────
export const EVENT_COLORS = {
  MEETING:         '#6366f1',
  FOLLOWUP:        '#f59e0b',
  TASK:            '#3b82f6',
  DEADLINE:        '#ef4444',
  CAMPAIGN:        '#10b981',
  DOCUMENT_REVIEW: '#06b6d4',
  APPROVAL:        '#8b5cf6',
  INTERVIEW:       '#f97316',
  EMPLOYEE_EVENT:  '#ec4899',
  OTHER:           '#94a3b8',
}

export const EVENT_TYPE_LABELS = {
  MEETING:         'Meeting',
  FOLLOWUP:        'Follow Up',
  TASK:            'Task',
  DEADLINE:        'Deadline',
  CAMPAIGN:        'Campaign',
  DOCUMENT_REVIEW: 'Document Review',
  APPROVAL:        'Approval',
  INTERVIEW:       'Interview',
  EMPLOYEE_EVENT:  'Employee Event',
  OTHER:           'Other',
}

// ── Slice ─────────────────────────────────────────────────────────────────────
const calendarSlice = createSlice({
  name: 'calendar',
  initialState: {
    events: [],       // CalendarEvent[]
    loading: false,
    creating: false,
    updating: false,
    error: null,
    createError: null,
  },
  reducers: {
    clearCreateError(state) { state.createError = null },
    clearError(state)       { state.error = null },
  },
  extraReducers: (builder) => {
    // Fetch
    builder
      .addCase(fetchCalendarEvents.pending,  (state) => { state.loading = true;  state.error = null })
      .addCase(fetchCalendarEvents.fulfilled, (state, { payload }) => {
        state.loading = false
        state.events  = payload
      })
      .addCase(fetchCalendarEvents.rejected, (state, { payload }) => {
        state.loading = false
        state.error   = payload
      })

    // Create
    builder
      .addCase(createCalendarEvent.pending,  (state) => { state.creating = true;  state.createError = null })
      .addCase(createCalendarEvent.fulfilled, (state, { payload }) => {
        state.creating = false
        if (payload) state.events.push(payload)
      })
      .addCase(createCalendarEvent.rejected, (state, { payload }) => {
        state.creating = false
        state.createError = payload
      })

    // Update
    builder
      .addCase(updateCalendarEvent.pending,  (state) => { state.updating = true })
      .addCase(updateCalendarEvent.fulfilled, (state, { payload }) => {
        state.updating = false
        if (payload) {
          const idx = state.events.findIndex(e => e.id === payload.id)
          if (idx !== -1) state.events[idx] = payload
        }
      })
      .addCase(updateCalendarEvent.rejected, (state, { payload }) => {
        state.updating = false
        state.error = payload
      })

    // Delete
    builder
      .addCase(deleteCalendarEvent.pending,  (state) => { state.updating = true })
      .addCase(deleteCalendarEvent.fulfilled, (state, { payload }) => {
        state.updating = false
        state.events = state.events.filter(e => e.id !== payload)
      })
      .addCase(deleteCalendarEvent.rejected, (state, { payload }) => {
        state.updating = false
        state.error = payload
      })
  },
})

export const { clearCreateError, clearError } = calendarSlice.actions
export default calendarSlice.reducer
