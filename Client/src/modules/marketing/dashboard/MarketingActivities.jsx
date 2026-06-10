import { useState, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, FilterList, Add, AccessTime, Campaign, Mail, Article, CloudUpload, PostAdd } from '@mui/icons-material'
import PageHeader from '../../../components/common/PageHeader'
import ActionFormModal from '../../../components/common/ActionFormModal'
import { formatDate } from '../../../utils'

const TYPE_ICONS = {
  campaign_created: <Campaign className="text-indigo-500" />,
  campaign_updated: <Campaign className="text-amber-500" />,
  leads_generated:  <PostAdd className="text-emerald-500" />,
  email_sent:       <Mail className="text-purple-500" />,
  content_published:<Article className="text-blue-500" />,
  asset_uploaded:   <CloudUpload className="text-cyan-500" />,
}

const ACTIVITY_FIELDS = [
  { name: 'title', label: 'Activity Title', required: true },
  { name: 'description', label: 'Detailed Description', required: true, fullWidth: true },
  {
    name: 'type',
    label: 'Activity Type',
    type: 'select',
    options: [
      { value: 'campaign_created', label: 'Campaign Created' },
      { value: 'campaign_updated', label: 'Campaign Updated' },
      { value: 'leads_generated', label: 'Leads Logged' },
      { value: 'email_sent', label: 'Email Dispatched' },
      { value: 'content_published', label: 'Content Published' },
      { value: 'asset_uploaded', label: 'Asset Uploaded' },
    ],
  },
]

const ACTIVITY_INITIAL_VALUES = {
  title: '',
  description: '',
  type: 'content_published',
}

export default function MarketingActivities() {
  const dispatch = useDispatch()
  const { activities } = useSelector((s) => s.marketingDashboard)
  const [localActivities, setLocalActivities] = useState(activities)
  
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [isFormOpen, setFormOpen] = useState(false)

  const handleAddActivity = (values) => {
    const newAct = {
      id: Date.now(),
      type: values.type,
      title: values.title,
      description: values.description,
      time: new Date().toISOString(),
    }
    // Update local state (since we want immediate update and slice holds defaults)
    setLocalActivities(prev => [newAct, ...prev])
    setFormOpen(false)
  }

  const filteredActivities = useMemo(() => {
    return localActivities.filter((act) => {
      if (typeFilter && act.type !== typeFilter) return false
      if (search) {
        const query = search.toLowerCase()
        return act.title.toLowerCase().includes(query) || 
               act.description.toLowerCase().includes(query)
      }
      return true
    })
  }, [localActivities, search, typeFilter])

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      <PageHeader
        title="Work Logs & Activities"
        subtitle="Log of historical marketing actions and deployments"
        breadcrumbs={['Dashboard', 'Activities']}
        actions={
          <button onClick={() => setFormOpen(true)} className="btn-primary text-sm flex items-center gap-2">
            <Add fontSize="small" /> Log Work Unit
          </button>
        }
      />

      <ActionFormModal
        open={isFormOpen}
        title="Log Work Activity"
        subtitle="Record your execution log details"
        fields={ACTIVITY_FIELDS}
        initialValues={ACTIVITY_INITIAL_VALUES}
        submitLabel="Log Activity"
        onClose={() => setFormOpen(false)}
        onSubmit={handleAddActivity}
      />

      {/* Filter Bar */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" style={{ fontSize: 18 }} />
          <input
            type="text"
            placeholder="Search work logs…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input-field w-auto min-w-[180px]">
          <option value="">All Types</option>
          <option value="campaign_created">Campaign Creations</option>
          <option value="campaign_updated">Campaign Adjustments</option>
          <option value="leads_generated">Lead Acquisitions</option>
          <option value="email_sent">Email Deliveries</option>
          <option value="content_published">Content Publications</option>
          <option value="asset_uploaded">Asset Uploads</option>
        </select>
      </div>

      {/* Activity Timeline List */}
      <div className="card p-6">
        <div className="relative border-l border-neutral-200 dark:border-neutral-700 ml-4 space-y-8">
          <AnimatePresence>
            {filteredActivities.map((act, i) => (
              <motion.div
                key={act.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: i * 0.05 }}
                className="relative pl-8"
              >
                {/* Node icon */}
                <div className="absolute -left-5 top-1.5 w-10 h-10 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center shadow-sm">
                  {TYPE_ICONS[act.type] || <AccessTime className="text-neutral-400" />}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">{act.title}</h3>
                    <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-medium flex items-center gap-1">
                      <AccessTime style={{ fontSize: 11 }} /> {formatDate(act.time)}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-[800px]">{act.description}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredActivities.length === 0 && (
          <div className="text-center py-12 text-neutral-400">
            No work activity logs match the selected filters.
          </div>
        )}
      </div>
    </div>
  )
}
