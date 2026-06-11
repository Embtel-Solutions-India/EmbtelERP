import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import WelcomeSection from '../components/dashboard/WelcomeSection'
import ImmigrationLeadFunnel from '../modules/immigration/widgets/ImmigrationLeadFunnel'
import ImmigrationLeadTable  from '../modules/immigration/widgets/ImmigrationLeadTable'
import { fetchImmigrationVerticals, fetchImmigrationLeads } from '../modules/immigration/redux/immigrationSlice'
import { useImmigrationScope } from '../hooks/useImmigrationScope'
import ImmigrationBreadcrumb from '../modules/immigration/widgets/ImmigrationBreadcrumb'

export default function HeadLeadsPage() {
  const dispatch = useDispatch()
  const scope    = useImmigrationScope()

  useEffect(() => { dispatch(fetchImmigrationVerticals()) }, [dispatch])

  useEffect(() => {
    dispatch(fetchImmigrationLeads({
      verticalId: scope.scopeType === 'VERTICAL' ? scope.scopeId : undefined,
    }))
  }, [dispatch, scope.scopeType, scope.scopeId])

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <WelcomeSection />
      <ImmigrationBreadcrumb />
      <div>
        <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 mb-1">Lead Funnel</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Immigration lead pipeline by stage and vertical</p>
      </div>

      {/* Funnel overview */}
      <div className="max-w-sm">
        <ImmigrationLeadFunnel />
      </div>

      {/* Lead list */}
      <ImmigrationLeadTable />
    </div>
  )
}
