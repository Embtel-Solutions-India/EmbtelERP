import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronRight,
  ExpandMore,
  Business as BusinessIcon,
  AccountTree as VerticalIcon,
  Group as TeamIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  CheckCircle as CheckIcon,
  Pending as PendingIcon,
  Assessment as AssessmentIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  ArrowBack as BackIcon,
  Delete as DeleteIcon,
  Cancel as CancelIcon,
  CalendarMonth as CalendarIcon,
  AccessTime as TimeIcon,
  Badge as BadgeIcon,
  Rule as RuleIcon,
} from '@mui/icons-material'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import api from '../../../services/api'
import {
  switchPerspective,
  resetPerspective,
  fetchPerspectives,
  fetchCurrentPerspective,
  fetchHierarchyTree,
} from '../../../redux/slices/perspectiveSlice'
import {
  fetchDashboardOverview,
  fetchDashboardPerformance,
  fetchDashboardInsights,
  fetchDashboardTeam,
} from '../../../redux/slices/dashboardSlice'

export default function OrgExplorer() {
  const dispatch = useDispatch()
  const { user } = useSelector((s) => s.auth)
  const { current: activePerspective } = useSelector((s) => s.perspective)

  // Tabs
  const [activeTab, setActiveTab] = useState('explorer') // explorer, analytics, control

  // Explorer Tab States
  const [treeData, setTreeData] = useState(null)
  const [employeesList, setEmployeesList] = useState([])
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null)
  const [employeeDetails, setEmployeeDetails] = useState(null)
  const [explorerTabSub, setExplorerTabSub] = useState('tree') // tree, list

  // Filtering states
  const [searchQuery, setSearchQuery] = useState('')
  const [businessFilter, setBusinessFilter] = useState('')
  const [verticalFilter, setVerticalFilter] = useState('')
  const [designationFilter, setDesignationFilter] = useState('')
  const [levelFilter, setLevelFilter] = useState('')

  // Expand/collapse states for tree nodes
  const [expandedNodes, setExpandedNodes] = useState({})

  // Loading states
  const [treeLoading, setTreeLoading] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)

  // Analytics Tab States
  const [analytics, setAnalytics] = useState(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)

  // Control Modules Tab States
  const [activeConfigTab, setActiveConfigTab] = useState('users') // users, businesses, verticals, teams, audit
  const [configLists, setConfigLists] = useState({
    businesses: [],
    verticals: [],
    teams: [],
    roles: [],
    permissions: [],
    users: [],
  })
  const [auditLogs, setAuditLogs] = useState([])
  const [configLoading, setConfigLoading] = useState(false)

  // Modals for CRUD operations
  const [crudModalOpen, setCrudModalOpen] = useState(false)
  const [crudType, setCrudType] = useState('') // user, business, vertical, team
  const [crudMode, setCrudMode] = useState('create') // create, edit
  const [crudForm, setCrudForm] = useState({})
  const [crudError, setCrudError] = useState('')
  const [crudSubmitting, setCrudSubmitting] = useState(false)

  // Load initial data
  useEffect(() => {
    loadExplorerTree()
    loadGlobalAnalytics()
    loadConfigLists()
  }, [])

  // Refresh tree and details when selected employee changes
  useEffect(() => {
    if (selectedEmployeeId) {
      loadEmployeeDetails(selectedEmployeeId)
    }
  }, [selectedEmployeeId])

  const loadExplorerTree = async () => {
    setTreeLoading(true)
    try {
      const treeRes = await api.get('/hierarchy/organization-tree')
      const empRes = await api.get('/employees')
      setTreeData(treeRes?.data || { businesses: [] })
      setEmployeesList(empRes?.data || [])

      // Auto-select first employee if none selected
      const list = empRes?.data || []
      if (list.length > 0 && !selectedEmployeeId) {
        setSelectedEmployeeId(list[0].id)
      }
    } catch (err) {
      console.error('Failed to load hierarchy tree', err)
    } finally {
      setTreeLoading(false)
    }
  }

  const loadEmployeeDetails = async (employeeId) => {
    setDetailsLoading(true)
    try {
      const [empRes, reportsRes, managersRes, tasksRes, actRes] = await Promise.all([
        api.get(`/employees/${employeeId}`),
        api.get(`/hierarchy/descendants/${employeeId}`).catch(() => ({ data: [] })),
        api.get(`/hierarchy/managers/${employeeId}`).catch(() => ({ data: [] })),
        api.get('/tasks').catch(() => ({ data: [] })),
        api.get('/activities').catch(() => ({ data: [] })),
      ])

      const emp = empRes?.data || {}
      const allTasks = tasksRes?.data || []
      const empTasks = allTasks.filter((t) => t.assigneeId === employeeId)

      const allActivities = actRes?.data || []
      const empActivities = allActivities.filter((a) => a.actorId === employeeId)

      // Calculate simple attendance grid
      const attendanceGrid = [
        { day: 'Mon', status: 'present' },
        { day: 'Tue', status: 'present' },
        { day: 'Wed', status: 'present' },
        { day: 'Thu', status: 'present' },
        { day: 'Fri', status: 'absent' },
      ]

      // Extract unique manager
      const manager = managersRes?.data?.[0] || null

      setEmployeeDetails({
        employee: emp,
        manager,
        directReports: reportsRes?.data || [],
        tasks: empTasks,
        activities: empActivities,
        attendanceGrid,
        attendanceRate: 92,
        performanceScore: Math.min(100, 75 + Math.round((empTasks.filter((t) => t.status === 'completed').length / (empTasks.length || 1)) * 25)),
      })
    } catch (err) {
      console.error('Failed to load employee details', err)
    } finally {
      setDetailsLoading(false)
    }
  }

  const loadGlobalAnalytics = async () => {
    setAnalyticsLoading(true)
    try {
      const res = await api.get('/admin/global-analytics')
      setAnalytics(res?.data || null)
    } catch (err) {
      console.error('Failed to load global analytics', err)
    } finally {
      setAnalyticsLoading(false)
    }
  }

  const loadConfigLists = async () => {
    setConfigLoading(true)
    try {
      const res = await api.get('/admin/config-lists')
      const logsRes = await api.get('/audit-logs')
      setConfigLists(res?.data || {
        businesses: [],
        verticals: [],
        teams: [],
        roles: [],
        permissions: [],
        users: [],
      })
      setAuditLogs(logsRes?.data || [])
    } catch (err) {
      console.error('Failed to load configuration configurations', err)
    } finally {
      setConfigLoading(false)
    }
  }

  // Perspective switch handler
  const handleViewAs = (employee) => {
    const targetType = employee.level === 3 ? 'HEAD' : employee.level === 2 ? 'MANAGER' : employee.level === 0 ? 'INTERN' : 'EMPLOYEE'
    dispatch(switchPerspective({ targetType, targetId: employee.id })).then(() => {
      // Refresh global stores
      dispatch(fetchPerspectives())
      dispatch(fetchCurrentPerspective())
      dispatch(fetchHierarchyTree())
      dispatch(fetchDashboardOverview())
      dispatch(fetchDashboardPerformance())
      dispatch(fetchDashboardInsights())
      dispatch(fetchDashboardTeam())
    })
  }

  // Exiting perspective
  const handleExitImpersonation = () => {
    dispatch(resetPerspective()).then(() => {
      dispatch(fetchPerspectives())
      dispatch(fetchCurrentPerspective())
      dispatch(fetchHierarchyTree())
      dispatch(fetchDashboardOverview())
      dispatch(fetchDashboardPerformance())
      dispatch(fetchDashboardInsights())
      dispatch(fetchDashboardTeam())
    })
  }

  // Expand/collapse node helpers
  const toggleNode = (nodeId) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }))
  }

  // Filtered employees list
  const filteredEmployees = employeesList.filter((emp) => {
    const matchesSearch =
      `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.designation || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.email || '').toLowerCase().includes(searchQuery.toLowerCase())

    const matchesBusiness = !businessFilter || emp.businessId === businessFilter
    const matchesVertical = !verticalFilter || emp.verticalId === verticalFilter
    const matchesDesignation =
      !designationFilter || (emp.designation || '').toLowerCase().includes(designationFilter.toLowerCase())
    const matchesLevel = !levelFilter || String(emp.level ?? emp.role?.level) === levelFilter

    return matchesSearch && matchesBusiness && matchesVertical && matchesDesignation && matchesLevel
  })

  // CRUD Forms Submission
  const handleCrudSubmit = async (e) => {
    e.preventDefault()
    setCrudError('')
    setCrudSubmitting(true)
    try {
      let url = ''
      let method = 'post'

      if (crudType === 'business') {
        url = crudMode === 'create' ? '/admin/config/businesses' : `/admin/config/businesses/${crudForm.id}`
        method = crudMode === 'create' ? 'post' : 'patch'
      } else if (crudType === 'vertical') {
        url = crudMode === 'create' ? '/admin/config/verticals' : `/admin/config/verticals/${crudForm.id}`
        method = crudMode === 'create' ? 'post' : 'patch'
      } else if (crudType === 'team') {
        url = crudMode === 'create' ? '/admin/config/teams' : `/admin/config/teams/${crudForm.id}`
        method = crudMode === 'create' ? 'post' : 'patch'
      } else if (crudType === 'user') {
        url = `/admin/config/users/${crudForm.id}`
        method = 'patch'
      }

      await api[method](url, crudForm)
      setCrudModalOpen(false)
      loadConfigLists()
      loadExplorerTree()
    } catch (err) {
      setCrudError(err.response?.data?.message || err.message || 'Operation failed')
    } finally {
      setCrudSubmitting(false)
    }
  }

  const openCreateModal = (type) => {
    setCrudType(type)
    setCrudMode('create')
    setCrudError('')
    setCrudForm({})
    setCrudModalOpen(true)
  }

  const openEditModal = (type, data) => {
    setCrudType(type)
    setCrudMode('edit')
    setCrudError('')
    setCrudForm(data)
    setCrudModalOpen(true)
  }

  // Colors mapping for charts
  const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6', '#64748b']

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <BusinessIcon className="text-primary-500" />
            Super Admin Control Center
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Global administrative control center for businesses, role hierarchies, system settings, and analytics.
          </p>
        </div>

        {activePerspective && (
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2 text-amber-700 dark:text-amber-300">
            <span className="text-xs font-semibold">Viewing as Impersonator</span>
            <button
              onClick={handleExitImpersonation}
              className="btn-primary text-xs px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-sm"
            >
              Exit View
            </button>
          </div>
        )}
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-gray-800 gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('explorer')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'explorer'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700'
          }`}
        >
          <VerticalIcon style={{ fontSize: 18 }} />
          Organization Explorer
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'analytics'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700'
          }`}
        >
          <TrendingUpIcon style={{ fontSize: 18 }} />
          Global Analytics
        </button>
        <button
          onClick={() => setActiveTab('control')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'control'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700'
          }`}
        >
          <RuleIcon style={{ fontSize: 18 }} />
          Control Modules
        </button>
      </div>

      {/* Tab Contents */}
      <div className="mt-6">
        {activeTab === 'explorer' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            {/* Search, Filters, & Hierarchy list/tree */}
            <div className="xl:col-span-5 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-gray-800 pb-3">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Navigation Panel</h3>
                <div className="flex gap-1 bg-slate-50 dark:bg-gray-800 p-1 rounded-lg">
                  <button
                    onClick={() => setExplorerTabSub('tree')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      explorerTabSub === 'tree'
                        ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    Tree View
                  </button>
                  <button
                    onClick={() => setExplorerTabSub('list')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      explorerTabSub === 'list'
                        ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    Search/Filters
                  </button>
                </div>
              </div>

              {explorerTabSub === 'list' ? (
                // Detailed Search/Filter view
                <div className="space-y-3">
                  <div className="relative">
                    <SearchIcon
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      style={{ fontSize: 18 }}
                    />
                    <input
                      type="text"
                      placeholder="Search name, code, designation..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="input-field pl-9 py-2 text-sm w-full"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Business</label>
                      <select
                        value={businessFilter}
                        onChange={(e) => setBusinessFilter(e.target.value)}
                        className="input-field py-1.5 text-xs w-full"
                      >
                        <option value="">All Businesses</option>
                        {configLists.businesses.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Vertical</label>
                      <select
                        value={verticalFilter}
                        onChange={(e) => setVerticalFilter(e.target.value)}
                        className="input-field py-1.5 text-xs w-full"
                      >
                        <option value="">All Verticals</option>
                        {configLists.verticals.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Designation</label>
                      <input
                        type="text"
                        placeholder="e.g. Sales, Intern"
                        value={designationFilter}
                        onChange={(e) => setDesignationFilter(e.target.value)}
                        className="input-field py-1.5 text-xs w-full"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Level</label>
                      <select
                        value={levelFilter}
                        onChange={(e) => setLevelFilter(e.target.value)}
                        className="input-field py-1.5 text-xs w-full"
                      >
                        <option value="">All Levels</option>
                        <option value="5">Level 5 (Super Admin)</option>
                        <option value="4">Level 4 (Business Owner)</option>
                        <option value="3">Level 3 (Heads / Managers)</option>
                        <option value="2">Level 2 (Vertical Manager)</option>
                        <option value="1">Level 1 (Executive)</option>
                        <option value="0">Level 0 (Intern)</option>
                      </select>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 dark:border-gray-800 my-2 pt-2 max-h-[450px] overflow-y-auto space-y-1">
                    {filteredEmployees.map((emp) => (
                      <button
                        key={emp.id}
                        onClick={() => setSelectedEmployeeId(emp.id)}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all text-xs font-semibold ${
                          selectedEmployeeId === emp.id
                            ? 'bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-900/30'
                            : 'hover:bg-slate-50 dark:hover:bg-gray-800/40 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {emp.firstName?.[0]}
                          {emp.lastName?.[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold">
                            {emp.firstName} {emp.lastName}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">{emp.designation || 'Staff'}</p>
                        </div>
                        <span className="ml-auto text-[10px] bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-full flex-shrink-0">
                          L{emp.level ?? emp.role?.level}
                        </span>
                      </button>
                    ))}
                    {filteredEmployees.length === 0 && (
                      <p className="text-center text-xs text-slate-400 py-6">No matching employees found.</p>
                    )}
                  </div>
                </div>
              ) : (
                // Full Collapsible/Expandable Organization tree view
                <div className="max-h-[550px] overflow-y-auto space-y-1 pr-1">
                  {treeLoading && <p className="text-center text-xs text-slate-400 py-6">Loading organization structure...</p>}
                  {treeData?.businesses?.map((biz) => {
                    const bizNodeId = `biz-${biz.id}`
                    const isBizExpanded = !!expandedNodes[bizNodeId]
                    return (
                      <div key={biz.id} className="space-y-1">
                        <button
                          onClick={() => toggleNode(bizNodeId)}
                          className="w-full flex items-center gap-2 p-2 rounded-xl text-left text-xs font-bold bg-slate-50 dark:bg-gray-800/50 hover:bg-slate-100 dark:hover:bg-gray-800 border border-slate-100 dark:border-gray-800 text-slate-800 dark:text-slate-200"
                        >
                          <span className="flex-shrink-0">
                            {isBizExpanded ? (
                              <ExpandMore style={{ fontSize: 16 }} />
                            ) : (
                              <ChevronRight style={{ fontSize: 16 }} />
                            )}
                          </span>
                          <BusinessIcon style={{ fontSize: 16 }} className="text-blue-500 flex-shrink-0" />
                          <span className="truncate">{biz.name}</span>
                        </button>

                        <AnimatePresence>
                          {isBizExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="pl-4 border-l border-slate-100 dark:border-gray-800 ml-3.5 space-y-1 pt-1"
                            >
                              {/* Business Head */}
                              {biz.head && (
                                <button
                                  onClick={() => setSelectedEmployeeId(biz.head.id)}
                                  className={`w-full flex items-center gap-2 p-2 rounded-lg text-left text-xs font-semibold transition-all ${
                                    selectedEmployeeId === biz.head.id
                                      ? 'bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400'
                                      : 'hover:bg-slate-50 dark:hover:bg-gray-800/40 text-slate-600 dark:text-slate-400'
                                  }`}
                                >
                                  <PersonIcon style={{ fontSize: 14 }} className="text-indigo-500 flex-shrink-0" />
                                  <span className="truncate font-semibold">
                                    [Head] {biz.head.name}
                                  </span>
                                  <span className="ml-auto text-[9px] text-slate-400 truncate">
                                    {biz.head.designation}
                                  </span>
                                </button>
                              )}

                              {/* Verticals */}
                              {biz.verticals?.map((vert) => {
                                const vertNodeId = `vert-${vert.id}`
                                const isVertExpanded = !!expandedNodes[vertNodeId]
                                return (
                                  <div key={vert.id} className="space-y-1">
                                    <button
                                      onClick={() => toggleNode(vertNodeId)}
                                      className="w-full flex items-center gap-2 p-1.5 rounded-lg text-left text-xs font-bold hover:bg-slate-50 dark:hover:bg-gray-800/40 text-slate-700 dark:text-slate-300"
                                    >
                                      <span className="flex-shrink-0">
                                        {isVertExpanded ? (
                                          <ExpandMore style={{ fontSize: 14 }} />
                                        ) : (
                                          <ChevronRight style={{ fontSize: 14 }} />
                                        )}
                                      </span>
                                      <VerticalIcon style={{ fontSize: 14 }} className="text-amber-500 flex-shrink-0" />
                                      <span className="truncate font-semibold">{vert.name}</span>
                                    </button>

                                    {isVertExpanded && (
                                      <div className="pl-4 border-l border-slate-100 dark:border-gray-800 ml-3.5 space-y-1 pt-1">
                                        {/* Vertical Manager */}
                                        {vert.manager && (
                                          <button
                                            onClick={() => setSelectedEmployeeId(vert.manager.id)}
                                            className={`w-full flex items-center gap-2 p-2 rounded-lg text-left text-xs font-semibold transition-all ${
                                              selectedEmployeeId === vert.manager.id
                                                ? 'bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400'
                                                : 'hover:bg-slate-50 dark:hover:bg-gray-800/40 text-slate-600 dark:text-slate-400'
                                            }`}
                                          >
                                            <PersonIcon style={{ fontSize: 14 }} className="text-amber-600 flex-shrink-0" />
                                            <span className="truncate font-semibold">
                                              [Manager] {vert.manager.name}
                                            </span>
                                          </button>
                                        )}

                                        {/* Teams */}
                                        {vert.teams?.map((team) => {
                                          const teamNodeId = `team-${team.id}`
                                          const isTeamExpanded = !!expandedNodes[teamNodeId]
                                          return (
                                            <div key={team.id} className="space-y-1">
                                              <button
                                                onClick={() => toggleNode(teamNodeId)}
                                                className="w-full flex items-center gap-2 p-1.5 rounded-lg text-left text-xs font-bold hover:bg-slate-50 dark:hover:bg-gray-800/40 text-slate-600 dark:text-slate-400"
                                              >
                                                <span className="flex-shrink-0">
                                                  {isTeamExpanded ? (
                                                    <ExpandMore style={{ fontSize: 12 }} />
                                                  ) : (
                                                    <ChevronRight style={{ fontSize: 12 }} />
                                                  )}
                                                </span>
                                                <TeamIcon style={{ fontSize: 14 }} className="text-emerald-500 flex-shrink-0" />
                                                <span className="truncate font-semibold">{team.name}</span>
                                              </button>

                                              {isTeamExpanded && (
                                                <div className="pl-4 border-l border-slate-100 dark:border-gray-800 ml-3.5 space-y-1 pt-1">
                                                  {/* Team Manager */}
                                                  {team.manager && (
                                                    <button
                                                      onClick={() => setSelectedEmployeeId(team.manager.id)}
                                                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-left text-xs font-semibold transition-all ${
                                                        selectedEmployeeId === team.manager.id
                                                          ? 'bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400'
                                                          : 'hover:bg-slate-50 dark:hover:bg-gray-800/40 text-slate-600 dark:text-slate-400'
                                                      }`}
                                                    >
                                                      <PersonIcon style={{ fontSize: 14 }} className="text-green-500 flex-shrink-0" />
                                                      <span className="truncate font-semibold">
                                                        [Lead] {team.manager.name}
                                                      </span>
                                                    </button>
                                                  )}

                                                  {/* Team Members */}
                                                  {team.members?.map((mem) => (
                                                    <button
                                                      key={mem.id}
                                                      onClick={() => setSelectedEmployeeId(mem.id)}
                                                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-left text-xs font-medium transition-all ${
                                                        selectedEmployeeId === mem.id
                                                          ? 'bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400'
                                                          : 'hover:bg-slate-50 dark:hover:bg-gray-800/40 text-slate-500 dark:text-slate-400'
                                                      }`}
                                                    >
                                                      <PersonIcon style={{ fontSize: 14 }} className="text-slate-400 flex-shrink-0" />
                                                      <span className="truncate">{mem.name}</span>
                                                      <span className="ml-auto text-[8px] bg-slate-100 dark:bg-gray-800 px-1 py-0.5 rounded text-slate-400 flex-shrink-0">
                                                        L{mem.roleLevel}
                                                      </span>
                                                    </button>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                          )
                                        })}
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Detailed employee profile/inspector */}
            <div className="xl:col-span-7 space-y-6">
              {detailsLoading ? (
                <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-10 text-center shadow-sm">
                  <p className="text-sm text-slate-400">Fetching detailed organizational profile data...</p>
                </div>
              ) : employeeDetails ? (
                <div className="space-y-6">
                  {/* Detailed profile card */}
                  <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row gap-5 items-start sm:items-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 text-white font-bold text-2xl flex items-center justify-center shadow-md">
                      {employeeDetails.employee.firstName?.[0]}
                      {employeeDetails.employee.lastName?.[0]}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                          {employeeDetails.employee.firstName} {employeeDetails.employee.lastName}
                        </h2>
                        <span className="badge badge-primary text-xs">
                          {employeeDetails.employee.designation || 'Staff'}
                        </span>
                        <span className="text-xs bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full font-bold">
                          Level {employeeDetails.employee.level ?? employeeDetails.employee.role?.level}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 mt-1">{employeeDetails.employee.email}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Code: {employeeDetails.employee.employeeCode || 'N/A'} • Status:{' '}
                        <span
                          className={`font-semibold ${
                            employeeDetails.employee.isActive ? 'text-emerald-500' : 'text-red-500'
                          }`}
                        >
                          {employeeDetails.employee.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </p>
                    </div>

                    <div className="flex-shrink-0 self-stretch sm:self-auto flex items-end sm:items-center justify-end">
                      {activePerspective?.perspectiveTargetId === employeeDetails.employee.id ? (
                        <button
                          onClick={handleExitImpersonation}
                          className="w-full sm:w-auto flex items-center gap-1.5 btn-primary bg-amber-600 hover:bg-amber-700 text-white text-xs px-4 py-2"
                        >
                          Active Impersonation
                        </button>
                      ) : (
                        <button
                          onClick={() => handleViewAs(employeeDetails.employee)}
                          className="w-full sm:w-auto flex items-center gap-1.5 btn-secondary text-xs px-4 py-2 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          <PersonIcon style={{ fontSize: 16 }} />
                          View As (Impersonate)
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Core details mapping: Manager, Reports, Attendance, KPIs, Tasks, Activities */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Reporting & Hierarchy Info */}
                    <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-4">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-gray-800 pb-2">
                        Reporting Hierarchy
                      </h3>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Reporting Manager</p>
                        {employeeDetails.manager ? (
                          <button
                            onClick={() => setSelectedEmployeeId(employeeDetails.manager.id)}
                            className="mt-1.5 flex items-center gap-3 w-full p-2.5 rounded-xl border border-slate-100 dark:border-gray-850 hover:bg-slate-50 dark:hover:bg-gray-800/40 text-left transition-all"
                          >
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                              M
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                {employeeDetails.manager.name}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate">
                                {employeeDetails.manager.designation}
                              </p>
                            </div>
                          </button>
                        ) : (
                          <p className="text-xs text-slate-400 mt-1 italic">No reporting manager assigned (Top Level).</p>
                        )}
                      </div>

                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">
                          Direct Reports ({employeeDetails.directReports.length})
                        </p>
                        <div className="mt-2 space-y-1 max-h-40 overflow-y-auto pr-1">
                          {employeeDetails.directReports.map((report) => (
                            <button
                              key={report.id}
                              onClick={() => setSelectedEmployeeId(report.id)}
                              className="w-full flex items-center gap-2 p-2 rounded-lg text-left text-xs font-semibold hover:bg-slate-50 dark:hover:bg-gray-800/40 text-slate-600 dark:text-slate-400"
                            >
                              <ChevronRight style={{ fontSize: 14 }} />
                              <span className="truncate">{report.firstName} {report.lastName}</span>
                              <span className="ml-auto text-[9px] text-slate-400 truncate">
                                {report.designation}
                              </span>
                            </button>
                          ))}
                          {employeeDetails.directReports.length === 0 && (
                            <p className="text-xs text-slate-400 mt-1 italic">No subordinates report to this user.</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Performance Metrics */}
                    <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-4">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-gray-800 pb-2">
                        Performance & KPI Metrics
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-slate-50 dark:bg-gray-800/40 rounded-xl text-center">
                          <p className="text-[10px] uppercase font-bold text-slate-400">KPI Target Score</p>
                          <p className="text-xl font-bold text-primary-500 mt-1">{employeeDetails.performanceScore}%</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">avg monthly achievement</p>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-gray-800/40 rounded-xl text-center">
                          <p className="text-[10px] uppercase font-bold text-slate-400">Tasks Completed</p>
                          <p className="text-xl font-bold text-emerald-500 mt-1">
                            {employeeDetails.tasks.filter((t) => t.status === 'completed').length} /{' '}
                            {employeeDetails.tasks.length}
                          </p>
                          <p className="text-[9px] text-slate-400 mt-0.5">assigned task ratio</p>
                        </div>
                      </div>

                      {/* Mock Attendance widget */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-[10px] uppercase font-bold text-slate-400">Attendance Checker</p>
                          <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">
                            {employeeDetails.attendanceRate}% Present
                          </span>
                        </div>
                        <div className="flex gap-2.5">
                          {employeeDetails.attendanceGrid.map((day, idx) => (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 p-2 bg-slate-50 dark:bg-gray-800/45 rounded-lg border border-slate-100 dark:border-gray-850">
                              <span className="text-[9px] font-bold text-slate-400">{day.day}</span>
                              <div
                                className={`w-3.5 h-3.5 rounded-full ${
                                  day.status === 'present' ? 'bg-emerald-500' : 'bg-red-500'
                                }`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tasks list */}
                  <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-gray-800 pb-2 flex items-center justify-between">
                      Assigned Tasks ({employeeDetails.tasks.length})
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-left text-slate-400 border-b border-slate-100 dark:border-gray-800 uppercase tracking-wider font-bold">
                            <th className="pb-2">Task Title</th>
                            <th className="pb-2">Priority</th>
                            <th className="pb-2">Status</th>
                            <th className="pb-2">Due Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
                          {employeeDetails.tasks.map((task) => (
                            <tr key={task.id} className="hover:bg-slate-50 dark:hover:bg-gray-800/40">
                              <td className="py-2.5 font-semibold text-slate-700 dark:text-slate-200">
                                {task.title}
                              </td>
                              <td className="py-2.5">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    task.priority === 'high'
                                      ? 'bg-red-100 dark:bg-red-950/20 text-red-600 dark:text-red-400'
                                      : task.priority === 'medium'
                                      ? 'bg-amber-100 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400'
                                      : 'bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-slate-400'
                                  }`}
                                >
                                  {task.priority}
                                </span>
                              </td>
                              <td className="py-2.5">
                                <span
                                  className={`flex items-center gap-1 font-semibold ${
                                    task.status === 'completed' ? 'text-emerald-500' : 'text-amber-500'
                                  }`}
                                >
                                  {task.status === 'completed' ? (
                                    <CheckIcon style={{ fontSize: 14 }} />
                                  ) : (
                                    <PendingIcon style={{ fontSize: 14 }} />
                                  )}
                                  {task.status}
                                </span>
                              </td>
                              <td className="py-2.5 text-slate-400">
                                {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No Due Date'}
                              </td>
                            </tr>
                          ))}
                          {employeeDetails.tasks.length === 0 && (
                            <tr>
                              <td colSpan={4} className="text-center py-4 text-slate-400 italic">
                                No assigned tasks.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Activity Timeline */}
                  <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-gray-800 pb-2">
                      Recent Activity Timeline
                    </h3>
                    <div className="space-y-4 relative pl-4 border-l border-slate-100 dark:border-gray-800 ml-2 py-2">
                      {employeeDetails.activities.slice(0, 5).map((act, i) => (
                        <div key={i} className="relative space-y-1">
                          <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-primary-500 border border-white dark:border-gray-900 shadow-sm" />
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                              {act.title || `${act.action} action`}
                            </p>
                            <span className="text-[10px] text-slate-400">
                              {new Date(act.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400">{act.description || 'No description provided.'}</p>
                        </div>
                      ))}
                      {employeeDetails.activities.length === 0 && (
                        <p className="text-xs text-slate-400 italic">No recent system activities recorded.</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-10 text-center shadow-sm">
                  <p className="text-sm text-slate-400">Select an employee from the hierarchy list to view detail profiles.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {analyticsLoading ? (
              <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-10 text-center shadow-sm">
                <p className="text-sm text-slate-400">Retrieving system-wide analytics data...</p>
              </div>
            ) : analytics ? (
              <>
                {/* Stats cards grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Businesses</p>
                      <h4 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
                        {analytics.totalBusinesses}
                      </h4>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                      <BusinessIcon style={{ fontSize: 20 }} />
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Verticals / Teams</p>
                      <h4 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
                        {analytics.totalVerticals} / {analytics.totalTeams}
                      </h4>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                      <VerticalIcon style={{ fontSize: 20 }} />
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Employees</p>
                      <h4 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
                        {analytics.totalEmployees} <span className="text-xs text-slate-400">({analytics.totalActiveUsers} Active)</span>
                      </h4>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                      <PersonIcon style={{ fontSize: 20 }} />
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estimated Revenue</p>
                      <h4 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
                        ${analytics.totalRevenue.toLocaleString()}
                      </h4>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                      <MoneyIcon style={{ fontSize: 20 }} />
                    </div>
                  </div>
                </div>

                {/* KPI stats & task charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left task charts */}
                  <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white pb-2 border-b border-slate-100 dark:border-gray-800">
                      Department Task Completion & KPIs
                    </h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.departmentPerformance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-gray-800" />
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} domain={[0, 100]} />
                          <ChartTooltip
                            contentStyle={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: '12px' }}
                            labelStyle={{ fontWeight: 'bold' }}
                          />
                          <Bar dataKey="taskCompletionRate" name="Task Completion Rate %" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={32} />
                          <Bar dataKey="performanceScore" name="Performance Score %" fill="#10b981" radius={[4, 4, 0, 0]} barSize={32} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Circular/Breakdown KPI */}
                  <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white pb-2 border-b border-slate-100 dark:border-gray-800 mb-4">
                        KPI Targets & Approvals
                      </h3>
                      <div className="flex justify-center mb-6">
                        <div className="relative w-32 h-32 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="8" fill="transparent" className="dark:stroke-gray-800" />
                            <circle cx="50" cy="50" r="40" stroke="#8b5cf6" strokeWidth="8" fill="transparent" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * analytics.kpiSummary) / 100} strokeLinecap="round" />
                          </svg>
                          <div className="absolute flex flex-col items-center">
                            <span className="text-2xl font-bold text-slate-800 dark:text-white">
                              {analytics.kpiSummary}%
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Average KPI</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4 border-t border-slate-100 dark:border-gray-800 pt-4">
                      <div className="text-center">
                        <p className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-center gap-1">
                          <PendingIcon className="text-amber-500" style={{ fontSize: 14 }} /> Pending Tasks
                        </p>
                        <p className="text-lg font-bold text-slate-700 dark:text-slate-350 mt-1">
                          {analytics.pendingTasks}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-center gap-1">
                          <RuleIcon className="text-purple-500" style={{ fontSize: 14 }} /> Pending Approvals
                        </p>
                        <p className="text-lg font-bold text-slate-700 dark:text-slate-350 mt-1">
                          {analytics.pendingApprovals}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Department performance table */}
                <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white pb-2 border-b border-slate-100 dark:border-gray-800">
                    Business Divisions Overview
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-left text-slate-400 border-b border-slate-100 dark:border-gray-800 uppercase tracking-wider font-bold">
                          <th className="pb-2">Business Unit</th>
                          <th className="pb-2">Staff Count</th>
                          <th className="pb-2">Task Completion Rate</th>
                          <th className="pb-2">Division Score</th>
                          <th className="pb-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-gray-850">
                        {analytics.departmentPerformance.map((dept, i) => (
                          <tr key={i} className="hover:bg-slate-50 dark:hover:bg-gray-800/40">
                            <td className="py-3 font-semibold text-slate-750 dark:text-slate-200">
                              {dept.name}
                            </td>
                            <td className="py-3 font-medium text-slate-600 dark:text-slate-400">
                              {dept.employeeCount} Members
                            </td>
                            <td className="py-3 font-semibold text-blue-600 dark:text-blue-400">
                              {dept.taskCompletionRate}%
                            </td>
                            <td className="py-3 font-semibold text-emerald-600 dark:text-emerald-400">
                              {dept.performanceScore}/100
                            </td>
                            <td className="py-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                                ACTIVE
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-center text-xs text-slate-400 py-6">Failed to load analytics.</p>
            )}
          </div>
        )}

        {activeTab === 'control' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            {/* Control Sidebar Tabs */}
            <div className="xl:col-span-3 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm flex flex-row xl:flex-col gap-1 overflow-x-auto">
              <button
                onClick={() => setActiveConfigTab('users')}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 flex-shrink-0 ${
                  activeConfigTab === 'users'
                    ? 'bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-gray-800/50'
                }`}
              >
                <PersonIcon style={{ fontSize: 16 }} /> User Configurations
              </button>
              <button
                onClick={() => setActiveConfigTab('businesses')}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 flex-shrink-0 ${
                  activeConfigTab === 'businesses'
                    ? 'bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-gray-800/50'
                }`}
              >
                <BusinessIcon style={{ fontSize: 16 }} /> Businesses
              </button>
              <button
                onClick={() => setActiveConfigTab('verticals')}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 flex-shrink-0 ${
                  activeConfigTab === 'verticals'
                    ? 'bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-gray-800/50'
                }`}
              >
                <VerticalIcon style={{ fontSize: 16 }} /> Verticals
              </button>
              <button
                onClick={() => setActiveConfigTab('teams')}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 flex-shrink-0 ${
                  activeConfigTab === 'teams'
                    ? 'bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-gray-800/50'
                }`}
              >
                <TeamIcon style={{ fontSize: 16 }} /> Teams
              </button>
              <button
                onClick={() => setActiveConfigTab('audit')}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 flex-shrink-0 ${
                  activeConfigTab === 'audit'
                    ? 'bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-gray-800/50'
                }`}
              >
                <AssessmentIcon style={{ fontSize: 16 }} /> Audit Trail Logs
              </button>
            </div>

            {/* Control Panel view */}
            <div className="xl:col-span-9 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
              {configLoading ? (
                <p className="text-center text-xs text-slate-400 py-12">Refreshing panel data configurations...</p>
              ) : (
                <>
                  {activeConfigTab === 'users' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-100 dark:border-gray-800 pb-3">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white">User Administration</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-left text-slate-400 border-b border-slate-100 dark:border-gray-800 uppercase tracking-wider font-bold">
                              <th className="pb-2">Name / Email</th>
                              <th className="pb-2">Designation / Level</th>
                              <th className="pb-2">Business / Team</th>
                              <th className="pb-2">Status</th>
                              <th className="pb-2 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-gray-850">
                            {configLists.users.map((u) => (
                              <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-gray-800/40">
                                <td className="py-2.5">
                                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                                    {u.firstName} {u.lastName}
                                  </p>
                                  <p className="text-[10px] text-slate-400">{u.email}</p>
                                </td>
                                <td className="py-2.5">
                                  <p className="font-semibold text-slate-700 dark:text-slate-350">
                                    {u.designation || 'Staff'}
                                  </p>
                                  <p className="text-[10px] text-slate-400">Level {u.level ?? u.role?.level}</p>
                                </td>
                                <td className="py-2.5">
                                  <p className="font-medium text-slate-600 dark:text-slate-400">{u.business?.name}</p>
                                  <p className="text-[10px] text-slate-400">{u.team?.name || 'No Team'}</p>
                                </td>
                                <td className="py-2.5">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      u.isActive
                                        ? 'bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600'
                                        : 'bg-red-100 dark:bg-red-950/20 text-red-650'
                                    }`}
                                  >
                                    {u.isActive ? 'Active' : 'Inactive'}
                                  </span>
                                </td>
                                <td className="py-2.5 text-right">
                                  <button
                                    onClick={() => openEditModal('user', u)}
                                    className="p-1 text-slate-400 hover:text-primary-500 rounded"
                                  >
                                    <EditIcon style={{ fontSize: 16 }} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {activeConfigTab === 'businesses' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-100 dark:border-gray-800 pb-3">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white">Businesses</h3>
                        <button
                          onClick={() => openCreateModal('business')}
                          className="btn-primary flex items-center gap-1 text-xs px-3 py-1.5"
                        >
                          <AddIcon style={{ fontSize: 16 }} /> Create Business
                        </button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-left text-slate-400 border-b border-slate-100 dark:border-gray-800 uppercase tracking-wider font-bold">
                              <th className="pb-2">Name</th>
                              <th className="pb-2">Code</th>
                              <th className="pb-2">Status</th>
                              <th className="pb-2 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-gray-850">
                            {configLists.businesses.map((b) => (
                              <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-gray-800/40">
                                <td className="py-2.5 font-semibold text-slate-800 dark:text-slate-200">{b.name}</td>
                                <td className="py-2.5 text-slate-400 font-mono">{b.code}</td>
                                <td className="py-2.5">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      b.isActive
                                        ? 'bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600'
                                        : 'bg-red-100 dark:bg-red-950/20 text-red-650'
                                    }`}
                                  >
                                    {b.isActive ? 'Active' : 'Inactive'}
                                  </span>
                                </td>
                                <td className="py-2.5 text-right">
                                  <button
                                    onClick={() => openEditModal('business', b)}
                                    className="p-1 text-slate-400 hover:text-primary-500 rounded"
                                  >
                                    <EditIcon style={{ fontSize: 16 }} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {activeConfigTab === 'verticals' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-100 dark:border-gray-800 pb-3">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white">Verticals</h3>
                        <button
                          onClick={() => openCreateModal('vertical')}
                          className="btn-primary flex items-center gap-1 text-xs px-3 py-1.5"
                        >
                          <AddIcon style={{ fontSize: 16 }} /> Create Vertical
                        </button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-left text-slate-400 border-b border-slate-100 dark:border-gray-800 uppercase tracking-wider font-bold">
                              <th className="pb-2">Name</th>
                              <th className="pb-2">Code</th>
                              <th className="pb-2">Business Assignment</th>
                              <th className="pb-2">Status</th>
                              <th className="pb-2 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-gray-850">
                            {configLists.verticals.map((v) => (
                              <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-gray-800/40">
                                <td className="py-2.5 font-semibold text-slate-800 dark:text-slate-200">{v.name}</td>
                                <td className="py-2.5 text-slate-400 font-mono">{v.code}</td>
                                <td className="py-2.5 font-medium text-slate-700 dark:text-slate-300">
                                  {v.business?.name}
                                </td>
                                <td className="py-2.5">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      v.isActive
                                        ? 'bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600'
                                        : 'bg-red-100 dark:bg-red-950/20 text-red-650'
                                    }`}
                                  >
                                    {v.isActive ? 'Active' : 'Inactive'}
                                  </span>
                                </td>
                                <td className="py-2.5 text-right">
                                  <button
                                    onClick={() => openEditModal('vertical', v)}
                                    className="p-1 text-slate-400 hover:text-primary-500 rounded"
                                  >
                                    <EditIcon style={{ fontSize: 16 }} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {activeConfigTab === 'teams' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-100 dark:border-gray-800 pb-3">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white">Teams</h3>
                        <button
                          onClick={() => openCreateModal('team')}
                          className="btn-primary flex items-center gap-1 text-xs px-3 py-1.5"
                        >
                          <AddIcon style={{ fontSize: 16 }} /> Create Team
                        </button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-left text-slate-400 border-b border-slate-100 dark:border-gray-800 uppercase tracking-wider font-bold">
                              <th className="pb-2">Name</th>
                              <th className="pb-2">Code</th>
                              <th className="pb-2">Business / Vertical</th>
                              <th className="pb-2">Status</th>
                              <th className="pb-2 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-gray-850">
                            {configLists.teams.map((t) => (
                              <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-gray-800/40">
                                <td className="py-2.5 font-semibold text-slate-800 dark:text-slate-200">{t.name}</td>
                                <td className="py-2.5 text-slate-400 font-mono">{t.code}</td>
                                <td className="py-2.5 font-medium text-slate-700 dark:text-slate-300">
                                  {t.business?.name} / {t.vertical?.name || 'No Vertical'}
                                </td>
                                <td className="py-2.5">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      t.isActive
                                        ? 'bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600'
                                        : 'bg-red-100 dark:bg-red-950/20 text-red-650'
                                    }`}
                                  >
                                    {t.isActive ? 'Active' : 'Inactive'}
                                  </span>
                                </td>
                                <td className="py-2.5 text-right">
                                  <button
                                    onClick={() => openEditModal('team', t)}
                                    className="p-1 text-slate-400 hover:text-primary-500 rounded"
                                  >
                                    <EditIcon style={{ fontSize: 16 }} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {activeConfigTab === 'audit' && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-gray-800 pb-3">
                        System Audit Trail Logs
                      </h3>
                      <div className="overflow-x-auto max-h-[500px]">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-left text-slate-400 border-b border-slate-100 dark:border-gray-800 uppercase tracking-wider font-bold">
                              <th className="pb-2">Action</th>
                              <th className="pb-2">Entity Type</th>
                              <th className="pb-2">IP Address</th>
                              <th className="pb-2">Timestamp</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-gray-850 text-slate-700 dark:text-slate-350">
                            {auditLogs.map((log, i) => (
                              <tr key={i} className="hover:bg-slate-50 dark:hover:bg-gray-800/40">
                                <td className="py-2 font-semibold">{log.action}</td>
                                <td className="py-2">
                                  {log.entityType} ({log.entityId || 'N/A'})
                                </td>
                                <td className="py-2 font-mono text-[10px]">
                                  {log.ipAddress || '127.0.0.1'}
                                </td>
                                <td className="py-2 text-[10px] text-slate-400">
                                  {new Date(log.createdAt).toLocaleString()}
                                </td>
                              </tr>
                            ))}
                            {auditLogs.length === 0 && (
                              <tr>
                                <td colSpan={4} className="text-center py-6 text-slate-400 italic">
                                  No audit trail events captured.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* CRUD Creation/Editing Dialog Modal */}
      <AnimatePresence>
        {crudModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-850 rounded-2xl p-6 shadow-2xl w-full max-w-md"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-gray-800 pb-3 mb-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white capitalize">
                  {crudMode} {crudType} Configuration
                </h3>
                <button
                  onClick={() => setCrudModalOpen(false)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-450 rounded-lg"
                >
                  <CancelIcon />
                </button>
              </div>

              <form onSubmit={handleCrudSubmit} className="space-y-4">
                {crudError && <div className="text-xs bg-red-500/10 text-red-500 p-2.5 rounded-xl">{crudError}</div>}

                {/* Form fields depending on crudType */}
                {(crudType === 'business' || crudType === 'vertical' || crudType === 'team') && (
                  <>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-450 block mb-1">Name</label>
                      <input
                        type="text"
                        required
                        value={crudForm.name || ''}
                        onChange={(e) => setCrudForm({ ...crudForm, name: e.target.value })}
                        className="input-field py-2 text-sm w-full"
                        placeholder="e.g. Sales Division"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-450 block mb-1">Code</label>
                      <input
                        type="text"
                        required
                        value={crudForm.code || ''}
                        onChange={(e) => setCrudForm({ ...crudForm, code: e.target.value })}
                        className="input-field py-2 text-sm w-full"
                        placeholder="e.g. sales-div"
                      />
                    </div>

                    {crudMode === 'edit' && (
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="checkbox"
                          id="isActive"
                          checked={crudForm.isActive !== false}
                          onChange={(e) => setCrudForm({ ...crudForm, isActive: e.target.checked })}
                          className="w-4 h-4 rounded text-primary-500 border-slate-300 dark:border-gray-800"
                        />
                        <label htmlFor="isActive" className="text-xs font-semibold text-slate-700 dark:text-slate-350">
                          Active Status
                        </label>
                      </div>
                    )}
                  </>
                )}

                {crudType === 'vertical' && crudMode === 'create' && (
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-450 block mb-1">Business Unit</label>
                    <select
                      required
                      value={crudForm.businessId || ''}
                      onChange={(e) => setCrudForm({ ...crudForm, businessId: e.target.value })}
                      className="input-field py-2 text-sm w-full"
                    >
                      <option value="">Select Business</option>
                      {configLists.businesses.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {crudType === 'team' && (
                  <>
                    {crudMode === 'create' && (
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-450 block mb-1">Business Unit</label>
                        <select
                          required
                          value={crudForm.businessId || ''}
                          onChange={(e) => setCrudForm({ ...crudForm, businessId: e.target.value })}
                          className="input-field py-2 text-sm w-full"
                        >
                          <option value="">Select Business</option>
                          {configLists.businesses.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-450 block mb-1">Vertical Assignment</label>
                      <select
                        value={crudForm.verticalId || ''}
                        onChange={(e) => setCrudForm({ ...crudForm, verticalId: e.target.value })}
                        className="input-field py-2 text-sm w-full"
                      >
                        <option value="">No Vertical</option>
                        {configLists.verticals
                          .filter((v) => !crudForm.businessId || v.businessId === crudForm.businessId)
                          .map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.name} ({v.business?.name})
                            </option>
                          ))}
                      </select>
                    </div>
                  </>
                )}

                {crudType === 'user' && (
                  <>
                    <div>
                      <p className="text-xs text-slate-450">
                        Configuring User Profile for: <strong>{crudForm.firstName} {crudForm.lastName}</strong> ({crudForm.email})
                      </p>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-450 block mb-1">Designation</label>
                      <input
                        type="text"
                        value={crudForm.designation || ''}
                        onChange={(e) => setCrudForm({ ...crudForm, designation: e.target.value })}
                        className="input-field py-2 text-sm w-full"
                        placeholder="e.g. Sales Executive"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-450 block mb-1">Level</label>
                      <select
                        value={crudForm.level ?? ''}
                        onChange={(e) => setCrudForm({ ...crudForm, level: Number(e.target.value) })}
                        className="input-field py-2 text-sm w-full"
                      >
                        <option value="5">Level 5 (Super Admin)</option>
                        <option value="4">Level 4 (Business Owner)</option>
                        <option value="3">Level 3 (Heads / Managers)</option>
                        <option value="2">Level 2 (Vertical Manager)</option>
                        <option value="1">Level 1 (Executive)</option>
                        <option value="0">Level 0 (Intern)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-450 block mb-1">Business Unit</label>
                      <select
                        value={crudForm.businessId || ''}
                        onChange={(e) => setCrudForm({ ...crudForm, businessId: e.target.value })}
                        className="input-field py-2 text-sm w-full"
                      >
                        {configLists.businesses.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-450 block mb-1">Team Unit</label>
                      <select
                        value={crudForm.teamId || ''}
                        onChange={(e) => setCrudForm({ ...crudForm, teamId: e.target.value || null })}
                        className="input-field py-2 text-sm w-full"
                      >
                        <option value="">No Assigned Team</option>
                        {configLists.teams
                          .filter((t) => t.businessId === crudForm.businessId)
                          .map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-450 block mb-1">System Role</label>
                      <select
                        value={crudForm.roleId || ''}
                        onChange={(e) => setCrudForm({ ...crudForm, roleId: e.target.value })}
                        className="input-field py-2 text-sm w-full"
                      >
                        {configLists.roles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name} (L{r.level})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="checkbox"
                        id="userIsActive"
                        checked={crudForm.isActive !== false}
                        onChange={(e) => setCrudForm({ ...crudForm, isActive: e.target.checked })}
                        className="w-4 h-4 rounded text-primary-500 border-slate-300 dark:border-gray-800"
                      />
                      <label htmlFor="userIsActive" className="text-xs font-semibold text-slate-700 dark:text-slate-355">
                        Active Account
                      </label>
                    </div>
                  </>
                )}

                <div className="flex items-center gap-2 justify-end border-t border-slate-100 dark:border-gray-800 pt-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setCrudModalOpen(false)}
                    className="btn-secondary text-xs px-4 py-2 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={crudSubmitting}
                    className="btn-primary text-xs px-4 py-2 bg-primary-600 text-white rounded-lg shadow-sm"
                  >
                    {crudSubmitting ? 'Submitting...' : 'Save Configurations'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
