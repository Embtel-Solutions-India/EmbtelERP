// Presentational explainer of how a task moves through the IT department.
// Static (no data) — documents the workflow the board enforces.
const STEPS = [
  { label: 'Created', detail: 'PM or TL creates the task with a PRD gap reference (e.g. BILL-001) so every task ties back to a requirement. It lands in Backlog.' },
  { label: 'Assigned', detail: 'TL assigns it to a developer based on their current workload (see Team load). The assignee gets an in-app notification and the task shows in their My tasks, highlighted blue.' },
  { label: 'In progress', detail: 'The developer picks it up and moves it to In progress. It appears in their daily EOD report under "tasks in progress".' },
  { label: 'Review', detail: 'The developer raises a review. A second developer and QA check it against the acceptance criteria from the PRD ref.' },
  { label: 'Done', detail: 'Approved and merged. Story points count toward sprint velocity and the burndown updates.' },
]

export default function ItTaskFlow() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        How a task moves through the IT department. Tasks assigned by your team lead are <span className="font-semibold text-indigo-600 dark:text-indigo-400">assigned</span> (blue);
        tasks you pick up or create yourself are <span className="font-semibold">self-assigned</span>. Both appear in your EOD report.
      </p>
      <div className="space-y-3">
        {STEPS.map((s, i) => (
          <div key={s.label} className="card p-4 flex gap-3">
            <span className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs font-bold flex-shrink-0">
              {i + 1}
            </span>
            <div>
              <div className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">{s.label}</div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">{s.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
