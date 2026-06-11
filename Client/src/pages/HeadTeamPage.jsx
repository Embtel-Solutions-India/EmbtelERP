import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import WelcomeSection from '../components/dashboard/WelcomeSection'
import ImmigrationTeamTable from '../modules/immigration/widgets/ImmigrationTeamTable'
import ImmigrationBreadcrumb from '../modules/immigration/widgets/ImmigrationBreadcrumb'
import { fetchImmigrationVerticals } from '../modules/immigration/redux/immigrationSlice'

export default function HeadTeamPage() {
  const dispatch = useDispatch()
  useEffect(() => { dispatch(fetchImmigrationVerticals()) }, [dispatch])

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <WelcomeSection />
      <ImmigrationBreadcrumb />
      <div>
        <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 mb-1">Team Performance</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Employee health scores and productivity across the immigration division</p>
      </div>
      <ImmigrationTeamTable />
    </div>
  )
}
