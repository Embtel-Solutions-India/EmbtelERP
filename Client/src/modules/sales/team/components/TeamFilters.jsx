import { Search } from '@mui/icons-material'

export default function TeamFilters({ filters, onFilterChange, department = 'Sales' }) {
  const isSales = department.toLowerCase() === 'sales'
  const designations = isSales 
    ? ['Sales Executive', 'Sales Intern']
    : ['Marketing Executive', 'Marketing Intern']

  return (
    <div className="card p-4 flex flex-wrap items-center gap-3">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[240px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" style={{ fontSize: 18 }} />
        <input
          type="text"
          placeholder="Search team member name or email…"
          value={filters.search}
          onChange={(e) => onFilterChange({ search: e.target.value })}
          className="input-field pl-9"
        />
      </div>

      {/* Designation Dropdown */}
      <select
        value={filters.designation}
        onChange={(e) => onFilterChange({ designation: e.target.value })}
        className="input-field w-auto min-w-[150px]"
      >
        <option value="">All Designations</option>
        {designations.map(d => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>

      {/* Status Dropdown */}
      <select
        value={filters.status}
        onChange={(e) => onFilterChange({ status: e.target.value })}
        className="input-field w-auto min-w-[130px]"
      >
        <option value="">All Statuses</option>
        <option value="Active">Active</option>
        <option value="Inactive">Inactive</option>
        <option value="On Leave">On Leave</option>
      </select>

      {/* Joining Date Input */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">Joined Since</span>
        <input
          type="date"
          value={filters.joiningDate}
          onChange={(e) => onFilterChange({ joiningDate: e.target.value })}
          className="input-field w-auto"
        />
      </div>
    </div>
  )
}
