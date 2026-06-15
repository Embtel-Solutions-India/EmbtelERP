import { createSlice } from '@reduxjs/toolkit'

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: { list: [], unreadCount: 0 },
  reducers: {
    markRead(state, { payload }) {
      const n = state.list.find(n => n.id === payload)
      if (n && !n.read) { n.read = true; state.unreadCount = Math.max(0, state.unreadCount - 1) }
    },
    markAllRead(state) {
      state.list.forEach(n => (n.read = true))
      state.unreadCount = 0
    },
    addNotification(state, { payload }) {
      state.list.unshift({ ...payload, id: Date.now(), read: false })
      state.unreadCount += 1
    },
  },
})

export const { markRead, markAllRead, addNotification } = notificationSlice.actions
export default notificationSlice.reducer
