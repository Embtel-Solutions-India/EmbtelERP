import { createSlice } from '@reduxjs/toolkit'

const leads = [
  { id: 1, name: 'Arjun Mehta',    company: 'Tech Mahindra',   email: 'arjun@techmahindra.com',  phone: '+91 98765 43210', status: 'new',         priority: 'hot',  value: 85000,  nextFollowUp: new Date(Date.now() + 86400000).toISOString(),   lastContact: new Date(Date.now() - 2 * 86400000).toISOString(), source: 'LinkedIn' },
  { id: 2, name: 'Priya Singh',    company: 'Infosys Ltd',      email: 'priya.s@infosys.com',     phone: '+91 87654 32109', status: 'contacted',   priority: 'warm', value: 120000, nextFollowUp: new Date(Date.now() + 172800000).toISOString(),  lastContact: new Date(Date.now() - 86400000).toISOString(),     source: 'Website'  },
  { id: 3, name: 'Rohan Kapoor',   company: 'Wipro Systems',    email: 'rohan.k@wipro.com',       phone: '+91 76543 21098', status: 'qualified',   priority: 'hot',  value: 200000, nextFollowUp: new Date(Date.now() + 43200000).toISOString(),   lastContact: new Date(Date.now() - 3 * 86400000).toISOString(), source: 'Referral' },
  { id: 4, name: 'Sneha Patel',    company: 'HCL Technologies', email: 'sneha.p@hcl.com',         phone: '+91 65432 10987', status: 'proposal',    priority: 'hot',  value: 350000, nextFollowUp: new Date(Date.now() + 21600000).toISOString(),   lastContact: new Date(Date.now() - 86400000).toISOString(),     source: 'Cold Call'},
  { id: 5, name: 'Vikram Nair',    company: 'Tata Consultancy', email: 'vikram.n@tcs.com',        phone: '+91 54321 09876', status: 'negotiation', priority: 'warm', value: 175000, nextFollowUp: new Date(Date.now() + 7200000).toISOString(),    lastContact: new Date(Date.now() - 43200000).toISOString(),     source: 'Event'    },
  { id: 6, name: 'Kavita Sharma',  company: 'Oracle India',     email: 'kavita.s@oracle.com',     phone: '+91 43210 98765', status: 'won',         priority: 'hot',  value: 450000, nextFollowUp: null,                                             lastContact: new Date(Date.now() - 86400000).toISOString(),     source: 'LinkedIn' },
  { id: 7, name: 'Amit Kumar',     company: 'Microsoft India',  email: 'amit.k@microsoft.com',    phone: '+91 32109 87654', status: 'new',         priority: 'cold', value: 65000,  nextFollowUp: new Date(Date.now() + 259200000).toISOString(),  lastContact: new Date(Date.now() - 5 * 86400000).toISOString(), source: 'Website'  },
  { id: 8, name: 'Deepa Reddy',    company: 'Amazon Web Svc',  email: 'deepa.r@aws.com',         phone: '+91 21098 76543', status: 'contacted',   priority: 'warm', value: 95000,  nextFollowUp: new Date(Date.now() + 86400000).toISOString(),   lastContact: new Date(Date.now() - 2 * 86400000).toISOString(), source: 'Referral' },
  { id: 9, name: 'Suresh Iyer',    company: 'Google Cloud',     email: 'suresh.i@google.com',     phone: '+91 10987 65432', status: 'qualified',   priority: 'hot',  value: 280000, nextFollowUp: new Date(Date.now() + 43200000).toISOString(),   lastContact: new Date(Date.now() - 86400000).toISOString(),     source: 'LinkedIn' },
  { id: 10, name: 'Meena Gupta',   company: 'Salesforce India', email: 'meena.g@salesforce.com',  phone: '+91 09876 54321', status: 'proposal',    priority: 'warm', value: 155000, nextFollowUp: new Date(Date.now() + 86400000).toISOString(),   lastContact: new Date(Date.now() - 3 * 86400000).toISOString(), source: 'Cold Call'},
  { id: 11, name: 'Rajesh Khanna', company: 'SAP India',        email: 'rajesh.k@sap.com',        phone: '+91 98765 11223', status: 'new',         priority: 'cold', value: 42000,  nextFollowUp: new Date(Date.now() + 432000000).toISOString(),  lastContact: new Date(Date.now() - 7 * 86400000).toISOString(), source: 'Website'  },
  { id: 12, name: 'Ananya Roy',    company: 'IBM India',        email: 'ananya.r@ibm.com',        phone: '+91 87654 22334', status: 'negotiation', priority: 'hot',  value: 320000, nextFollowUp: new Date(Date.now() + 3600000).toISOString(),    lastContact: new Date(Date.now() - 86400000).toISOString(),     source: 'Event'    },
]

const leadSlice = createSlice({
  name: 'leads',
  initialState: {
    list: leads,
    filteredList: leads,
    selectedLead: null,
    filters: { status: '', priority: '', search: '' },
    loading: false,
    error: null,
    stats: {
      total: leads.length,
      newToday: 3,
      qualified: leads.filter(l => l.status === 'qualified').length,
      hot: leads.filter(l => l.priority === 'hot').length,
    },
  },
  reducers: {
    setLeads(state, { payload }) { state.list = payload; state.filteredList = payload },
    addLead(state, { payload }) {
      state.list.unshift(payload)
      state.filteredList.unshift(payload)
      state.stats.total += 1
    },
    updateLead(state, { payload }) {
      const idx = state.list.findIndex(l => l.id === payload.id)
      if (idx !== -1) { state.list[idx] = payload; state.filteredList[idx] = payload }
    },
    updateLeadStatus(state, { payload: { id, status } }) {
      const lead = state.list.find(l => l.id === id)
      if (lead) lead.status = status
      const flead = state.filteredList.find(l => l.id === id)
      if (flead) flead.status = status
    },
    selectLead(state, { payload }) { state.selectedLead = payload },
    setFilter(state, { payload }) {
      state.filters = { ...state.filters, ...payload }
      state.filteredList = state.list.filter(l => {
        const { status, priority, search } = state.filters
        if (status && l.status !== status) return false
        if (priority && l.priority !== priority) return false
        if (search && !l.name.toLowerCase().includes(search.toLowerCase()) &&
            !l.company.toLowerCase().includes(search.toLowerCase())) return false
        return true
      })
    },
    setLoading(state, { payload }) { state.loading = payload },
  },
})

export const { setLeads, addLead, updateLead, updateLeadStatus, selectLead, setFilter, setLoading } = leadSlice.actions
export default leadSlice.reducer
