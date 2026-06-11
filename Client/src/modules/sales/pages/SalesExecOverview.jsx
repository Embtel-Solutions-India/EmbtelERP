import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import {
  FaUsers, FaUserPlus, FaFire, FaCalendarDay,
  FaTasks, FaCalendarCheck, FaUserCheck, FaDollarSign,
} from 'react-icons/fa'
import WelcomeSection from '../../../components/dashboard/WelcomeSection'
import StatCard from '../../../components/common/StatCard'
import { fetchLeads } from '../../../redux/slices/leadSlice'
import { fetchTasks } from '../../../redux/slices/taskSlice'
import { useSalesExecKpis } from '../hooks/useSalesExecKpis'

export default function SalesExecOverview() {
  const dispatch = useDispatch()
  const kpi = useSalesExecKpis()

  useEffect(() => {
    dispatch(fetchLeads())
    dispatch(fetchTasks())
  }, [dispatch])

  if (kpi.loading) {
    return (
      <div className="space-y-6 max-w-[1600px] mx-auto">
        <WelcomeSection />
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const cards = [
    { title: 'Total Leads',            value: kpi.totalLeads,             icon: <FaUsers />,         color: '#4F46E5', formatValue: false },
    { title: 'New Leads',              value: kpi.newLeads,               icon: <FaUserPlus />,      color: '#0284C7', formatValue: false },
    { title: 'Hot Leads',              value: kpi.hotLeads,               icon: <FaFire />,          color: '#DC2626', formatValue: false },
    { title: "Today's Follow-ups",     value: kpi.todaysFollowUps,        icon: <FaCalendarDay />,   color: '#F59E0B', formatValue: false },
    { title: 'Pending Tasks',          value: kpi.pendingTasks,           icon: <FaTasks />,         color: '#7C3AED', formatValue: false },
    { title: 'Consultations Scheduled', value: kpi.consultationsScheduled, icon: <FaCalendarCheck />, color: '#0891B2', formatValue: false },
    { title: 'Converted Clients',      value: kpi.convertedClients,       icon: <FaUserCheck />,     color: '#16A34A', formatValue: false },
    { title: 'Monthly Revenue',        value: kpi.monthlyRevenue,         icon: <FaDollarSign />,    color: '#D97706', prefix: '$', formatValue: true },
  ]

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <WelcomeSection />
      <div>
        <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 mb-1">My Sales Overview</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Your leads, follow-ups and conversions at a glance</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <StatCard key={c.title} delay={i * 0.04} {...c} />
        ))}
      </div>
    </div>
  )
}
