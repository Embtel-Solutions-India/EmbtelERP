import { createSlice } from '@reduxjs/toolkit'

const notifications = [
  { id: 1, type: 'lead',    title: 'New Lead Assigned',      message: 'Tech Mahindra – Enterprise CRM package interest', time: new Date(Date.now() - 5 * 60000).toISOString(),   read: false },
  { id: 2, type: 'meeting', title: 'Meeting Reminder',        message: 'Demo call with Infosys in 30 minutes',             time: new Date(Date.now() - 15 * 60000).toISOString(),  read: false },
  { id: 3, type: 'target',  title: 'Target Achievement',      message: 'You hit 80% of your monthly target!',              time: new Date(Date.now() - 60 * 60000).toISOString(),  read: false },
  { id: 4, type: 'client',  title: 'Client Response',         message: 'Wipro replied to your proposal email',             time: new Date(Date.now() - 2 * 3600000).toISOString(), read: true  },
  { id: 5, type: 'system',  title: 'System Update',           message: 'CRM Pro updated to v3.4.0 – new pipeline features',time: new Date(Date.now() - 5 * 3600000).toISOString(), read: true  },
  { id: 6, type: 'lead',    title: 'Follow-Up Due',           message: 'Scheduled follow-up with HCL Technologies today',  time: new Date(Date.now() - 30 * 60000).toISOString(),  read: false },
]

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: { list: notifications, unreadCount: notifications.filter(n => !n.read).length },
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
