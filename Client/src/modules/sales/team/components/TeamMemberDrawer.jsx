import { motion, AnimatePresence } from 'framer-motion'
import { Close, AccountCircle, ContactPhone, Work, BarChart, History } from '@mui/icons-material'

const SALES_KPIS = [
  { label: 'Leads Handled', value: '148', color: 'text-indigo-600 dark:text-indigo-400' },
  { label: 'Won Deals',     value: '36',  color: 'text-emerald-600 dark:text-emerald-400' },
  { label: 'Conversion',    value: '24.3%', color: 'text-purple-600 dark:text-purple-400' },
  { label: 'Pipeline Val',  value: '$120K', color: 'text-amber-600 dark:text-amber-400' },
]

const MARKETING_KPIS = [
  { label: 'Campaigns Run',  value: '12',   color: 'text-indigo-600 dark:text-indigo-400' },
  { label: 'Leads Gen',      value: '580',  color: 'text-emerald-600 dark:text-emerald-400' },
  { label: 'Avg CPL',        value: '$12.50', color: 'text-rose-600 dark:text-rose-400' },
  { label: 'Campaign ROI',   value: '3.4x', color: 'text-amber-600 dark:text-amber-400' },
]

const SALES_ACTIVITIES = [
  'Contacted Rohan Kapoor from Wipro Systems',
  'Scheduled discovery meeting with Tech Mahindra',
  'Updated deal status for Oracleproposal to proposal',
  'Logged follow up call with Tata Consultancy',
]

const MARKETING_ACTIVITIES = [
  'Optimized Google Ads PPC budget target',
  'Created draft template for Q2 newsletter blast',
  'Uploaded Banner Creative v2 to asset manager',
  'Published DBaaS integration tech SEO blog post',
]

export default function TeamMemberDrawer({ open, member, onClose }) {
  if (!member) return null

  const isSales = member.department.toLowerCase() === 'sales'
  const kpis = isSales ? SALES_KPIS : MARKETING_KPIS
  const activities = isSales ? SALES_ACTIVITIES : MARKETING_ACTIVITIES

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay background */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-neutral-950/40 backdrop-blur-sm"
          />

          {/* Drawer container */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white dark:bg-neutral-900 border-l border-neutral-100 dark:border-neutral-800 shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
              <span className="font-bold text-neutral-800 dark:text-neutral-100">Team Member Profile</span>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 transition-colors"
              >
                <Close fontSize="small" />
              </button>
            </div>

            {/* Content body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Profile Card Header */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100/50 dark:border-neutral-800">
                <img
                  src={member.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e'}
                  alt={member.full_name}
                  className="w-16 h-16 rounded-2xl object-cover flex-shrink-0 border-2 border-white dark:border-neutral-800 shadow-md"
                />
                <div>
                  <h3 className="text-base font-bold text-neutral-800 dark:text-neutral-100">{member.full_name}</h3>
                  <p className="text-xs text-neutral-400 dark:text-neutral-500 font-semibold uppercase tracking-wider mt-0.5">{member.designation}</p>
                  <span className="badge badge-primary text-[10px] mt-1.5">{member.employee_id}</span>
                </div>
              </div>

              {/* Personal Information */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                  <AccountCircle style={{ fontSize: 16 }} /> Personal Details
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs p-3.5 rounded-xl border border-neutral-100 dark:border-neutral-800/50">
                  <div>
                    <p className="text-neutral-400">Joining Date</p>
                    <p className="font-semibold text-neutral-700 dark:text-neutral-300 mt-0.5">{member.joining_date}</p>
                  </div>
                  <div>
                    <p className="text-neutral-400">Status</p>
                    <p className="font-semibold text-neutral-700 dark:text-neutral-300 mt-0.5">{member.status}</p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                  <ContactPhone style={{ fontSize: 16 }} /> Contact Details
                </h4>
                <div className="space-y-2.5 p-3.5 rounded-xl border border-neutral-100 dark:border-neutral-800/50 text-xs">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Email Address</span>
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">{member.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Phone Number</span>
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">{member.phone}</span>
                  </div>
                </div>
              </div>

              {/* Role Information */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Work style={{ fontSize: 16 }} /> Department Role
                </h4>
                <div className="space-y-2.5 p-3.5 rounded-xl border border-neutral-100 dark:border-neutral-800/50 text-xs">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Department</span>
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">{member.department}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Reporting Manager</span>
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">{member.reporting_manager || 'None'}</span>
                  </div>
                </div>
              </div>

              {/* KPI Summary */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                  <BarChart style={{ fontSize: 16 }} /> Performance Statistics
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {kpis.map((kpi) => (
                    <div key={kpi.label} className="p-3 rounded-xl border border-neutral-100 dark:border-neutral-800/50 text-center">
                      <p className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase">{kpi.label}</p>
                      <p className={`text-base font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activities */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                  <History style={{ fontSize: 16 }} /> Recent Activities
                </h4>
                <div className="space-y-2 p-3.5 rounded-xl border border-neutral-100 dark:border-neutral-800/50 text-xs">
                  {activities.map((act, idx) => (
                    <div key={idx} className="flex gap-2.5 items-start">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0 mt-1.5" />
                      <span className="text-neutral-600 dark:text-neutral-400 leading-relaxed">{act}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
