import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { motion } from 'framer-motion'
import { Edit, Phone, Email, Business, CalendarToday } from '@mui/icons-material'
import { FaUsers, FaTrophy, FaDollarSign, FaBullseye } from 'react-icons/fa'
import PageHeader from '../components/common/PageHeader'
import ActionFormModal from '../components/common/ActionFormModal'
import { updateProfile } from '../redux/slices/authSlice'
import { formatDate, formatCurrency, getInitials } from '../utils'
import TargetProgress from '../components/dashboard/TargetProgress'

export default function Profile() {
  const dispatch = useDispatch()
  const { user } = useSelector((s) => s.auth)
  const { kpiStats } = useSelector((s) => s.dashboard)
  const [isProfileFormOpen, setProfileFormOpen] = useState(false)

  const stats = [
    { label: 'Total Leads', value: kpiStats.totalLeads,                        Icon: FaUsers,      color: 'text-primary-600' },
    { label: 'Won Deals',   value: kpiStats.wonDeals,                          Icon: FaTrophy,     color: 'text-emerald-600' },
    { label: 'Revenue',     value: formatCurrency(kpiStats.monthlyRevenue),     Icon: FaDollarSign, color: 'text-amber-600'   },
    { label: 'Achievement', value: `${kpiStats.targetAchievement}%`,            Icon: FaBullseye,   color: 'text-purple-600'  },
  ]
  const handleUpdateProfile = (values) => {
    dispatch(updateProfile({
      ...values,
      target: Number(values.target) || user?.target,
    }))
  }

  return (
    <div className="space-y-6 max-w-[900px] mx-auto">
      <PageHeader title="My Profile" subtitle="Your sales executive profile" breadcrumbs={['Dashboard', 'Profile']} />

      <ActionFormModal
        open={isProfileFormOpen}
        title="Edit Profile"
        subtitle="Update the details shown across your CRM workspace"
        fields={[
          { name: 'name', label: 'Full Name', required: true },
          { name: 'role', label: 'Role', required: true },
          { name: 'email', label: 'Email', type: 'email', required: true },
          { name: 'phone', label: 'Phone', type: 'tel', required: true },
          { name: 'department', label: 'Department', required: true },
          { name: 'team', label: 'Team', required: true },
          { name: 'target', label: 'Monthly Target', type: 'number', min: 0, required: true },
          { name: 'joinDate', label: 'Join Date', type: 'date', required: true },
        ]}
        initialValues={{
          name: user?.name || '',
          role: user?.role || '',
          email: user?.email || '',
          phone: user?.phone || '',
          department: user?.department || '',
          team: user?.team || '',
          target: user?.target || '',
          joinDate: user?.joinDate || '',
        }}
        submitLabel="Update Profile"
        onClose={() => setProfileFormOpen(false)}
        onSubmit={handleUpdateProfile}
      />

      {/* Profile Card */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="relative flex-shrink-0">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-bold text-4xl shadow-brand">
              {getInitials(user?.name)}
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white dark:border-gray-800" />
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{user?.name}</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">{user?.role}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="badge badge-primary">{user?.department}</span>
                  <span className="badge badge-info">{user?.team}</span>
                </div>
              </div>
              <button onClick={() => setProfileFormOpen(true)} className="btn-secondary flex items-center gap-2 text-sm">
                <Edit fontSize="small" /> Edit Profile
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
              {[
                { icon: <Email fontSize="small" />, label: user?.email },
                { icon: <Phone fontSize="small" />, label: user?.phone },
                { icon: <Business fontSize="small" />, label: user?.department },
                { icon: <CalendarToday fontSize="small" />, label: `Joined ${formatDate(user?.joinDate)}` },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <span className="text-slate-400 dark:text-slate-500">{item.icon}</span>
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Performance Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="card p-4 text-center">
            <div className={`flex justify-center mb-2 ${s.color}`}><s.Icon size={22} /></div>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Target Progress */}
      <TargetProgress />
    </div>
  )
}
