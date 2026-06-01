import { createSlice } from '@reduxjs/toolkit'

const tasks = [
  { id: 1,  title: 'Send proposal to Wipro',       priority: 'urgent', status: 'todo',        dueDate: new Date().toISOString(),                        category: 'sales',   lead: 'Rohan Kapoor' },
  { id: 2,  title: 'Follow up with HCL',           priority: 'high',   status: 'todo',        dueDate: new Date().toISOString(),                        category: 'followup',lead: 'Sneha Patel'  },
  { id: 3,  title: 'Prepare demo for TCS',         priority: 'high',   status: 'in_progress', dueDate: new Date(Date.now() + 86400000).toISOString(),   category: 'sales',   lead: 'Vikram Nair'  },
  { id: 4,  title: 'Update CRM pipeline data',     priority: 'medium', status: 'in_progress', dueDate: new Date(Date.now() + 86400000).toISOString(),   category: 'admin',   lead: null           },
  { id: 5,  title: 'Review Q4 sales targets',      priority: 'medium', status: 'todo',        dueDate: new Date(Date.now() + 172800000).toISOString(),  category: 'admin',   lead: null           },
  { id: 6,  title: 'Call Infosys back',            priority: 'high',   status: 'done',        dueDate: new Date(Date.now() - 86400000).toISOString(),   category: 'followup',lead: 'Priya Singh'  },
  { id: 7,  title: 'Send quotation to Oracle',     priority: 'urgent', status: 'overdue',     dueDate: new Date(Date.now() - 172800000).toISOString(),  category: 'sales',   lead: 'Kavita Sharma'},
  { id: 8,  title: 'Prepare monthly report',       priority: 'medium', status: 'todo',        dueDate: new Date(Date.now() + 259200000).toISOString(),  category: 'admin',   lead: null           },
  { id: 9,  title: 'Schedule IBM discovery call',  priority: 'low',    status: 'todo',        dueDate: new Date(Date.now() + 345600000).toISOString(),  category: 'sales',   lead: 'Ananya Roy'   },
  { id: 10, title: 'Attend sales training webinar',priority: 'low',    status: 'todo',        dueDate: new Date(Date.now() + 432000000).toISOString(),  category: 'training',lead: null           },
]

const taskSlice = createSlice({
  name: 'tasks',
  initialState: {
    list: tasks,
    loading: false,
    filter: 'all',
  },
  reducers: {
    addTask(state, { payload }) { state.list.unshift(payload) },
    toggleTask(state, { payload }) {
      const t = state.list.find(t => t.id === payload)
      if (t) t.status = t.status === 'done' ? 'todo' : 'done'
    },
    updateTask(state, { payload }) {
      const idx = state.list.findIndex(t => t.id === payload.id)
      if (idx !== -1) state.list[idx] = payload
    },
    deleteTask(state, { payload }) { state.list = state.list.filter(t => t.id !== payload) },
    setFilter(state, { payload }) { state.filter = payload },
    setLoading(state, { payload }) { state.loading = payload },
  },
})

export const { addTask, toggleTask, updateTask, deleteTask, setFilter, setLoading } = taskSlice.actions
export default taskSlice.reducer
