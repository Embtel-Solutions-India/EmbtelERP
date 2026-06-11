import WelcomeSection from '../components/dashboard/WelcomeSection'
import ImmigrationReportSummary from '../modules/immigration/widgets/ImmigrationReportSummary'
import ImmigrationBreadcrumb from '../modules/immigration/widgets/ImmigrationBreadcrumb'

export default function HeadReportsPage() {
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <WelcomeSection />
      <ImmigrationBreadcrumb />
      <div>
        <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 mb-1">Reports</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Aggregated performance reports for the immigration division</p>
      </div>
      <ImmigrationReportSummary />
    </div>
  )
}
