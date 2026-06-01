import { motion } from 'framer-motion'
import { FaUsers, FaCheckCircle, FaUserPlus, FaExclamationTriangle, FaStar } from 'react-icons/fa'
import { Add } from '@mui/icons-material'
import PageHeader from '../components/common/PageHeader'
import { getInitials, formatCurrency } from '../utils'

const customers = [
  { id: 1, name: 'Kavita Sharma',  company: 'Oracle India',     email: 'kavita.s@oracle.com',    phone: '+91 43210 98765', value: 450000, status: 'Active',    satisfaction: 5, since: '2023-01-15', deals: 3 },
  { id: 2, name: 'Vikram Nair',    company: 'TCS',              email: 'vikram.n@tcs.com',        phone: '+91 54321 09876', value: 175000, status: 'Active',    satisfaction: 4, since: '2023-05-20', deals: 2 },
  { id: 3, name: 'Ananya Roy',     company: 'IBM India',        email: 'ananya.r@ibm.com',        phone: '+91 87654 22334', value: 320000, status: 'Active',    satisfaction: 5, since: '2022-11-10', deals: 4 },
  { id: 4, name: 'Priya Singh',    company: 'Infosys Ltd',      email: 'priya.s@infosys.com',     phone: '+91 87654 32109', value: 95000,  status: 'New',       satisfaction: 4, since: '2024-02-05', deals: 1 },
  { id: 5, name: 'Suresh Iyer',    company: 'Google Cloud',     email: 'suresh.i@google.com',     phone: '+91 10987 65432', value: 280000, status: 'Returning', satisfaction: 5, since: '2022-08-22', deals: 5 },
  { id: 6, name: 'Meena Gupta',    company: 'Salesforce India', email: 'meena.g@salesforce.com',  phone: '+91 09876 54321', value: 155000, status: 'Active',    satisfaction: 4, since: '2023-09-14', deals: 2 },
  { id: 7, name: 'Deepa Reddy',    company: 'Amazon Web Svc',  email: 'deepa.r@aws.com',         phone: '+91 21098 76543', value: 95000,  status: 'At Risk',   satisfaction: 3, since: '2023-03-30', deals: 1 },
  { id: 8, name: 'Amit Kumar',     company: 'Microsoft India',  email: 'amit.k@microsoft.com',    phone: '+91 32109 87654', value: 65000,  status: 'New',       satisfaction: 4, since: '2024-01-10', deals: 1 },
]

const STATUS_COLORS = {
  'Active':    'badge-success',
  'New':       'badge-primary',
  'Returning': 'badge-info',
  'At Risk':   'badge-error',
}

const STAT_ICONS = [
  { label: 'Total',   value: customers.length,                                Icon: FaUsers,                color: 'text-primary-600', bg: 'bg-primary-50 dark:bg-primary-900/20' },
  { label: 'Active',  value: customers.filter(c => c.status==='Active').length, Icon: FaCheckCircle,          color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  { label: 'New',     value: customers.filter(c => c.status==='New').length,    Icon: FaUserPlus,             color: 'text-cyan-600',    bg: 'bg-cyan-50 dark:bg-cyan-900/20'       },
  { label: 'At Risk', value: customers.filter(c => c.status==='At Risk').length,Icon: FaExclamationTriangle,  color: 'text-red-600',     bg: 'bg-red-50 dark:bg-red-900/20'         },
]

export default function Customers() {
  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      <PageHeader
        title="Customers"
        subtitle="Manage your customer relationships"
        breadcrumbs={['Dashboard', 'Customers']}
        actions={<button className="btn-primary text-sm flex items-center gap-2"><Add fontSize="small" /> Add Customer</button>}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {STAT_ICONS.map((s) => (
          <div key={s.label} className={`card p-4 flex items-center gap-3 ${s.bg}`}>
            <div className={`w-10 h-10 rounded-xl bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center ${s.color}`}>
              <s.Icon size={18} />
            </div>
            <div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {customers.map((c, i) => (
          <motion.div key={c.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="card p-5 hover:shadow-card-hover cursor-pointer hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                {getInitials(c.name)}
              </div>
              <span className={STATUS_COLORS[c.status] || 'badge-primary'}>{c.status}</span>
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-0.5">{c.name}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{c.company}</p>
            <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 mb-3">
              <p className="truncate">{c.email}</p>
              <p>{c.phone}</p>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-gray-700">
              <div>
                <p className="text-xs text-slate-400">Total Value</p>
                <p className="font-bold text-primary-600 dark:text-primary-400 text-sm">{formatCurrency(c.value)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 mb-0.5">Satisfaction</p>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <FaStar key={idx} size={11} className={idx < c.satisfaction ? 'text-amber-400' : 'text-slate-200 dark:text-slate-600'} />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
