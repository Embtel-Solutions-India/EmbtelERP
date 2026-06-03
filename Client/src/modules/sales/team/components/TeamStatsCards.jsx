import { useSelector } from 'react-redux'
import { People, CheckCircle, School, PersonAdd } from '@mui/icons-material'
import StatCard from '../../../../components/common/StatCard'

export default function TeamStatsCards({ department = 'Sales' }) {
  const list = useSelector((s) => s.team[department.toLowerCase()] || [])

  const total = list.length
  const active = list.filter(m => m.status === 'Active').length
  const interns = list.filter(m => m.designation.toLowerCase().includes('intern')).length
  const newJoinees = list.filter(m => {
    const jDate = new Date(m.joining_date)
    const threshold = new Date()
    threshold.setDate(threshold.getDate() - 180)
    return jDate >= threshold
  }).length

  const stats = [
    {
      title: 'Total Team Members',
      value: total,
      icon: <People style={{ fontSize: 18 }} />,
      color: '#6366f1',
      change: 0,
      changeLabel: 'flat'
    },
    {
      title: 'Active Members',
      value: active,
      icon: <CheckCircle style={{ fontSize: 18 }} />,
      color: '#10b981',
      change: 0,
      changeLabel: 'active status'
    },
    {
      title: 'Interns',
      value: interns,
      icon: <School style={{ fontSize: 18 }} />,
      color: '#f59e0b',
      change: 0,
      changeLabel: 'in training'
    },
    {
      title: 'New Joinees',
      value: newJoinees,
      icon: <PersonAdd style={{ fontSize: 18 }} />,
      color: '#06b6d4',
      change: 0,
      changeLabel: 'last 180 days'
    }
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s, i) => (
        <StatCard key={s.title} {...s} delay={i * 0.05} formatValue={false} />
      ))}
    </div>
  )
}
