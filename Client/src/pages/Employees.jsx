import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { Add, Search, Edit, Block, CheckCircle } from '@mui/icons-material'
import { Tooltip } from '@mui/material'
import PageHeader from '../components/common/PageHeader'
import ActionFormModal from '../components/common/ActionFormModal'
import { fetchEmployees, createEmployeeAsync, updateEmployeeAsync, deactivateEmployeeAsync } from '../redux/slices/employeeSlice'
import { getInitials } from '../utils'
import api from '../services/api'
import OrgEmployeeDrawer from '../modules/admin/components/OrgEmployeeDrawer'

export default function Employees() {
  const dispatch = useDispatch()
  const { list: employees, loading } = useSelector((s) => s.employees)
  const { user } = useSelector((s) => s.auth)

  const [search, setSearch] = useState('')
  const [isFormOpen, setFormOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)
  // Super-Admin-only: open the shared org employee overview/task drawer.
  const [overviewId, setOverviewId] = useState(null)

  // Lookup metadata for dropdown fields
  const [meta, setMeta] = useState({
    businesses: [],
    departments: [],
    teams: [],
    roles: [],
  })

  useEffect(() => {
    dispatch(fetchEmployees())
    api.get('/hierarchy/meta').then((res) => {
      if (res.data) setMeta(res.data)
    }).catch(console.error)
  }, [dispatch])

  const level = Number(user?.roleLevel ?? user?.employeeLevel ?? 0)
  const designation = (user?.designation || '').toLowerCase()
  const canManage = level >= 3 || designation.includes('hr') || designation.includes('owner') || designation.includes('admin')
  const isSuperAdmin = level >= 5 || designation.includes('super admin')

  const filteredEmployees = employees.filter((emp) => {
    const query = search.toLowerCase()
    return (
      emp.firstName?.toLowerCase().includes(query) ||
      emp.lastName?.toLowerCase().includes(query) ||
      emp.email?.toLowerCase().includes(query) ||
      emp.designation?.toLowerCase().includes(query) ||
      emp.employeeCode?.toLowerCase().includes(query)
    )
  })

  const handleFormSubmit = (values) => {
    const payload = {
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      designation: values.designation,
      businessId: values.businessId,
      departmentId: values.departmentId || null,
      teamId: values.teamId || null,
      roleId: values.roleId,
      reportsToId: values.reportsToId || null,
    }

    if (editingEmployee) {
      dispatch(updateEmployeeAsync({ id: editingEmployee.id, ...payload })).then(() => {
        setFormOpen(false)
        setEditingEmployee(null)
      })
    } else {
      // Password required for new employee
      dispatch(createEmployeeAsync({ ...payload, organizationId: user.organizationId || employees[0]?.organizationId, password: values.password || 'Embtel@1234' })).then(() => {
        setFormOpen(false)
      })
    }
  }

  const handleEditClick = (emp) => {
    setEditingEmployee(emp)
    setFormOpen(true)
  }

  const handleDeactivate = (id) => {
    if (window.confirm('Are you sure you want to deactivate this employee?')) {
      dispatch(deactivateEmployeeAsync(id))
    }
  }

  const formFields = [
    { name: 'firstName', label: 'First Name', required: true },
    { name: 'lastName', label: 'Last Name', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    ...(!editingEmployee ? [{ name: 'password', label: 'Password', type: 'password', required: true, placeholder: 'Min 8 characters' }] : []),
    { name: 'designation', label: 'Designation', required: true },
    {
      name: 'roleId',
      label: 'System Role',
      type: 'select',
      options: meta.roles.map((r) => ({ value: r.id, label: `${r.name} (Lvl ${r.level})` })),
      required: true,
    },
    {
      name: 'businessId',
      label: 'Business Unit',
      type: 'select',
      options: meta.businesses.map((b) => ({ value: b.id, label: b.name })),
      required: true,
    },
    {
      name: 'departmentId',
      label: 'Department',
      type: 'select',
      options: [{ value: '', label: 'None' }, ...meta.departments.map((d) => ({ value: d.id, label: d.name }))],
    },
    {
      name: 'teamId',
      label: 'Team',
      type: 'select',
      options: [{ value: '', label: 'None' }, ...meta.teams.map((t) => ({ value: t.id, label: t.name }))],
    },
    {
      name: 'reportsToId',
      label: 'Reports To Manager',
      type: 'select',
      options: [{ value: '', label: 'None' }, ...employees.map((e) => ({ value: e.id, label: `${e.firstName} ${e.lastName} (${e.designation})` }))],
    },
  ]

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="Employee Directory"
        subtitle="Manage user accounts, roles, departments, and designations"
        breadcrumbs={['Dashboard', 'Employees']}
        actions={
          canManage && (
            <button onClick={() => { setEditingEmployee(null); setFormOpen(true); }} className="btn-primary text-sm flex items-center gap-2">
              <Add fontSize="small" /> Add Employee
            </button>
          )
        }
      />

      <ActionFormModal
        open={isFormOpen}
        title={editingEmployee ? "Edit Employee Account" : "Register Employee"}
        subtitle={editingEmployee ? "Modify designation and system settings" : "Create new credentials and set scopes"}
        fields={formFields}
        initialValues={editingEmployee ? {
          firstName: editingEmployee.firstName,
          lastName: editingEmployee.lastName,
          email: editingEmployee.email,
          designation: editingEmployee.designation,
          roleId: editingEmployee.roleId,
          businessId: editingEmployee.businessId,
          departmentId: editingEmployee.departmentId || '',
          teamId: editingEmployee.teamId || '',
          reportsToId: editingEmployee.reportsToId || '',
        } : {
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          designation: '',
          roleId: meta.roles[0]?.id || '',
          businessId: meta.businesses[0]?.id || '',
          departmentId: '',
          teamId: '',
          reportsToId: '',
        }}
        submitLabel={editingEmployee ? "Save Settings" : "Register Employee"}
        onClose={() => { setFormOpen(false); setEditingEmployee(null); }}
        onSubmit={handleFormSubmit}
      />

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" style={{ fontSize: 18 }} />
          <input
            type="text"
            placeholder="Search employee name, code, email, designation…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
      </div>

      {/* Table view */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-100 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-700/50">
                {['Employee', 'Code', 'Role / Title', 'Business Unit', 'Team', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider px-5 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50 dark:divide-neutral-700/50">
              {loading && (
                <tr>
                  <td colSpan="7" className="text-center py-6 text-sm text-neutral-400">Loading directory data...</td>
                </tr>
              )}
              {!loading && filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-6 text-sm text-neutral-400">No employees found.</td>
                </tr>
              )}
              {!loading && filteredEmployees.map((emp, i) => (
                <motion.tr key={emp.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors group text-sm">
                  <td className="px-5 py-3.5">
                    <div
                      onClick={isSuperAdmin ? () => setOverviewId(emp.id) : undefined}
                      title={isSuperAdmin ? 'View tasks & details' : undefined}
                      className={`flex items-center gap-3 ${isSuperAdmin ? 'cursor-pointer group/emp' : ''}`}
                    >
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                        {getInitials(`${emp.firstName} ${emp.lastName}`)}
                      </div>
                      <div>
                        <p className={`font-semibold text-neutral-800 dark:text-neutral-100 ${isSuperAdmin ? 'group-hover/emp:text-indigo-600 dark:group-hover/emp:text-indigo-400' : ''}`}>{emp.firstName} {emp.lastName}</p>
                        <p className="text-xs text-neutral-400 dark:text-neutral-500">{emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-neutral-600 dark:text-neutral-400 font-mono text-xs">{emp.employeeCode || '—'}</td>
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-neutral-700 dark:text-neutral-300">{emp.designation}</p>
                    <p className="text-[10px] text-neutral-400 uppercase tracking-wide font-bold">{emp.role?.name || 'Staff'}</p>
                  </td>
                  <td className="px-5 py-3.5 text-neutral-600 dark:text-neutral-400">{emp.business?.name || '—'}</td>
                  <td className="px-5 py-3.5 text-neutral-500 dark:text-neutral-400">{emp.team?.name || '—'}</td>
                  <td className="px-5 py-3.5">
                    <span className={emp.isActive ? 'badge-success' : 'badge-error'}>
                      {emp.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {canManage && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Tooltip title="Edit Profile">
                          <button onClick={() => handleEditClick(emp)} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 dark:hover:bg-neutral-700 transition-colors">
                            <Edit style={{ fontSize: 16 }} />
                          </button>
                        </Tooltip>
                        {emp.isActive && (
                          <Tooltip title="Deactivate">
                            <button onClick={() => handleDeactivate(emp.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 dark:hover:bg-neutral-700 transition-colors">
                              <Block style={{ fontSize: 16 }} />
                            </button>
                          </Tooltip>
                        )}
                      </div>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Super-Admin-only employee overview + task drawer (reused from Org Explorer) */}
      {isSuperAdmin && <OrgEmployeeDrawer employeeId={overviewId} onClose={() => setOverviewId(null)} />}
    </div>
  )
}
