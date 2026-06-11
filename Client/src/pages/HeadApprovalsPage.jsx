import { useState } from 'react'
import WelcomeSection from '../components/dashboard/WelcomeSection'
import ImmigrationApprovalList    from '../modules/immigration/widgets/ImmigrationApprovalList'
import ImmigrationEscalationList  from '../modules/immigration/widgets/ImmigrationEscalationList'
import ImmigrationBreadcrumb      from '../modules/immigration/widgets/ImmigrationBreadcrumb'

const TABS = [
  { id: 'approvals',   label: 'Approvals'   },
  { id: 'escalations', label: 'Escalations' },
]

export default function HeadApprovalsPage() {
  const [activeTab, setActiveTab] = useState('approvals')

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <WelcomeSection />
      <ImmigrationBreadcrumb />
      <div>
        <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 mb-1">Approval Center</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Review pending approvals and overdue escalations</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1 w-fit">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-white dark:bg-neutral-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'approvals'   && <ImmigrationApprovalList />}
      {activeTab === 'escalations' && <ImmigrationEscalationList />}
    </div>
  )
}
