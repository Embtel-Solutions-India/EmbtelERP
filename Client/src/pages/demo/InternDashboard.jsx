import { ROLES } from './_data'
import { DemoBanner, DemoKPIGrid, DemoChart, DemoTaskTable, DemoTeamTable } from './_components'

const role = ROLES.intern

export default function InternDashboard() {
  return (
    <div className="max-w-screen-2xl mx-auto">
      <DemoBanner role={role} />
      <DemoKPIGrid kpis={role.kpis} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <DemoChart config={role.chart} />
        <DemoTaskTable tasks={role.tasks} />
      </div>
      <DemoTeamTable metrics={role.teamMetrics} color={role.color} />
    </div>
  )
}
