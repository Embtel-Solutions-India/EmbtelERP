import { useMemo } from 'react'
import { useSelector } from 'react-redux'

const sameMonth = (d, now) => {
  if (!d) return false
  const x = new Date(d)
  return x.getFullYear() === now.getFullYear() && x.getMonth() === now.getMonth()
}
const isToday = (d) => {
  if (!d) return false
  const x = new Date(d), n = new Date()
  return x.getFullYear() === n.getFullYear() && x.getMonth() === n.getMonth() && x.getDate() === n.getDate()
}
const isActive = (t) => !['completed', 'cancelled', 'done'].includes(String(t.status || '').toLowerCase())

/**
 * Derives the Sales Executive dashboard KPIs from real, already-scoped data:
 *  - leads: listSalesLeads returns only the executive's own leads (RBAC-scoped server-side)
 *  - tasks: filtered here to those assigned to the current executive
 */
export function useSalesExecKpis() {
  const { list: leads, loading: leadsLoading } = useSelector((s) => s.leads)
  const { list: tasks, loading: tasksLoading } = useSelector((s) => s.tasks)
  const user = useSelector((s) => s.auth.user)
  const myId = user?.id

  return useMemo(() => {
    const now = new Date()
    const myTasks = tasks.filter((t) => (t.assigneeId ?? t.assignee?.id) === myId)
    const converted = leads.filter((l) => ['WON', 'CONVERTED'].includes(l.status))
    const monthlyRevenue = converted
      .filter((l) => sameMonth(l.convertedAt ?? l.updatedAt, now))
      .reduce((sum, l) => sum + Number(l.estimatedValue ?? 0), 0)

    return {
      loading: (leadsLoading || tasksLoading) && leads.length === 0 && tasks.length === 0,
      totalLeads:             leads.length,
      newLeads:               leads.filter((l) => l.status === 'NEW').length,
      hotLeads:               leads.filter((l) => String(l.priority).toLowerCase() === 'hot').length,
      todaysFollowUps:        myTasks.filter((t) => isActive(t) && (isToday(t.dueDate) || isToday(t.nextFollowUpDate))).length,
      pendingTasks:           myTasks.filter(isActive).length,
      consultationsScheduled: leads.filter((l) => l.status === 'CONSULTATION_SCHEDULED').length,
      convertedClients:       converted.length,
      monthlyRevenue,
    }
  }, [leads, tasks, myId, leadsLoading, tasksLoading])
}
