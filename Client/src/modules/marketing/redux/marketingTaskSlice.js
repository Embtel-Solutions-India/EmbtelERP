import { createSlice } from '@reduxjs/toolkit'

const tasks = [
  { id: 1,  title: 'Design Q3 Product Hunt launch assets', priority: 'urgent', status: 'todo',        dueDate: new Date().toISOString(),                        category: 'campaign',   lead: 'AI CRM Co-pilot' },
  { id: 2,  title: 'Write copy for Summer Sale PPC landing page',  priority: 'high',   status: 'todo',        dueDate: new Date().toISOString(),                        category: 'content',    lead: 'Summer Sale PPC' },
  { id: 3,  title: 'Schedule weekly social media update posts',   priority: 'high',   status: 'in_progress', dueDate: new Date(Date.now() + 86400000).toISOString(),   category: 'social',     lead: 'Instagram Influencer'  },
  { id: 4,  title: 'Review email copy for Q2 newsletter',        priority: 'medium', status: 'in_progress', dueDate: new Date(Date.now() + 86400000).toISOString(),   category: 'email',      lead: 'Q2 Newsletter'  },
  { id: 5,  title: 'Optimize metadata for homepage landing page',  priority: 'medium', status: 'todo',        dueDate: new Date(Date.now() + 172800000).toISOString(),  category: 'landing_page', lead: null           },
  { id: 6,  title: 'Run Google Analytics 4 performance audit',   priority: 'high',   status: 'done',        dueDate: new Date(Date.now() - 86400000).toISOString(),   category: 'admin',      lead: null           },
  { id: 7,  title: 'Publish tech blog post on DBaaS integration',  priority: 'urgent', status: 'overdue',     dueDate: new Date(Date.now() - 172800000).toISOString(),  category: 'content',    lead: 'SEO Blog' },
  { id: 8,  title: 'A/B test signup forms on website',           priority: 'medium', status: 'todo',        dueDate: new Date(Date.now() + 259200000).toISOString(),  category: 'landing_page', lead: null           },
]

const marketingTaskSlice = createSlice({
  name: 'marketingTasks',
  initialState: {
    list: tasks,
    loading: false,
    filter: 'all',
  },
  reducers: {
    addMarketingTask(state, { payload }) { state.list.unshift(payload) },
    toggleMarketingTask(state, { payload }) {
      const t = state.list.find(t => t.id === payload)
      if (t) t.status = t.status === 'done' ? 'todo' : 'done'
    },
    updateMarketingTask(state, { payload }) {
      const idx = state.list.findIndex(t => t.id === payload.id)
      if (idx !== -1) state.list[idx] = payload
    },
    deleteMarketingTask(state, { payload }) { state.list = state.list.filter(t => t.id !== payload) },
    setFilter(state, { payload }) { state.filter = payload },
    setLoading(state, { payload }) { state.loading = payload },
  },
})

export const { addMarketingTask, toggleMarketingTask, updateMarketingTask, deleteMarketingTask, setFilter, setLoading } = marketingTaskSlice.actions
export default marketingTaskSlice.reducer
