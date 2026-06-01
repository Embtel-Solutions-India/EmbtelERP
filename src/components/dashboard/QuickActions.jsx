import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { FaUserPlus, FaFileImport, FaPhone, FaCalendarPlus, FaFileInvoice, FaTasks } from 'react-icons/fa'
import SectionCard from '../common/SectionCard'

const ACTIONS = [
  { label: 'Add Lead',         Icon: FaUserPlus,    path: '/leads',        gradient: 'from-violet-500 to-indigo-500' },
  { label: 'Import Leads',     Icon: FaFileImport,  path: '/leads',        gradient: 'from-cyan-500 to-blue-500'    },
  { label: 'Create Follow Up', Icon: FaPhone,       path: '/follow-ups',   gradient: 'from-emerald-500 to-teal-500' },
  { label: 'Schedule Meeting', Icon: FaCalendarPlus,path: '/meetings',     gradient: 'from-orange-500 to-amber-500' },
  { label: 'Send Quotation',   Icon: FaFileInvoice, path: '/opportunities',gradient: 'from-pink-500 to-rose-500'    },
  { label: 'Create Task',      Icon: FaTasks,       path: '/tasks',        gradient: 'from-purple-500 to-violet-500'},
]

export default function QuickActions() {
  const navigate = useNavigate()

  return (
    <SectionCard title="Quick Actions" subtitle="Jump to common CRM tasks" delay={0.3}>
      <div className="grid grid-cols-3 gap-2">
        {ACTIONS.map((action, i) => (
          <motion.button
            key={action.label}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.06 + 0.1 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate(action.path)}
            className={`flex flex-col items-center gap-2 p-3 rounded-xl bg-gradient-to-br ${action.gradient} text-white shadow-sm hover:shadow-md transition-shadow`}
          >
            <action.Icon size={20} />
            <span className="text-xs font-semibold text-center leading-tight">{action.label}</span>
          </motion.button>
        ))}
      </div>
    </SectionCard>
  )
}
