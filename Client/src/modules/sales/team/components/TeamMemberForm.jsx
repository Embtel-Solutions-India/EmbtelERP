import ActionFormModal from '../../../../components/common/ActionFormModal'

export default function TeamMemberForm({
  open,
  editingMember,
  onClose,
  onSubmit,
  department = 'Sales'
}) {
  const isSales = department.toLowerCase() === 'sales'
  const designations = isSales 
    ? ['Sales Executive', 'Sales Intern']
    : ['Marketing Executive', 'Marketing Intern']

  const fields = [
    { name: 'full_name', label: 'Full Name', required: true },
    { name: 'employee_id', label: 'Employee ID', required: true, placeholder: isSales ? 'EMP-S005' : 'EMP-M005' },
    { name: 'email', label: 'Email Address', type: 'email', required: true },
    { name: 'phone', label: 'Phone Number', type: 'tel', required: true },
    {
      name: 'department',
      label: 'Department',
      type: 'select',
      options: [
        { value: department, label: department }
      ]
    },
    {
      name: 'designation',
      label: 'Designation',
      type: 'select',
      options: designations.map(d => ({ value: d, label: d }))
    },
    { name: 'reporting_manager', label: 'Reporting Manager', required: true },
    { name: 'joining_date', label: 'Joining Date', type: 'date', required: true },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'Active', label: 'Active' },
        { value: 'Inactive', label: 'Inactive' },
        { value: 'On Leave', label: 'On Leave' }
      ]
    },
    { name: 'avatar', label: 'Avatar Portrait URL', fullWidth: true }
  ]

  const initialValues = editingMember 
    ? { ...editingMember }
    : {
        full_name: '',
        employee_id: '',
        email: '',
        phone: '',
        department: department,
        designation: designations[0],
        reporting_manager: isSales ? 'Vikram Nair' : 'Ananya Roy',
        joining_date: new Date().toISOString().split('T')[0],
        status: 'Active',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde' // Default avatar placeholder
      }

  return (
    <ActionFormModal
      open={open}
      title={editingMember ? 'Edit Team Member Details' : 'Add Team Member'}
      subtitle={editingMember ? 'Update details of the department member' : 'Create a new employee profile'}
      fields={fields}
      initialValues={initialValues}
      submitLabel={editingMember ? 'Save Changes' : 'Add Member'}
      onClose={onClose}
      onSubmit={(values) => {
        onSubmit({
          ...values,
          id: editingMember ? editingMember.id : Date.now()
        })
      }}
    />
  )
}
