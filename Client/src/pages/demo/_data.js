// Static demo data derived from Server/prisma/seed.ts
// Hierarchy: Super Admin → Business Owner → Immigration Head → Vertical Manager
//            → Sales Head / Marketing Manager / Documentation Manager
//            → (Sales|Marketing|Documentation) Exec → Intern

export const SEED = {
  org:      'Embtel ERP',
  business: 'Immigration Business',
  vertical: 'Immigration Operations',
  teams: ['Sales Team', 'Marketing Team', 'Documentation Team'],
}

// ─── Shared performance chart months ─────────────────────────────────────────
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']

// ─── Role configs ─────────────────────────────────────────────────────────────
export const ROLES = {
  superAdmin: {
    label:       'Super Admin',
    name:        'Super Admin',
    email:       'superadmin@demo.com',
    designation: 'Super Admin',
    level:       5,
    color:       '#7c3aed',
    badgeClass:  'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
    bannerClass: 'from-violet-600 to-purple-700',
    scope:       'Entire Organisation · 13 employees · 1 business · 3 teams',

    kpis: [
      { title: 'Total Employees', value: 13,     change: 18,  icon: '👥', color: '#7c3aed', sparkData: [8,9,10,11,11,12,13] },
      { title: 'Businesses',      value: 1,      change: 0,   icon: '🏢', color: '#2563eb', sparkData: [1,1,1,1,1,1,1] },
      { title: 'Active Tasks',    value: 47,     change: 12,  icon: '✅', color: '#059669', sparkData: [30,35,38,40,43,45,47] },
      { title: 'System Uptime',   value: '99.9%',change: 0.1, icon: '🔧', color: '#0891b2', formatValue: false },
      { title: 'Tasks Completed', value: 32,     change: 8,   icon: '🎯', color: '#d97706', sparkData: [18,21,24,26,28,30,32] },
      { title: 'Tasks Pending',   value: 15,     change: -5,  icon: '⏳', color: '#dc2626', sparkData: [22,20,19,18,17,16,15] },
    ],

    chart: {
      title: 'Org-wide Monthly Task Completion (%)',
      color: '#7c3aed',
      data: MONTHS.map((m, i) => ({ month: m, completed: [78,82,85,79,88,91][i], target: [85,85,85,85,90,90][i] })),
    },

    tasks: [
      { title: 'Update database schema',          priority: 'High',   status: 'In Progress', assignee: 'Super Admin',  due: 'Today' },
      { title: 'Review Q4 KPIs across all teams', priority: 'High',   status: 'Pending',     assignee: 'Super Admin',  due: 'Tomorrow' },
      { title: 'Quarterly system health check',   priority: 'Medium', status: 'Done',        assignee: 'Super Admin',  due: '—' },
      { title: 'Onboard new team members',        priority: 'Medium', status: 'In Progress', assignee: 'Business Owner',due: 'This Week' },
      { title: 'Audit role permissions',          priority: 'Low',    status: 'Pending',     assignee: 'Super Admin',  due: 'Next Week' },
    ],

    teamMetrics: [
      { team: 'Sales Team',         members: 3, performance: 78, tasks: 18, completion: '72%',  lead: 'Sales Head' },
      { team: 'Marketing Team',     members: 3, performance: 82, tasks: 16, completion: '81%',  lead: 'Marketing Manager' },
      { team: 'Documentation Team', members: 3, performance: 74, tasks: 13, completion: '69%',  lead: 'Documentation Manager' },
    ],
  },

  businessOwner: {
    label:       'Business Owner',
    name:        'Business Owner',
    email:       'owner@demo.com',
    designation: 'Business Owner',
    level:       4,
    color:       '#2563eb',
    badgeClass:  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    bannerClass: 'from-blue-600 to-blue-800',
    scope:       'Immigration Business · 11 employees · 3 teams',

    kpis: [
      { title: 'Total Staff',      value: 11,      change: 10,  icon: '👥', color: '#2563eb', sparkData: [7,8,8,9,10,11,11] },
      { title: 'Revenue (₹L)',     value: 38,      change: 14,  icon: '💰', color: '#059669', sparkData: [22,26,29,31,35,37,38] },
      { title: 'Target (₹L)',      value: 50,      change: 0,   icon: '🎯', color: '#d97706', formatValue: false },
      { title: 'Active Teams',     value: 3,       change: 0,   icon: '🏗️', color: '#7c3aed', sparkData: [3,3,3,3,3,3,3] },
      { title: 'Tasks Completed',  value: 26,      change: 8,   icon: '✅', color: '#059669', sparkData: [14,16,18,20,22,24,26] },
      { title: 'Tasks Pending',    value: 12,      change: -4,  icon: '⏳', color: '#dc2626', sparkData: [20,18,17,16,14,13,12] },
    ],

    chart: {
      title: 'Monthly Revenue vs Target (₹L)',
      color: '#2563eb',
      data: MONTHS.map((m, i) => ({ month: m, completed: [22,26,29,31,35,37][i], target: [30,33,36,39,44,50][i] })),
    },

    tasks: [
      { title: 'Q2 Revenue Review',              priority: 'High',   status: 'In Progress', assignee: 'Business Owner',   due: 'Today' },
      { title: 'Approve Marketing Budget',        priority: 'High',   status: 'Pending',     assignee: 'Business Owner',   due: 'Tomorrow' },
      { title: 'Team Performance Review',         priority: 'Medium', status: 'Done',        assignee: 'Business Owner',   due: '—' },
      { title: 'Hire 2 Executives',               priority: 'Medium', status: 'Pending',     assignee: 'Immigration Head', due: 'This Week' },
      { title: 'Vertical Expansion Planning',     priority: 'Low',    status: 'Pending',     assignee: 'Business Owner',   due: 'Next Week' },
    ],

    teamMetrics: [
      { team: 'Sales Team',         members: 3, performance: 78, tasks: 18, completion: '72%',  lead: 'Sales Head' },
      { team: 'Marketing Team',     members: 3, performance: 82, tasks: 16, completion: '81%',  lead: 'Marketing Manager' },
      { team: 'Documentation Team', members: 3, performance: 74, tasks: 13, completion: '69%',  lead: 'Documentation Manager' },
    ],
  },

  businessHead: {
    label:       'Business Head',
    name:        'Immigration Head',
    email:       'immigration.head@demo.com',
    designation: 'Head of Immigration',
    level:       3,
    color:       '#4f46e5',
    badgeClass:  'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
    bannerClass: 'from-indigo-600 to-indigo-800',
    scope:       'Immigration Business · 9 employees across 1 vertical',

    kpis: [
      { title: 'Direct Team',       value: 9,    change: 12,  icon: '👥', color: '#4f46e5', sparkData: [6,7,7,8,8,9,9] },
      { title: 'Active Cases',      value: 24,   change: 9,   icon: '📋', color: '#2563eb', sparkData: [16,18,19,21,22,23,24] },
      { title: 'Target Achievement',value: '78%',change: 5,   icon: '🎯', color: '#059669', formatValue: false },
      { title: 'SLA Compliance',    value: '92%',change: 3,   icon: '📊', color: '#0891b2', formatValue: false },
      { title: 'Weekly Tasks',      value: 18,   change: -2,  icon: '✅', color: '#d97706', sparkData: [22,21,20,19,19,18,18] },
      { title: 'Escalations',       value: 2,    change: -3,  icon: '🚨', color: '#dc2626', sparkData: [8,6,5,4,3,2,2] },
    ],

    chart: {
      title: 'Weekly Case Resolution Rate',
      color: '#4f46e5',
      data: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d, i) => ({
        month: d, completed: [4,6,5,7,5,3,2][i], target: [5,5,5,5,5,4,2][i],
      })),
    },

    tasks: [
      { title: 'Monthly KPI Review',          priority: 'High',   status: 'In Progress', assignee: 'Immigration Head', due: 'Today' },
      { title: 'Client Escalation #102',       priority: 'High',   status: 'Pending',     assignee: 'Immigration Head', due: 'Today' },
      { title: 'Vertical Sync Meeting',        priority: 'Medium', status: 'Done',        assignee: 'Vertical Manager', due: '—' },
      { title: 'Update SLA Guidelines',        priority: 'Medium', status: 'Pending',     assignee: 'Immigration Head', due: 'This Week' },
      { title: 'Quarterly Head Report',        priority: 'Low',    status: 'Pending',     assignee: 'Immigration Head', due: 'Next Week' },
    ],

    teamMetrics: [
      { team: 'Immigration Operations', members: 9, performance: 81, tasks: 47, completion: '74%',  lead: 'Vertical Manager' },
      { team: 'Sales Team',             members: 3, performance: 78, tasks: 18, completion: '72%',  lead: 'Sales Head' },
      { team: 'Marketing Team',         members: 3, performance: 82, tasks: 16, completion: '81%',  lead: 'Marketing Manager' },
      { team: 'Documentation Team',     members: 3, performance: 74, tasks: 13, completion: '69%',  lead: 'Documentation Manager' },
    ],
  },

  vertical: {
    label:       'Vertical Manager',
    name:        'Immigration Vertical',
    email:       'immigration.vertical@demo.com',
    designation: 'Vertical Manager',
    level:       2,
    color:       '#0d9488',
    badgeClass:  'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
    bannerClass: 'from-teal-600 to-teal-800',
    scope:       'Immigration Operations Vertical · 9 employees · 3 teams',

    kpis: [
      { title: 'Vertical Members',  value: 9,    change: 12,  icon: '👥', color: '#0d9488', sparkData: [6,7,7,8,8,9,9] },
      { title: 'Tasks in Vertical', value: 47,   change: 6,   icon: '📋', color: '#2563eb', sparkData: [36,38,40,42,44,46,47] },
      { title: 'Performance Score', value: '81%',change: 4,   icon: '📈', color: '#059669', formatValue: false },
      { title: 'Leads Generated',   value: 38,   change: 18,  icon: '🎯', color: '#d97706', sparkData: [22,25,28,31,34,36,38] },
      { title: 'Completion Rate',   value: '74%',change: -2,  icon: '✅', color: '#7c3aed', formatValue: false },
      { title: 'Weekly Meetings',   value: 8,    change: 0,   icon: '📅', color: '#0891b2', sparkData: [8,8,7,8,8,8,8] },
    ],

    chart: {
      title: 'Team Performance This Week',
      color: '#0d9488',
      data: ['Mon','Tue','Wed','Thu','Fri'].map((d, i) => ({
        month: d,
        completed: [12,15,11,16,14][i],
        target:    [14,14,14,14,14][i],
      })),
    },

    tasks: [
      { title: 'Vertical KPI Sync',              priority: 'High',   status: 'In Progress', assignee: 'Vertical Manager',  due: 'Today' },
      { title: 'Sales Pipeline Review',           priority: 'High',   status: 'Pending',     assignee: 'Sales Head',        due: 'Tomorrow' },
      { title: 'Marketing Campaign Approval',     priority: 'Medium', status: 'Done',        assignee: 'Marketing Manager', due: '—' },
      { title: 'Documentation SLA Audit',         priority: 'Medium', status: 'In Progress', assignee: 'Docs Manager',      due: 'This Week' },
      { title: 'Cross-Team Leads Meeting',        priority: 'Low',    status: 'Pending',     assignee: 'Vertical Manager',  due: 'Next Week' },
    ],

    teamMetrics: [
      { team: 'Sales Team',         members: 3, performance: 78, tasks: 18, completion: '72%',  lead: 'Sales Head' },
      { team: 'Marketing Team',     members: 3, performance: 82, tasks: 16, completion: '81%',  lead: 'Marketing Manager' },
      { team: 'Documentation Team', members: 3, performance: 74, tasks: 13, completion: '69%',  lead: 'Documentation Manager' },
    ],
  },

  manager: {
    label:       'Manager',
    name:        'Sales Head',
    email:       'sales.head@demo.com',
    designation: 'Sales Head',
    level:       2,
    color:       '#16a34a',
    badgeClass:  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    bannerClass: 'from-green-600 to-green-800',
    scope:       'Sales Team · 2 reports · Sales Executive + Sales Intern',

    kpis: [
      { title: 'Team Size',          value: 3,    change: 0,   icon: '👥', color: '#16a34a', sparkData: [3,3,3,3,3,3,3] },
      { title: 'Tasks Assigned',     value: 12,   change: 8,   icon: '📋', color: '#2563eb', sparkData: [8,9,10,10,11,12,12] },
      { title: 'Completion Rate',    value: '75%',change: 5,   icon: '✅', color: '#059669', formatValue: false },
      { title: 'Avg Response Time',  value: '2.4h',change: -8, icon: '⚡', color: '#d97706', formatValue: false },
      { title: 'Team Score',         value: 78,   change: 4,   icon: '🏆', color: '#7c3aed', sparkData: [68,70,72,73,75,77,78] },
      { title: 'Weekly Meetings',    value: 5,    change: 0,   icon: '📅', color: '#0891b2', sparkData: [5,4,5,5,4,5,5] },
    ],

    chart: {
      title: 'Daily Team Task Completion',
      color: '#16a34a',
      data: ['Mon','Tue','Wed','Thu','Fri'].map((d, i) => ({
        month: d,
        completed: [3,4,2,4,3][i],
        target:    [4,4,4,4,4][i],
      })),
    },

    tasks: [
      { title: 'Weekly Sales Review',              priority: 'High',   status: 'In Progress', assignee: 'Sales Head',      due: 'Today' },
      { title: 'Lead Qualification — Client A',    priority: 'High',   status: 'Pending',     assignee: 'Sales Exec',      due: 'Today' },
      { title: 'CRM Data Cleanup',                 priority: 'Medium', status: 'Done',        assignee: 'Sales Intern',    due: '—' },
      { title: 'Follow-up Call — Client B',        priority: 'Medium', status: 'In Progress', assignee: 'Sales Exec',      due: 'Tomorrow' },
      { title: 'Proposal for Client C',            priority: 'Low',    status: 'Pending',     assignee: 'Sales Head',      due: 'This Week' },
    ],

    teamMetrics: [
      { team: 'Sales Head',      members: 1, performance: 88, tasks: 5, completion: '80%', lead: 'Sales Head' },
      { team: 'Sales Exec',      members: 1, performance: 76, tasks: 5, completion: '70%', lead: 'Self' },
      { team: 'Sales Intern',    members: 1, performance: 68, tasks: 2, completion: '66%', lead: 'Learning' },
    ],
  },

  executive: {
    label:       'Executive',
    name:        'Sales Exec',
    email:       'sales.exec@demo.com',
    designation: 'Sales Executive',
    level:       1,
    color:       '#ea580c',
    badgeClass:  'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    bannerClass: 'from-orange-500 to-orange-700',
    scope:       'Sales Team · Self + 1 intern (Sales Intern)',

    kpis: [
      { title: 'My Tasks',          value: 8,    change: 0,   icon: '📋', color: '#ea580c', sparkData: [6,7,7,8,8,8,8] },
      { title: 'Completed',         value: 5,    change: 25,  icon: '✅', color: '#059669', sparkData: [2,3,3,4,4,5,5] },
      { title: 'Leads Owned',       value: 12,   change: 20,  icon: '🎯', color: '#2563eb', sparkData: [7,8,9,10,11,11,12] },
      { title: 'Meetings This Week',value: 3,    change: 0,   icon: '📅', color: '#7c3aed', sparkData: [2,3,3,2,3,3,3] },
      { title: 'Calls Made',        value: 24,   change: 14,  icon: '📞', color: '#0891b2', sparkData: [14,17,18,20,22,23,24] },
      { title: 'Response Rate',     value: '92%',change: 3,   icon: '⚡', color: '#16a34a', formatValue: false },
    ],

    chart: {
      title: 'My Daily Task Progress This Week',
      color: '#ea580c',
      data: ['Mon','Tue','Wed','Thu','Fri'].map((d, i) => ({
        month: d,
        completed: [1,2,1,2,1][i],
        target:    [2,2,2,2,2][i],
      })),
    },

    tasks: [
      { title: 'Follow-up Call — Client B',       priority: 'High',   status: 'In Progress', assignee: 'Me',          due: 'Today' },
      { title: 'Proposal for Client C',           priority: 'High',   status: 'Pending',     assignee: 'Me',          due: 'Tomorrow' },
      { title: 'CRM Update for 3 leads',          priority: 'Medium', status: 'Done',        assignee: 'Me',          due: '—' },
      { title: 'Assist Sales Intern on lead',     priority: 'Medium', status: 'In Progress', assignee: 'Me',          due: 'Today' },
      { title: 'Attend Monday sales standup',     priority: 'Low',    status: 'Done',        assignee: 'Me',          due: '—' },
    ],

    teamMetrics: [
      { team: 'Sales Head',   members: 1, performance: 88, tasks: 5, completion: '80%', lead: 'Manager' },
      { team: 'Me (Exec)',    members: 1, performance: 76, tasks: 5, completion: '70%', lead: 'You' },
      { team: 'Sales Intern', members: 1, performance: 68, tasks: 2, completion: '66%', lead: 'Report' },
    ],
  },

  intern: {
    label:       'Intern',
    name:        'Sales Intern',
    email:       'sales.intern@demo.com',
    designation: 'Sales Intern',
    level:       0,
    color:       '#db2777',
    badgeClass:  'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
    bannerClass: 'from-pink-600 to-rose-700',
    scope:       'Sales Team · Self only',

    kpis: [
      { title: 'Assigned Tasks',    value: 4,    change: 0,   icon: '📋', color: '#db2777', sparkData: [2,3,3,4,4,4,4] },
      { title: 'Completed',         value: 2,    change: 100, icon: '✅', color: '#059669', sparkData: [0,0,1,1,1,2,2] },
      { title: 'Learning Hours',    value: 12,   change: 20,  icon: '📚', color: '#2563eb', sparkData: [6,7,8,9,10,11,12] },
      { title: 'My Score',          value: '68%',change: 8,   icon: '🏆', color: '#d97706', formatValue: false },
      { title: 'Training Modules',  value: 3,    change: 50,  icon: '🎓', color: '#7c3aed', sparkData: [1,1,2,2,3,3,3] },
      { title: 'Days Active',       value: 18,   change: 0,   icon: '📅', color: '#0891b2', sparkData: [3,6,9,12,15,17,18] },
    ],

    chart: {
      title: 'My Weekly Task Progress',
      color: '#db2777',
      data: ['Mon','Tue','Wed','Thu','Fri'].map((d, i) => ({
        month: d,
        completed: [0,1,0,1,0][i],
        target:    [1,1,1,1,1][i],
      })),
    },

    tasks: [
      { title: 'CRM Data Cleanup',            priority: 'Medium', status: 'Done',        assignee: 'Me', due: '—' },
      { title: 'Assist Exec on Lead A',        priority: 'High',   status: 'In Progress', assignee: 'Me', due: 'Today' },
      { title: 'Complete CRM Training Module', priority: 'Medium', status: 'Pending',     assignee: 'Me', due: 'This Week' },
      { title: 'Sales Process Reading',        priority: 'Low',    status: 'Pending',     assignee: 'Me', due: 'Next Week' },
    ],

    teamMetrics: [
      { team: 'Sales Head',   members: 1, performance: 88, tasks: 5,  completion: '80%', lead: 'Manager' },
      { team: 'Sales Exec',   members: 1, performance: 76, tasks: 5,  completion: '70%', lead: 'Supervisor' },
      { team: 'Me (Intern)',  members: 1, performance: 68, tasks: 4,  completion: '50%', lead: 'You' },
    ],
  },
}
