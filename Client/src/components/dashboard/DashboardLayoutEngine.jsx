import React, { Suspense } from 'react'
import { KpiCardsWidget, WidgetSkeleton, WIDGET_REGISTRY } from './WidgetRegistry'

// Renders any widget from the registry inside a Suspense boundary
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

const KNOWN_ROLES = [
  'sales_intern', 'sales_executive', 'sales_head',
  'marketing_intern', 'marketing_executive', 'marketing_manager',
  'documentation_executive', 'documentation_manager',
  'vertical_manager', 'immigration_head', 'evaluation_head',
  'hr_manager', 'business_owner', 'super_admin',
]

export default function DashboardLayoutEngine({ role }) {
  return (
    <div className="w-full flex flex-col gap-6">

      {/* ── Row 1: KPI Cards — always present, full width ─────────────── */}
      <div className="w-full">
        <Suspense fallback={<WidgetSkeleton />}>
          <KpiCardsWidget role={role} />
        </Suspense>
      </div>

      {/* ── Sales Intern ─────────────────────────────────────────────── */}
      {role === 'sales_intern' && <>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <W id="task_summary" role={role} />
          <W id="quick_actions" role={role} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <W id="activities" role={role} />
          <W id="notifications" role={role} />
        </div>
      </>}

      {/* ── Sales Executive ──────────────────────────────────────────── */}
      {role === 'sales_executive' && <>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div className="lg:col-span-2"><W id="performance" role={role} /></div>
          <W id="task_summary" role={role} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          <W id="hot_leads" role={role} />
          <W id="today_followups" role={role} />
          <W id="win_lost" role={role} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div className="lg:col-span-2"><W id="pipeline" role={role} /></div>
          <W id="source_analytics" role={role} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          <W id="activities" role={role} />
          <W id="notifications" role={role} />
          <W id="quick_actions" role={role} />
        </div>
      </>}

      {/* ── Sales Head ───────────────────────────────────────────────── */}
      {role === 'sales_head' && <>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div className="lg:col-span-2"><W id="performance" role={role} /></div>
          <W id="leaderboard" role={role} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          <W id="assignment_queue" role={role} />
          <W id="task_summary" role={role} />
          <W id="notifications" role={role} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div className="lg:col-span-2"><W id="activities" role={role} /></div>
          <W id="quick_actions" role={role} />
        </div>
      </>}

      {/* ── Marketing Intern ─────────────────────────────────────────── */}
      {role === 'marketing_intern' && <>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <W id="task_summary" role={role} />
          <W id="quick_actions" role={role} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <W id="activities" role={role} />
          <W id="notifications" role={role} />
        </div>
      </>}

      {/* ── Marketing Executive ──────────────────────────────────────── */}
      {role === 'marketing_executive' && <>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div className="lg:col-span-2"><W id="performance" role={role} /></div>
          <W id="task_summary" role={role} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          <W id="source_analytics" role={role} />
          <W id="notifications" role={role} />
          <W id="quick_actions" role={role} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div className="lg:col-span-2"><W id="activities" role={role} /></div>
          <W id="upcoming_events" role={role} />
        </div>
      </>}

      {/* ── Marketing Manager ────────────────────────────────────────── */}
      {role === 'marketing_manager' && <>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div className="lg:col-span-2"><W id="performance" role={role} /></div>
          <W id="leaderboard" role={role} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          <W id="source_analytics" role={role} />
          <W id="task_summary" role={role} />
          <W id="notifications" role={role} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div className="lg:col-span-2"><W id="activities" role={role} /></div>
          <W id="quick_actions" role={role} />
        </div>
      </>}

      {/* ── Documentation Executive ──────────────────────────────────── */}
      {role === 'documentation_executive' && <>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div className="lg:col-span-2"><W id="task_summary" role={role} /></div>
          <W id="notifications" role={role} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div className="lg:col-span-2"><W id="activities" role={role} /></div>
          <W id="quick_actions" role={role} />
        </div>
      </>}

      {/* ── Documentation Manager ────────────────────────────────────── */}
      {role === 'documentation_manager' && <>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div className="lg:col-span-2"><W id="performance" role={role} /></div>
          <W id="leaderboard" role={role} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          <W id="task_summary" role={role} />
          <W id="activities" role={role} />
          <W id="notifications" role={role} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div className="lg:col-span-2"><W id="upcoming_events" role={role} /></div>
          <W id="quick_actions" role={role} />
        </div>
      </>}

      {/* ── Vertical Manager ─────────────────────────────────────────── */}
      {role === 'vertical_manager' && <>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div className="lg:col-span-2"><W id="performance" role={role} /></div>
          <W id="dept_health" role={role} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          <W id="leaderboard" role={role} />
          <W id="task_summary" role={role} />
          <W id="notifications" role={role} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div className="lg:col-span-2"><W id="activities" role={role} /></div>
          <W id="quick_actions" role={role} />
        </div>
      </>}

      {/* ── Immigration Head ─────────────────────────────────────────── */}
      {role === 'immigration_head' && <>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div className="lg:col-span-2"><W id="performance" role={role} /></div>
          <W id="leaderboard" role={role} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          <W id="pipeline" role={role} />
          <W id="task_summary" role={role} />
          <W id="notifications" role={role} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div className="lg:col-span-2"><W id="activities" role={role} /></div>
          <W id="quick_actions" role={role} />
        </div>
      </>}

      {/* ── Evaluation Head ──────────────────────────────────────────── */}
      {role === 'evaluation_head' && <>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div className="lg:col-span-2"><W id="performance" role={role} /></div>
          <W id="task_summary" role={role} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          <W id="activities" role={role} />
          <W id="notifications" role={role} />
          <W id="quick_actions" role={role} />
        </div>
      </>}

      {/* ── HR Manager ───────────────────────────────────────────────── */}
      {role === 'hr_manager' && <>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div className="lg:col-span-2"><W id="performance" role={role} /></div>
          <W id="task_summary" role={role} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          <W id="activities" role={role} />
          <W id="notifications" role={role} />
          <W id="quick_actions" role={role} />
        </div>
      </>}

      {/* ── Business Owner ───────────────────────────────────────────── */}
      {role === 'business_owner' && <>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div className="lg:col-span-2"><W id="performance" role={role} /></div>
          <W id="business_health_details" role={role} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          <W id="leaderboard" role={role} />
          <W id="task_summary" role={role} />
          <W id="notifications" role={role} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div className="lg:col-span-2"><W id="activities" role={role} /></div>
          <W id="quick_actions" role={role} />
        </div>
      </>}

      {/* ── Super Admin ──────────────────────────────────────────────── */}
      {role === 'super_admin' && <>
        <W id="system_status" role={role} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div className="lg:col-span-2"><W id="performance" role={role} /></div>
          <W id="notifications" role={role} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div className="lg:col-span-2"><W id="audit_logs" role={role} /></div>
          <W id="quick_actions" role={role} />
        </div>
      </>}

      {/* ── Fallback for any unrecognised role ───────────────────────── */}
      {!KNOWN_ROLES.includes(role) && <>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <W id="performance" role={role} />
          <W id="task_summary" role={role} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <W id="upcoming_events" role={role} />
          <W id="activities" role={role} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <W id="notifications" role={role} />
          <W id="quick_actions" role={role} />
        </div>
      </>}

      {/* ── Calendar — always present, full width ────────────────────── */}
      <W id="calendar" role={role} />

    </div>
  )
}
