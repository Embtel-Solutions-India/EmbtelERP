import { createSlice } from '@reduxjs/toolkit'

const marketingEmailSlice = createSlice({
  name: 'marketingEmails',
  initialState: {
    list: [],
    upcoming: [],
    selected: null,
    loading: false,
  },
  reducers: {
    addBroadcast(state, { payload }) { state.list.unshift(payload); state.upcoming.unshift(payload) },
    updateBroadcast(state, { payload }) {
      const idx = state.list.findIndex(m => m.id === payload.id)
      if (idx !== -1) state.list[idx] = payload
    },
    cancelBroadcast(state, { payload }) {
      const m = state.list.find(m => m.id === payload)
      if (m) m.status = 'Cancelled'
      state.upcoming = state.upcoming.filter(m => m.id !== payload)
    },
    selectBroadcast(state, { payload }) { state.selected = payload },
    setLoading(state, { payload }) { state.loading = payload },
  },
})

export const { addBroadcast, updateBroadcast, cancelBroadcast, selectBroadcast, setLoading } = marketingEmailSlice.actions
export default marketingEmailSlice.reducer
