import { motion } from 'framer-motion'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  Add, VideoCall, Phone, RequestQuote, Edit, Assignment, CheckCircle,
  CloudUpload, Campaign, Email, Search, People, BarChart, PersonAdd,
  FileDownload, Security, CalendarMonth, ManageAccounts,
} from '@mui/icons-material'
import { format } from 'date-fns'
import { getGreeting, formatCurrency } from '../../utils'
import { MOTIVATIONAL_QUOTES } from '../../constants'

const quote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]

const ROLE_ACTIONS = {
  sales_intern: [
    { label: 'Update Lead',   icon: <Edit fontSize="small" />,        path: '/sales/leads'      },
    { label: 'Log Call',      icon: <Phone fontSize="small" />,       path: '/sales/activities' },
    { label: 'My Tasks',      icon: <CheckCircle fontSize="small" />, path: '/sales/tasks'      },
  ],
  sales_executive: [
    { label: 'Add Lead',         icon: <Add fontSize="small" />,          path: '/sales/leads'         },
    { label: 'Schedule Meeting', icon: <VideoCall fontSize="small" />,    path: '/sales/meetings'      },
    { label: 'Create Follow Up', icon: <Phone fontSize="small" />,        path: '/sales/follow-ups'    },
    { label: 'Generate Quote',   icon: <RequestQuote fontSize="small" />, path: '/sales/opportunities' },
  ],
  sales_head: [
    { label: 'Assign Lead',   icon: <Assignment fontSize="small" />,  path: '/sales/leads'   },
    { label: 'Team Review',   icon: <People fontSize="small" />,      path: '/sales/team'    },
    { label: 'Export Report', icon: <FileDownload fontSize="small" />, path: '/sales/reports' },
  ],
  marketing_intern: [
    { label: 'Upload Content', icon: <CloudUpload fontSize="small" />, path: '/marketing/assets'    },
    { label: 'My Tasks',       icon: <CheckCircle fontSize="small" />, path: '/marketing/tasks'     },
    { label: 'View Campaigns', icon: <Campaign fontSize="small" />,    path: '/marketing/campaigns' },
  ],
  marketing_executive: [
    { label: 'Create Campaign', icon: <Campaign fontSize="small" />,    path: '/marketing/campaigns'       },
    { label: 'Schedule Email',  icon: <Email fontSize="small" />,       path: '/marketing/email-marketing' },
    { label: 'Upload Creative', icon: <CloudUpload fontSize="small" />, path: '/marketing/assets'          },
  ],
  marketing_manager: [
    { label: 'Approve Campaign', icon: <CheckCircle fontSize="small" />, path: '/marketing/approvals' },
    { label: 'Assign Campaign',  icon: <Campaign fontSize="small" />,    path: '/marketing/campaigns' },
    { label: 'Team Overview',    icon: <People fontSize="small" />,      path: '/marketing/team'      },
  ],
  documentation_executive: [
    { label: 'Verify Document', icon: <CheckCircle fontSize="small" />, path: '/production/verification' },
    { label: 'View Cases',      icon: <Assignment fontSize="small" />,  path: '/production/cases'        },
    { label: 'My Tasks',        icon: <Edit fontSize="small" />,        path: '/production/tasks'        },
  ],
  documentation_manager: [
    { label: 'Assign Case',   icon: <Assignment fontSize="small" />, path: '/production/cases'        },
    { label: 'QC Review',     icon: <Search fontSize="small" />,     path: '/production/verification' },
    { label: 'Team Overview', icon: <People fontSize="small" />,     path: '/production/team'         },
  ],
  vertical_manager: [
    { label: 'Review Team',      icon: <People fontSize="small" />,       path: '/owner/employees' },
    { label: 'Approve Requests', icon: <CheckCircle fontSize="small" />,  path: '/owner/approvals' },
    { label: 'Analytics',        icon: <BarChart fontSize="small" />,     path: '/owner/analytics' },
  ],
  immigration_head: [
    { label: 'View Analytics', icon: <BarChart fontSize="small" />,     path: '/owner/analytics'  },
    { label: 'Approve Items',  icon: <CheckCircle fontSize="small" />,  path: '/owner/approvals'  },
    { label: 'Team Overview',  icon: <People fontSize="small" />,       path: '/owner/employees'  },
    { label: 'Export Report',  icon: <FileDownload fontSize="small" />, path: '/owner/reports'    },
  ],
  evaluation_head: [
    { label: 'Assign Eval',   icon: <Assignment fontSize="small" />, path: '/evaluation/dashboard' },
    { label: 'Performance',   icon: <BarChart fontSize="small" />,   path: '/evaluation/dashboard' },
    { label: 'Team Overview', icon: <People fontSize="small" />,     path: '/evaluation/team'      },
  ],
  hr_manager: [
    { label: 'Add Employee', icon: <PersonAdd fontSize="small" />,    path: '/hr/employees'    },
    { label: 'Interviews',   icon: <CalendarMonth fontSize="small" />, path: '/hr/recruitment' },
    { label: 'Performance',  icon: <BarChart fontSize="small" />,     path: '/hr/performance'  },
  ],
  business_owner: [
    { label: 'View Analytics', icon: <BarChart fontSize="small" />,     path: '/owner/analytics' },
    { label: 'Team Overview',  icon: <People fontSize="small" />,       path: '/owner/employees' },
    { label: 'Export Report',  icon: <FileDownload fontSize="small" />, path: '/owner/reports'   },
  ],
  super_admin: [
    { label: 'Manage Users', icon: <People fontSize="small" />,         path: '/admin/users'        },
    { label: 'Roles',        icon: <Security fontSize="small" />,       path: '/admin/roles'        },
    { label: 'Audit Logs',   icon: <Assignment fontSize="small" />,     path: '/admin/audit'        },
    { label: 'Org Explorer', icon: <ManageAccounts fontSize="small" />, path: '/admin/org-explorer' },
  ],
}

const TARGET_LABELS = {
  sales_intern: 'My Task Target',
  sales_executive: 'Monthly Sales Target',
  sales_head: 'Team Revenue Target',
  marketing_intern: 'Content Target',
  marketing_executive: 'Campaign Target',
  marketing_manager: 'Team Campaign Target',
  documentation_executive: 'Case Completion',
  documentation_manager: 'Team Case Target',
  vertical_manager: 'Vertical KPI',
  immigration_head: 'Business KPI Target',
  evaluation_head: 'Evaluation Target',
  hr_manager: 'HR Performance',
  business_owner: 'Business KPI Target',
  super_admin: 'System Uptime',
}

function detectRole(user) {
  const d = (user?.designation || '').toLowerCase()
  const level = Number(user?.employeeLevel ?? user?.roleLevel ?? 1)
  if (level >= 5 || d.includes('super admin')) return 'super_admin'
  if (level >= 4 || d.includes('business owner')) return 'business_owner'
  if (d.includes('immigration')) return 'immigration_head'
  if (d.includes('evaluation') && (d.includes('head') || level >= 3)) return 'evaluation_head'
  if (d.includes('hr') || d.includes('human resource')) return 'hr_manager'
  if (d.includes('documentation') || d.includes('production')) {
    return level >= 2 ? 'documentation_manager' : 'documentation_executive'
  }
  if (d.includes('vertical manager') || (level >= 3)) return 'vertical_manager'
  if (d.includes('sales') && (d.includes('head') || d.includes('manager') || level >= 2)) return 'sales_head'
  if (d.includes('marketing') && (d.includes('manager') || level >= 2)) return 'marketing_manager'
  if (d.includes('marketing') && level <= 0) return 'marketing_intern'
  if (d.includes('marketing')) return 'marketing_executive'
  if (d.includes('sales') && level <= 0) return 'sales_intern'
  if (level <= 0) return 'sales_intern'
  return 'sales_executive'
}

export default function WelcomeSection() {
  const navigate = useNavigate()
  const { user } = useSelector((s) => s.auth)
  const { overview } = useSelector((s) => s.dashboard || {})

  const role = detectRole(user)
  const actions = ROLE_ACTIONS[role] ?? ROLE_ACTIONS.sales_executive
  const targetLabel = TARGET_LABELS[role] ?? 'Monthly Target'
  const firstName = user?.name?.split(' ')[0] || user?.designation || 'Welcome'

  const achievement =
    overview?.businessKpis?.targetAchievement ??
    overview?.teamKpis?.targetAchievement ??
    overview?.employeeKpis?.performanceScore ??
    (overview?.taskCount > 0 ? Math.round((overview.taskCompleted / overview.taskCount) * 100) : 0)

  const pct = Math.min(Math.max(Number(achievement) || 0, 0), 100)
  const taskDone = overview?.taskCompleted ?? 0
  const taskTotal = overview?.taskCount ?? 0
  const isCurrencyRole = ['sales_executive', 'sales_head', 'immigration_head', 'business_owner'].includes(role)
  const bizRevenue = overview?.businessKpis?.monthlyRevenue ?? 0
  const bizTarget = overview?.businessKpis?.monthlyTarget ?? 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-500 via-indigo-500 to-purple-500 p-6 md:p-8 text-white shadow-brand"
    >
      <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-white/5" />
      <div className="absolute top-8 right-32 w-24 h-24 rounded-full bg-white/5" />

      <div className="relative flex flex-col md:flex-row md:items-center gap-6">
        <div className="flex-1 min-w-0">
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-white/70 text-sm font-medium mb-1"
          >
            {format(new Date(), 'EEEE, MMMM d, yyyy')} · {getGreeting()},{' '}
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="text-3xl md:text-4xl font-bold mb-1"
          >
            {firstName}!
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white/60 text-sm italic max-w-xl line-clamp-2 mb-5"
          >
            {quote}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-2"
          >
            {actions.map((a) => (
              <motion.button
                key={a.label}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(a.path)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur text-sm font-semibold transition-all duration-200 border border-white/20"
              >
                {a.icon}
                {a.label}
              </motion.button>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35 }}
          className="flex-shrink-0 bg-white/10 backdrop-blur rounded-2xl p-5 border border-white/20 min-w-[200px]"
        >
          <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-3">
            {targetLabel}
          </p>
          <p className="text-2xl font-bold mb-1">{pct}%</p>
          <p className="text-white/60 text-xs mb-3">
            {isCurrencyRole
              ? `${formatCurrency(bizRevenue)} of ${formatCurrency(bizTarget)}`
              : `${taskDone} of ${taskTotal} tasks`}
          </p>
          <div className="w-full bg-white/20 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1.2, delay: 0.6, ease: 'easeOut' }}
              className="h-2 bg-white rounded-full"
            />
          </div>
          <p className="text-white/50 text-xs mt-2">
            {isCurrencyRole
              ? `${formatCurrency(Math.max(0, bizTarget - bizRevenue))} remaining`
              : `${Math.max(0, 100 - pct)}% to go`}
          </p>
        </motion.div>
      </div>
    </motion.div>
  )
}
