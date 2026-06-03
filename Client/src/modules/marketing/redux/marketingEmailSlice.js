import { createSlice } from '@reduxjs/toolkit'

const campaigns = [
  { id: 1, client: 'Google Ads',    company: 'Summer Sale PPC',         type: 'PPC Launch',      date: new Date(Date.now() + 3600000).toISOString(),     duration: 60,  location: 'AdWords Console', status: 'Scheduled', link: 'https://ads.google.com' },
  { id: 2, client: 'Mailchimp',     company: 'Q2 Newsletter Blast',     type: 'Email Broadcast', date: new Date(Date.now() + 7200000).toISOString(),     duration: 30,  location: 'Mailchimp Campaign Builder', status: 'Scheduled', link: 'https://mailchimp.com' },
  { id: 3, client: 'LinkedIn Page', company: 'Spring Promo Post',       type: 'Social Post',     date: new Date(Date.now() + 86400000).toISOString(),    duration: 15,  location: 'Buffer Scheduler', status: 'Scheduled', link: 'https://linkedin.com' },
  { id: 4, client: 'Company Blog',  company: 'DBaaS SEO Guide',         type: 'Content Release', date: new Date(Date.now() + 172800000).toISOString(),   duration: 45,  location: 'WordPress CMS',   status: 'Scheduled', link: 'https://wordpress.com' },
  { id: 5, client: 'Zoom Webinar',  company: 'AI CRM Demo',             type: 'Webinar Event',   date: new Date(Date.now() + 259200000).toISOString(),   duration: 60,  location: 'Zoom Meetings',   status: 'Scheduled', link: 'https://zoom.us' },
  { id: 6, client: 'YouTube Channel', company: 'CRM Walkthrough Video',  type: 'Content Release', date: new Date(Date.now() - 3600000).toISOString(),     duration: 120, location: 'YouTube Studio',  status: 'Completed', link: null },
]

const marketingEmailSlice = createSlice({
  name: 'marketingEmails',
  initialState: {
    list: campaigns,
    upcoming: campaigns.filter(m => new Date(m.date) > new Date() && m.status === 'Scheduled'),
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
