import { useState, useMemo, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Add } from '@mui/icons-material'
import PageHeader from '../../../../components/common/PageHeader'
import TeamStatsCards from '../components/TeamStatsCards'
import TeamFilters from '../components/TeamFilters'
import TeamTable from '../components/TeamTable'
import TeamMemberForm from '../components/TeamMemberForm'
import TeamMemberDrawer from '../components/TeamMemberDrawer'
import { addTeamMember, updateTeamMember, fetchMarketingTeam } from '../../../../redux/slices/teamSlice'
import useTeamPermissions from '../hooks/useTeamPermissions'

export default function MarketingTeamPage() {
  const dispatch = useDispatch()
  const list = useSelector((s) => s.team.marketing)
  const { canEdit } = useTeamPermissions()

  useEffect(() => {
    dispatch(fetchMarketingTeam())
  }, [dispatch])

  const [filters, setFilters] = useState({
    search: '',
    designation: '',
    status: '',
    joiningDate: ''
  })

  const [selectedMember, setSelectedMember] = useState(null)
  const [isViewOpen, setViewOpen] = useState(false)
  const [editingMember, setEditingMember] = useState(null)
  const [isFormOpen, setFormOpen] = useState(false)

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const handleAddMember = (newMember) => {
    dispatch(addTeamMember({ department: 'Marketing', member: { ...newMember, department: 'Marketing' } }))
    setFormOpen(false)
  }

  const handleUpdateMember = (updated) => {
    dispatch(updateTeamMember({ department: 'Marketing', member: { ...updated, department: 'Marketing' } }))
    setFormOpen(false)
    setEditingMember(null)
  }

  const handleFormSubmit = (values) => {
    if (editingMember) {
      handleUpdateMember(values)
    } else {
      handleAddMember(values)
    }
  }

  const filteredMembers = useMemo(() => {
    return list.filter(m => {
      if (filters.status && m.status !== filters.status) return false
      if (filters.designation && m.designation !== filters.designation) return false
      if (filters.joiningDate) {
        const jDate = new Date(m.joining_date)
        const filterDate = new Date(filters.joiningDate)
        if (jDate < filterDate) return false
      }
      if (filters.search) {
        const query = filters.search.toLowerCase()
        return m.full_name.toLowerCase().includes(query) ||
               m.employee_id.toLowerCase().includes(query) ||
               m.email.toLowerCase().includes(query)
      }
      return true
    })
  }, [list, filters])

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="Marketing Team Management"
        subtitle={`${filteredMembers.length} department members listed`}
        breadcrumbs={['Dashboard', 'Marketing Team']}
        actions={
          canEdit ? (
            <button
              onClick={() => { setEditingMember(null); setFormOpen(true); }}
              className="btn-primary text-sm flex items-center gap-2"
            >
              <Add fontSize="small" /> Add Marketing Member
            </button>
          ) : null
        }
      />

      <TeamStatsCards department="Marketing" />

      <TeamFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        department="Marketing"
      />

      <TeamTable
        members={filteredMembers}
        department="Marketing"
        onView={(m) => { setSelectedMember(m); setViewOpen(true); }}
        onEdit={(m) => { setEditingMember(m); setFormOpen(true); }}
      />

      <TeamMemberDrawer
        open={isViewOpen}
        member={selectedMember}
        onClose={() => { setSelectedMember(null); setViewOpen(false); }}
      />

      <TeamMemberForm
        open={isFormOpen}
        editingMember={editingMember}
        department="Marketing"
        onClose={() => { setEditingMember(null); setFormOpen(false); }}
        onSubmit={handleFormSubmit}
      />
    </div>
  )
}
