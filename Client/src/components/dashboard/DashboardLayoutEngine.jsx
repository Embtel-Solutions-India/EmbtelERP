import React, { Suspense } from 'react'
import { KpiCardsWidget, WidgetSkeleton, WIDGET_REGISTRY } from './WidgetRegistry'

function W({ id, role }) {
  const entry = WIDGET_REGISTRY[id]
  if (!entry) return null
  const Cmp = entry.component
  return (
    <Suspense fallback={<WidgetSkeleton />}>
      <Cmp role={role} />
    </Suspense>
  )
}

// KPI section with heading
function KpiSection({ role }) {
  const labels = {
    sales_intern:           { title: 'My Performance',          sub: 'Your personal KPIs at a glance' },
    sales_executive:        { title: 'Sales KPIs',              sub: 'Your sales performance this month' },
    sales_head:             { title: 'Team Sales KPIs',         sub: 'Team performance & pipeline overview' },
    marketing_intern:       { title: 'My Marketing KPIs',       sub: 'Your campaign task metrics' },
    marketing_executive:    { title: 'Marketing KPIs',          sub: 'Campaign & lead generation metrics' },
    marketing_manager:      { title: 'Team Marketing KPIs',     sub: 'Team campaign performance overview' },
    documentation_executive:{ title: 'Case Management KPIs',   sub: 'Document verification metrics' },
    documentation_manager:  { title: 'Team Documentation KPIs', sub: 'Team case & SLA metrics' },
    vertical_manager:       { title: 'Vertical KPIs',           sub: 'Cross-department performance overview' },
    immigration_head:       { title: 'Immigration KPIs',        sub: 'Revenue, cases & team metrics' },
    evaluation_head:        { title: 'Evaluation KPIs',         sub: 'Evaluation pipeline & SLA metrics' },
    hr_manager:             { title: 'HR KPIs',                 sub: 'Headcount & workforce metrics' },
    business_owner:         { title: 'Business KPIs',           sub: 'Consolidated business performance' },
    super_admin:            { title: 'System Overview',         sub: 'Platform health & usage metrics' },
  }
  const { title = 'Key Performance Indicators', sub = 'Performance overview at a glance' } = labels[role] || {}
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">{title}</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{sub}</p>
        </div>
      </div>
      <Suspense fallback={<WidgetSkeleton />}>
        <KpiCardsWidget role={role} />
      </Suspense>
    </div>
  )
}

const KNOWN_ROLES = [
  'sales_intern', 'sales_executive', 'sales_head',
  'marketing_intern', 'marketing_executive', 'marketing_manager',
  'documentation_executive', 'documentation_manager',
  'vertical_manager', 'immigration_head', 'evaluation_head',
  'hr_manager', 'business_owner', 'super_admin',
]

// Roles that render the calendar inline (skip global calendar for these)
const INLINE_CALENDAR_ROLES = new Set(['sales_executive', 'sales_head', 'immigration_head', 'evaluation_head'])

export default function DashboardLayoutEngine({ role }) {
  return (
    <div className="w-full flex flex-col gap-6">

      {/* ── KPI Cards — always present with heading ─────────────────── */}
      <KpiSection role={role} />

      {/* ── Sales Intern ─────────────────────────────────────────────── */}
      {role === 'sales_intern' && <>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <W id="task_summary" role={role} />
          <W id="quick_actions" role={role} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <W id="activities" role={role} />
          <W id="notifications" role={role} />
        </div>
      </>}

      {/* ── Sales Executive ──────────────────────────────────────────── */}
      {role === 'sales_executive' && <>
        {/* Performance + Task Management */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2"><W id="performance" role={role} /></div>
          <W id="task_summary" role={role} />
        </div>
        {/* Lead Pipeline — full width kanban */}
        <W id="pipeline_board" role={role} />
        {/* Today's Follow Ups — full width table */}
        <W id="follow_ups" role={role} />
        {/* Recent Activities + Upcoming Meetings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <W id="activities" role={role} />
          <W id="meetings" role={role} />
        </div>
        {/* Top Opportunities — full width table */}
        <W id="opportunity_table" role={role} />
        {/* Customer Insights + Calendar + Sales Target */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          <W id="customer_insights" role={role} />
          <W id="calendar" role={role} />
          <W id="sales_target" role={role} />
        </div>
      </>}

      {/* ── Sales Head ───────────────────────────────────────────────── */}
      {role === 'sales_head' && <>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2"><W id="performance" role={role} /></div>
          <W id="leaderboard" role={role} />
        </div>
        <W id="pipeline_board" role={role} />
        <W id="follow_ups" role={role} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <W id="assignment_queue" role={role} />
          <W id="task_summary" role={role} />
          <W id="notifications" role={role} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <W id="activities" role={role} />
          <W id="meetings" role={role} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          <W id="customer_insights" role={role} />
          <W id="calendar" role={role} />
          <W id="sales_target" role={role} />
        </div>
      </>}

      {/* ── Marketing Intern ─────────────────────────────────────────── */}
      {role === 'marketing_intern' && <>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <W id="task_summary" role={role} />
          <W id="quick_actions" role={role} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <W id="activities" role={role} />
          <W id="notifications" role={role} />
        </div>
      </>}

      {/* ── Marketing Executive ──────────────────────────────────────── */}
      {role === 'marketing_executive' && <>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2"><W id="performance" role={role} /></div>
          <W id="task_summary" role={role} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <W id="source_analytics" role={role} />
          <W id="notifications" role={role} />
          <W id="quick_actions" role={role} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <W id="activities" role={role} />
          <W id="upcoming_events" role={role} />
        </div>
      </>}

      {/* ── Marketing Manager ────────────────────────────────────────── */}
      {role === 'marketing_manager' && <>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2"><W id="performance" role={role} /></div>
          <W id="leaderboard" role={role} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <W id="source_analytics" role={role} />
          <W id="task_summary" role={role} />
          <W id="notifications" role={role} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <W id="activities" role={role} />
          <W id="quick_actions" role={role} />
        </div>
      </>}

      {/* ── Documentation Executive ──────────────────────────────────── */}
      {role === 'documentation_executive' && <>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2"><W id="task_summary" role={role} /></div>
          <W id="notifications" role={role} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <W id="activities" role={role} />
          <W id="quick_actions" role={role} />
        </div>
      </>}

      {/* ── Documentation Manager ────────────────────────────────────── */}
      {role === 'documentation_manager' && <>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2"><W id="performance" role={role} /></div>
          <W id="leaderboard" role={role} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <W id="task_summary" role={role} />
          <W id="activities" role={role} />
          <W id="notifications" role={role} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <W id="upcoming_events" role={role} />
          <W id="quick_actions" role={role} />
        </div>
      </>}

      {/* ── Vertical Manager ─────────────────────────────────────────── */}
      {role === 'vertical_manager' && <>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2"><W id="performance" role={role} /></div>
          <W id="dept_health" role={role} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <W id="leaderboard" role={role} />
          <W id="task_summary" role={role} />
          <W id="notifications" role={role} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <W id="activities" role={role} />
          <W id="quick_actions" role={role} />
        </div>
      </>}

      {/* ── Immigration Head ─────────────────────────────────────────── */}
      {role === 'immigration_head' && <>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2"><W id="performance" role={role} /></div>
          <W id="leaderboard" role={role} />
        </div>
        <W id="pipeline_board" role={role} />
        <W id="follow_ups" role={role} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <W id="task_summary" role={role} />
          <W id="activities" role={role} />
          <W id="notifications" role={role} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          <W id="customer_insights" role={role} />
          <W id="calendar" role={role} />
          <W id="sales_target" role={role} />
        </div>
      </>}

      {/* ── Evaluation Head ──────────────────────────────────────────── */}
      {role === 'evaluation_head' && <>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2"><W id="performance" role={role} /></div>
          <W id="task_summary" role={role} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <W id="activities" role={role} />
          <W id="notifications" role={role} />
          <W id="quick_actions" role={role} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          <W id="customer_insights" role={role} />
          <W id="calendar" role={role} />
          <W id="sales_target" role={role} />
        </div>
      </>}

      {/* ── HR Manager ───────────────────────────────────────────────── */}
      {role === 'hr_manager' && <>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2"><W id="performance" role={role} /></div>
          <W id="task_summary" role={role} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <W id="activities" role={role} />
          <W id="notifications" role={role} />
          <W id="quick_actions" role={role} />
        </div>
      </>}

      {/* ── Business Owner ───────────────────────────────────────────── */}
      {role === 'business_owner' && <>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2"><W id="performance" role={role} /></div>
          <W id="business_health_details" role={role} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <W id="leaderboard" role={role} />
          <W id="task_summary" role={role} />
          <W id="notifications" role={role} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <W id="activities" role={role} />
          <W id="quick_actions" role={role} />
        </div>
      </>}

      {/* ── Super Admin ──────────────────────────────────────────────── */}
      {role === 'super_admin' && <>
        <W id="system_status" role={role} />
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2"><W id="performance" role={role} /></div>
          <W id="notifications" role={role} />
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2"><W id="audit_logs" role={role} /></div>
          <W id="quick_actions" role={role} />
        </div>
      </>}

      {/* ── Fallback ─────────────────────────────────────────────────── */}
      {!KNOWN_ROLES.includes(role) && <>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <W id="performance" role={role} />
          <W id="task_summary" role={role} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <W id="upcoming_events" role={role} />
          <W id="activities" role={role} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <W id="notifications" role={role} />
          <W id="quick_actions" role={role} />
        </div>
      </>}

      {/* ── Calendar — global, skipped for roles that embed it inline ── */}
      {!INLINE_CALENDAR_ROLES.has(role) && (
        <W id="calendar" role={role} />
      )}

    </div>
  )
}
