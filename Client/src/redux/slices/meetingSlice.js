import { createSlice } from '@reduxjs/toolkit'

const meetings = [
  { id: 1, client: 'Arjun Mehta',    company: 'Tech Mahindra',   type: 'Product Demo',    date: new Date(Date.now() + 3600000).toISOString(),     duration: 60,  location: 'Google Meet',     status: 'Scheduled', link: 'https://meet.google.com/abc-defg-hij' },
  { id: 2, client: 'Priya Singh',    company: 'Infosys Ltd',     type: 'Discovery Call',  date: new Date(Date.now() + 7200000).toISOString(),     duration: 30,  location: 'Zoom',            status: 'Scheduled', link: 'https://zoom.us/j/123456789' },
  { id: 3, client: 'Rohan Kapoor',   company: 'Wipro Systems',   type: 'Proposal Review', date: new Date(Date.now() + 86400000).toISOString(),    duration: 90,  location: 'Office – Room 4B',status: 'Scheduled', link: null },
  { id: 4, client: 'Sneha Patel',    company: 'HCL Technologies',type: 'Negotiation',     date: new Date(Date.now() + 172800000).toISOString(),   duration: 60,  location: 'Microsoft Teams', status: 'Scheduled', link: 'https://teams.microsoft.com/meet/abc' },
  { id: 5, client: 'Vikram Nair',    company: 'TCS',             type: 'Contract Signing',date: new Date(Date.now() + 259200000).toISOString(),   duration: 45,  location: 'Client Office',   status: 'Scheduled', link: null },
  { id: 6, client: 'Kavita Sharma',  company: 'Oracle India',    type: 'Onboarding',      date: new Date(Date.now() - 3600000).toISOString(),     duration: 120, location: 'Zoom',            status: 'Completed', link: null },
  { id: 7, client: 'Meena Gupta',    company: 'Salesforce India',type: 'Check-in Call',   date: new Date(Date.now() + 432000000).toISOString(),   duration: 30,  location: 'Google Meet',     status: 'Scheduled', link: 'https://meet.google.com/xyz-uvwx-yz' },
]

const meetingSlice = createSlice({
  name: 'meetings',
  initialState: {
    list: meetings,
    upcoming: meetings.filter(m => new Date(m.date) > new Date() && m.status === 'Scheduled'),
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
