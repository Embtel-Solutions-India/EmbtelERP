import { Link } from 'react-router-dom'
import { FaBell, FaBolt, FaCheckCircle } from 'react-icons/fa'

const toneClasses = {
  primary: 'text-primary-600 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20',
  success: 'text-emerald-600 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20',
  warning: 'text-amber-600 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20',
  danger: 'text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-900/20',
  neutral: 'text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-gray-800',
}

export default function RoleWorkspacePanel({ workspace }) {
  if (!workspace) return null

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between mb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            Role Workspace
          </p>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            {workspace.title}
          </h3>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">
          <FaBell size={12} />
          <span>{workspace.approvals?.pending ?? 0} {workspace.approvals?.label ?? 'approval requests'}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {workspace.widgets?.map((widget) => (
          <div
            key={widget.key}
            className={`rounded-lg px-3 py-3 ${toneClasses[widget.tone] || toneClasses.neutral}`}
          >
            <p className="text-xs font-semibold uppercase tracking-wider opacity-80">
              {widget.title}
            </p>
            <p className="text-2xl font-bold mt-1">{widget.value?.toLocaleString?.() ?? widget.value}</p>
            <p className="text-xs mt-1 opacity-80">{widget.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Today Focus
          </p>
          <div className="space-y-2">
            {workspace.focus?.map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <FaCheckCircle className="text-emerald-500 flex-shrink-0" size={13} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Role Actions
          </p>
          <div className="flex flex-wrap gap-2">
            {workspace.actions?.map((action) => (
              <Link
                key={action.key}
                to={action.path}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-slate-200 hover:bg-primary-50 hover:text-primary-700 dark:hover:bg-primary-900/20 dark:hover:text-primary-300 transition-colors"
              >
                <FaBolt size={11} />
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
