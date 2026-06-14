import WelcomeSection from '../components/dashboard/WelcomeSection'
import ITDashboardEngine from '../modules/it/engine/ITDashboardEngine'

export default function ItDashboard() {
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <WelcomeSection />
      <ITDashboardEngine />
    </div>
  )
}
