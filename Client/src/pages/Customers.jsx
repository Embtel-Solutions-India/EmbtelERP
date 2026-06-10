import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { motion } from 'framer-motion'
import { FaUsers, FaCheckCircle, FaUserPlus, FaExclamationTriangle, FaStar } from 'react-icons/fa'
import PageHeader from '../components/common/PageHeader'
import { fetchLeads } from '../redux/slices/leadSlice'
import { getInitials, formatCurrency, formatDate } from '../utils'

const STATUS_COLORS = {
  'CONVERTED': 'badge-success',
  'WON':       'badge-success',
  'Active':    'badge-success',
}

export default function Customers() {
  const dispatch = useDispatch()
  const { list: leads, loading } = useSelector((s) => s.leads)

  useEffect(() => {
    dispatch(fetchLeads())
  }, [dispatch])

  // Filter leads to show only converted clients
  const customers = leads.filter(l => l.status === 'CONVERTED' || String(l.status).toLowerCase() === 'won')

  const stats = [
    { label: 'Total Converted', value: customers.length, Icon: FaUsers, color: 'text-primary-600', bg: 'bg-primary-50 dark:bg-primary-900/20' },
    { label: 'Active Pipeline', value: leads.length, Icon: FaCheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'Hot Leads', value: leads.filter(l => l.priority === 'hot').length, Icon: FaUserPlus, color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-900/20' },
    { label: 'Lost Leads', value: leads.filter(l => l.status === 'LOST').length, Icon: FaExclamationTriangle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
  ]

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      <PageHeader
        title="Customers"
        subtitle="Manage your customer relationships (converted leads)"
        breadcrumbs={['Dashboard', 'Customers']}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className={`card p-4 flex items-center gap-3 ${s.bg}`}>
            <div className={`w-10 h-10 rounded-xl bg-white dark:bg-neutral-800 shadow-sm flex items-center justify-center ${s.color}`}>
              <s.Icon size={18} />
            </div>
            <div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {loading && (
        <div className="text-center py-4 text-sm text-neutral-400">Loading customers...</div>
      )}

      {!loading && customers.length === 0 ? (
        <div className="text-center py-12 card text-neutral-400">No leads have been converted to clients yet.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {customers.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="card p-5 hover:shadow-card-hover cursor-pointer hover:-translate-y-0.5 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                  {getInitials(c.name)}
                </div>
                <span className={STATUS_COLORS[c.status] || 'badge-success'}>Converted</span>
              </div>
              <h3 className="font-bold text-neutral-800 dark:text-neutral-100 mb-0.5">{c.name}</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">{c.company}</p>
              <div className="space-y-1.5 text-xs text-neutral-500 dark:text-neutral-400 mb-3">
                <p className="truncate">{c.email}</p>
                <p>{c.phone}</p>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-700">
                <div>
                  <p className="text-xs text-neutral-400">Client Since</p>
                  <p className="font-bold text-primary-600 dark:text-primary-400 text-[11px] whitespace-nowrap">{c.createdAt ? formatDate(c.createdAt) : '—'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-neutral-400">Deal Value</p>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{formatCurrency(c.estimatedValue ?? c.value ?? 0)}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
