import { createSlice } from '@reduxjs/toolkit'

const meetingSlice = createSlice({
  name: 'meetings',
  initialState: {
    list: [],
    upcoming: [],
    selected: null,
    loading: false,
  },
  reducers: {
    addMeeting(state, { payload }) { state.list.unshift(payload); state.upcoming.unshift(payload) },
    updateMeeting(state, { payload }) {
      const idx = state.list.findIndex(m => m.id === payload.id)
      if (idx !== -1) state.list[idx] = payload
    },
    cancelMeeting(state, { payload }) {
      const m = state.list.find(m => m.id === payload)
      if (m) m.status = 'Cancelled'
      state.upcoming = state.upcoming.filter(m => m.id !== payload)
    },
    selectMeeting(state, { payload }) { state.selected = payload },
    setLoading(state, { payload }) { state.loading = payload },
  },
})

export const { addMeeting, updateMeeting, cancelMeeting, selectMeeting, setLoading } = meetingSlice.actions
export default meetingSlice.reducer
