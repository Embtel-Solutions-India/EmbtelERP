import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { Visibility, Edit, Delete, LockOpen, Lock, Block } from '@mui/icons-material'
import { Tooltip } from '@mui/material'
import { formatDate } from '../../../../utils'
import { deleteTeamMember, bulkDelete, bulkUpdateStatus } from '../../../../redux/slices/teamSlice'
import useTeamPermissions from '../hooks/useTeamPermissions'

const STATUS_COLORS = {
  Active: 'badge-success',
  Inactive: 'badge-error',
  'On Leave': 'badge-warning',
}

export default function TeamTable({
  members = [],
  department = 'Sales',
  onView,
  onEdit,
  onDeleteSuccess
}) {
  const dispatch = useDispatch()
  const { canEdit } = useTeamPermissions()

  const [selectedIds, setSelectedIds] = useState([])

  const handleSelectAll = (e) => {
    if (!canEdit) return
    if (e.target.checked) {
      setSelectedIds(members.map(m => m.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectRow = (id) => {
    if (!canEdit) return
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(item => item !== id))
    } else {
      setSelectedIds(prev => [...prev, id])
    }
  }

  const handleDeleteClick = (member) => {
    if (!canEdit) return
    if (window.confirm(`Are you sure you want to delete ${member.full_name}?`)) {
      dispatch(deleteTeamMember({ department, id: member.id }))
      if (onDeleteSuccess) onDeleteSuccess()
    }
  }

  // Bulk Operations
  const handleBulkDelete = () => {
    if (!canEdit) return
    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} selected team members?`)) {
      dispatch(bulkDelete({ department, ids: selectedIds }))
      setSelectedIds([])
      if (onDeleteSuccess) onDeleteSuccess()
    }
  }

  const handleBulkStatusChange = (status) => {
    if (!canEdit) return
    dispatch(bulkUpdateStatus({ department, ids: selectedIds, status }))
    setSelectedIds([])
    if (onDeleteSuccess) onDeleteSuccess()
  }

  return (
    <div className="space-y-4">
      {/* Bulk Operations Floating Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-between p-3.5 bg-indigo-50 border border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900 rounded-2xl"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-400">
                {selectedIds.length} team members selected
              </span>
            </div>
            {canEdit ? (
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkStatusChange('Active')}
                  className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/20"
                >
                  <LockOpen style={{ fontSize: 13 }} /> Bulk Activate
                </button>
                <button
                  onClick={() => handleBulkStatusChange('Inactive')}
                  className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20"
                >
                  <Block style={{ fontSize: 13 }} /> Bulk Deactivate
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-1 text-xs px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors"
                >
                  <Delete style={{ fontSize: 13 }} /> Bulk Delete
                </button>
              </div>
            ) : (
              <span className="text-xs text-neutral-400 italic flex items-center gap-1">
                <Lock style={{ fontSize: 12 }} /> Bulk modifications restricted (View Only)
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Table Card */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-100 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-700/50">
                <th className="px-5 py-3 text-left w-10">
                  <input
                    type="checkbox"
                    checked={members.length > 0 && selectedIds.length === members.length}
                    onChange={handleSelectAll}
                    disabled={!canEdit}
                    className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
                {['Avatar', 'Employee Name', 'Employee ID', 'Email', 'Phone', 'Designation', 'Joining Date', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider px-5 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50 dark:divide-neutral-700/50">
              <AnimatePresence>
                {members.map((member, i) => (
                  <motion.tr
                    key={member.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors group"
                  >
                    <td className="px-5 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(member.id)}
                        onChange={() => handleSelectRow(member.id)}
                        disabled={!canEdit}
                        className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                      />
                    </td>
                    <td className="px-5 py-4">
                      <img
                        src={member.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e'}
                        alt={member.full_name}
                        className="w-9 h-9 rounded-xl object-cover flex-shrink-0"
                      />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 whitespace-nowrap">{member.full_name}</p>
                          <p className="text-xs text-neutral-400 dark:text-neutral-500">{member.department} Team</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 whitespace-nowrap">{member.employee_id}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs text-neutral-600 dark:text-neutral-400">{member.email}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs text-neutral-500 dark:text-neutral-400 whitespace-nowrap">{member.phone}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 px-2.5 py-1 rounded-md font-semibold whitespace-nowrap">
                        {member.designation}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs text-neutral-500 dark:text-neutral-400 whitespace-nowrap">{formatDate(member.joining_date)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`badge ${STATUS_COLORS[member.status] || 'badge-primary'}`}>{member.status}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Tooltip title="View Profile">
                          <button
                            onClick={() => onView(member)}
                            className="p-1.5 rounded-lg text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/20 transition-colors"
                          >
                            <Visibility style={{ fontSize: 16 }} />
                          </button>
                        </Tooltip>
                        
                        {canEdit && (
                          <>
                            <Tooltip title="Edit Member">
                              <button
                                onClick={() => onEdit(member)}
                                className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors"
                              >
                                <Edit style={{ fontSize: 16 }} />
                              </button>
                            </Tooltip>
                            <Tooltip title="Delete Member">
                              <button
                                onClick={() => handleDeleteClick(member)}
                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                              >
                                <Delete style={{ fontSize: 16 }} />
                              </button>
                            </Tooltip>
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {members.length === 0 && (
          <div className="text-center py-12 text-neutral-400 bg-white dark:bg-neutral-800">
            No team members matched the active filters.
          </div>
        )}
      </div>
    </div>
  )
}
