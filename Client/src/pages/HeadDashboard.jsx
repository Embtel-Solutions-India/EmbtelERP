import WelcomeSection from '../components/dashboard/WelcomeSection'
import ImmigrationDashboardEngine from '../modules/immigration/engine/ImmigrationDashboardEngine'
import ImmigrationBreadcrumb from '../modules/immigration/widgets/ImmigrationBreadcrumb'

export default function HeadDashboard() {
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <WelcomeSection />
      <ImmigrationBreadcrumb />
      <ImmigrationDashboardEngine />
    </div>
  )
}
