import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { FaFileCsv, FaPrint } from 'react-icons/fa'
import { fetchImmigrationReports, fetchImmigrationVerticals } from '../redux/immigrationSlice'
import { exportCsv, openPrintView } from '../utils/exportData'

function SummaryRow({ label, value, highlight }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-neutral-100 dark:border-neutral-700 last:border-0">
      <span className="text-sm text-neutral-600 dark:text-neutral-400">{label}</span>
      <span className={`text-sm font-bold ${highlight ? 'text-indigo-600 dark:text-indigo-400' : 'text-neutral-800 dark:text-neutral-100'}`}>
        {value}
      </span>
    </div>
  )
}

function fmtRev(v) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}K`
  return `$${v}`
}

export default function ImmigrationReportSummary() {
  const dispatch = useDispatch()
  const { reports, loadingReports, verticals } = useSelector(s => s.immigration)
  const [verticalFilter, setVerticalFilter] = useState('')
  const [startDate, setStartDate]           = useState('')
  const [endDate, setEndDate]               = useState('')

  useEffect(() => {
    dispatch(fetchImmigrationVerticals())
  }, [dispatch])

  const runReport = () => {
    dispatch(fetchImmigrationReports({
      verticalId: verticalFilter || undefined,
      startDate:  startDate || undefined,
      endDate:    endDate   || undefined,
    }))
  }

  useEffect(() => { runReport() }, [])   // initial load

  const s = reports?.summary

  // ── Export handlers (CSV / Excel via BOM, and Print → PDF) ──────────────────
  const handleExportCsv = () => {
    const rows = (reports?.verticalBreakdown ?? []).filter(v => v.leads > 0 || v.revenue > 0)
    const columns = [
      { key: 'name',    label: 'Vertical'      },
      { key: 'leads',   label: 'Leads'         },
      { key: 'revenue', label: 'Revenue (USD)' },
    ]
    exportCsv(`immigration-report-${new Date().toISOString().slice(0, 10)}`, columns, rows)
  }

  const handlePrint = () => {
    if (!reports) return
    const sections = []
    if (s) {
      sections.push({
        heading: 'Summary',
        columns: [{ key: 'metric', label: 'Metric' }, { key: 'value', label: 'Value' }],
        rows: [
          { metric: 'Total Leads',      value: s.totalLeads },
          { metric: 'Won Leads',        value: s.wonLeads },
          { metric: 'Lost Leads',       value: s.lostLeads },
          { metric: 'Conversion Rate',  value: `${s.leadConversionRate}%` },
          { metric: 'Total Revenue',    value: fmtRev(s.totalRevenue) },
          { metric: 'Avg Deal Size',    value: fmtRev(s.avgDealSize) },
          { metric: 'Total Tasks',      value: s.totalTasks },
          { metric: 'Task Completion',  value: `${s.taskCompletionRate}%` },
        ],
      })
    }
    if (reports.funnel?.length) {
      sections.push({
        heading: 'Lead Pipeline',
        columns: [{ key: 'stage', label: 'Stage' }, { key: 'count', label: 'Count' }, { key: 'value', label: 'Value (USD)' }],
        rows: reports.funnel,
      })
    }
    if (reports.verticalBreakdown?.length) {
      sections.push({
        heading: 'By Vertical',
        columns: [{ key: 'name', label: 'Vertical' }, { key: 'leads', label: 'Leads' }, { key: 'revenue', label: 'Revenue (USD)' }],
        rows: reports.verticalBreakdown.filter(v => v.leads > 0 || v.revenue > 0),
      })
    }
    openPrintView('Immigration Division Report', sections)
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="card p-4">
        <h3 className="section-title mb-3">Report Filters</h3>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs text-neutral-500 dark:text-neutral-400 block mb-1">Vertical</label>
            <select
              value={verticalFilter}
              onChange={e => setVerticalFilter(e.target.value)}
              className="text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="">All Verticals</option>
              {verticals.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-neutral-500 dark:text-neutral-400 block mb-1">Start Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
          </div>
          <div>
            <label className="text-xs text-neutral-500 dark:text-neutral-400 block mb-1">End Date</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              className="text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
          </div>
          <button
            onClick={runReport}
            disabled={loadingReports}
            className="px-5 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loadingReports ? 'Loading…' : 'Run Report'}
          </button>

          {/* Export actions */}
          <div className="flex gap-2 ml-auto">
            <button
              onClick={handleExportCsv}
              disabled={!reports}
              title="Export to CSV / Excel"
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <FaFileCsv className="text-emerald-600 dark:text-emerald-400" /> CSV / Excel
            </button>
            <button
              onClick={handlePrint}
              disabled={!reports}
              title="Print or save as PDF"
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <FaPrint className="text-indigo-600 dark:text-indigo-400" /> Print / PDF
            </button>
          </div>
        </div>
      </div>

      {loadingReports && !reports && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 rounded-2xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
          <div className="h-64 rounded-2xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
        </div>
      )}

      {s && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Lead summary */}
          <div className="card p-5">
            <h3 className="section-title mb-3">Lead Summary</h3>
            <SummaryRow label="Total Leads"         value={s.totalLeads}                              />
            <SummaryRow label="Won Leads"           value={s.wonLeads}          highlight             />
            <SummaryRow label="Lost Leads"          value={s.lostLeads}                               />
            <SummaryRow label="Conversion Rate"     value={`${s.leadConversionRate}%`} highlight      />
          </div>

          {/* Revenue summary */}
          <div className="card p-5">
            <h3 className="section-title mb-3">Revenue Summary</h3>
            <SummaryRow label="Total Revenue"       value={fmtRev(s.totalRevenue)}   highlight        />
            <SummaryRow label="Avg Deal Size"       value={fmtRev(s.avgDealSize)}                    />
            <SummaryRow label="Total Tasks"         value={s.totalTasks}                              />
            <SummaryRow label="Task Completion"     value={`${s.taskCompletionRate}%`}                />
          </div>

          {/* Funnel */}
          {reports.funnel?.length > 0 && (
            <div className="card p-5">
              <h3 className="section-title mb-3">Lead Pipeline</h3>
              {reports.funnel.map(f => (
                <SummaryRow key={f.stage} label={f.stage} value={`${f.count} (${fmtRev(f.value)})`} />
              ))}
            </div>
          )}

          {/* Vertical breakdown */}
          {reports.verticalBreakdown?.length > 0 && (
            <div className="card p-5">
              <h3 className="section-title mb-3">By Vertical</h3>
              {reports.verticalBreakdown.filter(v => v.leads > 0 || v.revenue > 0).map(v => (
                <SummaryRow key={v.id} label={v.name} value={`${v.leads} leads · ${fmtRev(v.revenue)}`} />
              ))}
            </div>
          )}
        </div>
      )}

      {!s && !loadingReports && (
        <div className="text-center py-16 text-sm text-neutral-400">
          Configure filters above and click "Run Report"
        </div>
      )}
    </div>
  )
}
