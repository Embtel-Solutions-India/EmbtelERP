import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  FaUserPlus, FaPhone, FaCalendarPlus, FaTasks, FaEdit, FaCheckCircle,
  FaUpload, FaEnvelope, FaBullhorn, FaUsers, FaFlag, FaSearch,
  FaFileAlt, FaUserCheck, FaChartBar, FaShieldAlt, FaClipboardList,
  FaFileExport, FaBuilding,
} from 'react-icons/fa'
import SectionCard from '../common/SectionCard'

const ROLE_ACTIONS = {
  sales_intern: [
    { label: 'Update Lead',   Icon: FaEdit,        path: '/sales/leads',      gradient: 'from-violet-500 to-indigo-500' },
    { label: 'Log Call',      Icon: FaPhone,       path: '/sales/activities', gradient: 'from-emerald-500 to-teal-500'  },
    { label: 'Complete Task', Icon: FaCheckCircle, path: '/sales/tasks',      gradient: 'from-orange-500 to-amber-500'  },
  ],
  sales_executive: [
    { label: 'Add Lead',         Icon: FaUserPlus,    path: '/sales/leads',       gradient: 'from-violet-500 to-indigo-500' },
    { label: 'Log Call',         Icon: FaPhone,       path: '/sales/activities',  gradient: 'from-emerald-500 to-teal-500'  },
    { label: 'Schedule Meeting', Icon: FaCalendarPlus,path: '/sales/meetings',    gradient: 'from-orange-500 to-amber-500'  },
    { label: 'Create Follow Up', Icon: FaTasks,       path: '/sales/follow-ups',  gradient: 'from-purple-500 to-violet-500' },
  ],
  sales_head: [
    { label: 'Assign Lead',   Icon: FaUserPlus,   path: '/sales/leads',       gradient: 'from-violet-500 to-indigo-500' },
    { label: 'Create Target', Icon: FaFlag,       path: '/sales/performance', gradient: 'from-emerald-500 to-teal-500'  },
    { label: 'Export Report', Icon: FaFileExport, path: '/sales/reports',     gradient: 'from-orange-500 to-amber-500'  },
    { label: 'Team Review',   Icon: FaUsers,      path: '/sales/team',        gradient: 'from-purple-500 to-violet-500' },
  ],
  marketing_intern: [
    { label: 'Upload Content',       Icon: FaUpload, path: '/marketing/assets', gradient: 'from-violet-500 to-indigo-500' },
    { label: 'Update Campaign Task', Icon: FaEdit,   path: '/marketing/tasks',  gradient: 'from-emerald-500 to-teal-500'  },
  ],
  marketing_executive: [
    { label: 'Create Campaign',  Icon: FaBullhorn,    path: '/marketing/campaigns',       gradient: 'from-violet-500 to-indigo-500' },
    { label: 'Schedule Email',   Icon: FaEnvelope,    path: '/marketing/email-marketing', gradient: 'from-emerald-500 to-teal-500'  },
    { label: 'Upload Creative',  Icon: FaUpload,      path: '/marketing/assets',          gradient: 'from-orange-500 to-amber-500'  },
    { label: 'Create Task',      Icon: FaTasks,       path: '/marketing/tasks',           gradient: 'from-purple-500 to-violet-500' },
  ],
  marketing_manager: [
    { label: 'Approve Campaign', Icon: FaCheckCircle, path: '/marketing/approvals',  gradient: 'from-violet-500 to-indigo-500' },
    { label: 'Assign Campaign',  Icon: FaBullhorn,    path: '/marketing/campaigns',  gradient: 'from-emerald-500 to-teal-500'  },
    { label: 'Allocate Budget',  Icon: FaChartBar,    path: '/marketing/reports',    gradient: 'from-orange-500 to-amber-500'  },
  ],
  documentation_executive: [
    { label: 'Verify Document',   Icon: FaCheckCircle, path: '/production/verification', gradient: 'from-violet-500 to-indigo-500' },
    { label: 'Request Document',  Icon: FaFileAlt,     path: '/production/documents',   gradient: 'from-emerald-500 to-teal-500'  },
    { label: 'Update Case',       Icon: FaEdit,        path: '/production/cases',        gradient: 'from-orange-500 to-amber-500'  },
  ],
  documentation_manager: [
    { label: 'Assign Case',          Icon: FaUserCheck,   path: '/production/cases',        gradient: 'from-violet-500 to-indigo-500' },
    { label: 'Approve Verification', Icon: FaCheckCircle, path: '/production/approvals',    gradient: 'from-emerald-500 to-teal-500'  },
    { label: 'QC Review',            Icon: FaSearch,      path: '/production/verification', gradient: 'from-orange-500 to-amber-500'  },
  ],
  vertical_manager: [
    { label: 'Review Team',      Icon: FaUsers,       path: '/owner/employees', gradient: 'from-violet-500 to-indigo-500' },
    { label: 'Approve Requests', Icon: FaCheckCircle, path: '/owner/approvals', gradient: 'from-emerald-500 to-teal-500'  },
    { label: 'Export Reports',   Icon: FaFileExport,  path: '/owner/reports',   gradient: 'from-orange-500 to-amber-500'  },
  ],
  immigration_head: [
    { label: 'Review Vertical',    Icon: FaChartBar,    path: '/owner/analytics', gradient: 'from-violet-500 to-indigo-500' },
    { label: 'Approve Promotions', Icon: FaUserCheck,   path: '/owner/approvals', gradient: 'from-emerald-500 to-teal-500'  },
    { label: 'Generate Reports',   Icon: FaFileExport,  path: '/owner/reports',   gradient: 'from-orange-500 to-amber-500'  },
  ],
  evaluation_head: [
    { label: 'Assign Evaluation',  Icon: FaClipboardList, path: '/evaluation/dashboard', gradient: 'from-violet-500 to-indigo-500' },
    { label: 'Review Performance', Icon: FaChartBar,      path: '/evaluation/dashboard', gradient: 'from-emerald-500 to-teal-500'  },
  ],
  hr_manager: [
    { label: 'Add Employee',       Icon: FaUserPlus,    path: '/hr/employees',   gradient: 'from-violet-500 to-indigo-500' },
    { label: 'Schedule Interview', Icon: FaCalendarPlus,path: '/hr/recruitment', gradient: 'from-emerald-500 to-teal-500'  },
    { label: 'Start Review',       Icon: FaChartBar,    path: '/hr/performance', gradient: 'from-orange-500 to-amber-500'  },
  ],
  business_owner: [
    { label: 'View Analytics',     Icon: FaChartBar,   path: '/owner/analytics', gradient: 'from-violet-500 to-indigo-500' },
    { label: 'Review Performance', Icon: FaUsers,      path: '/owner/employees', gradient: 'from-emerald-500 to-teal-500'  },
    { label: 'Export Reports',     Icon: FaFileExport, path: '/owner/reports',   gradient: 'from-orange-500 to-amber-500'  },
  ],
  super_admin: [
    { label: 'Manage Orgs',    Icon: FaBuilding,      path: '/admin/users',    gradient: 'from-violet-500 to-indigo-500' },
    { label: 'Manage Roles',   Icon: FaShieldAlt,     path: '/admin/roles',    gradient: 'from-emerald-500 to-teal-500'  },
    { label: 'Permissions',    Icon: FaCheckCircle,   path: '/admin/roles',    gradient: 'from-orange-500 to-amber-500'  },
    { label: 'Audit Logs',     Icon: FaClipboardList, path: '/admin/audit',    gradient: 'from-purple-500 to-violet-500' },
  ],
}

const DEFAULT_ACTIONS = [
  { label: 'Add Lead',         Icon: FaUserPlus,    path: '/sales/leads',       gradient: 'from-violet-500 to-indigo-500' },
  { label: 'Create Follow Up', Icon: FaPhone,       path: '/sales/follow-ups',  gradient: 'from-emerald-500 to-teal-500'  },
  { label: 'Schedule Meeting', Icon: FaCalendarPlus,path: '/sales/meetings',    gradient: 'from-orange-500 to-amber-500'  },
  { label: 'Create Task',      Icon: FaTasks,       path: '/sales/tasks',       gradient: 'from-purple-500 to-violet-500' },
]

export default function QuickActions({ actions, role }) {
  const navigate = useNavigate()
  const resolvedActions = actions || (role ? ROLE_ACTIONS[role] : null) || DEFAULT_ACTIONS

  return (
    <SectionCard title="Quick Actions" subtitle="Jump to common CRM tasks" delay={0.3}>
      <div className="grid grid-cols-2 gap-2">
        {resolvedActions.map((action, i) => (
          <motion.button
            key={action.label}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.06 + 0.1 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => action.onClick ? action.onClick() : navigate(action.path)}
            className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-gradient-to-br ${action.gradient || 'from-primary-500 to-indigo-500'} text-white shadow-sm hover:shadow-md transition-shadow`}
          >
            {action.Icon && <action.Icon size={18} />}
            <span className="text-[11px] font-semibold text-center leading-tight">{action.label}</span>
          </motion.button>
        ))}
      </div>
    </SectionCard>
  )
}
