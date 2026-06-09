// ─── HELPER ──────────────────────────────────────────────────────────────────
// Creates a copy of a menu with the Dashboard item pointing to a different path.
function withDashboardPath(menu, dashPath) {
  return menu.map(item => item.id === 'dashboard' ? { ...item, path: dashPath } : item)
}

// ─── SALES MODULE MENUS ──────────────────────────────────────────────────────

export const salesInternMenu = [
  { id: 'dashboard',   label: 'Dashboard',   icon: 'Dashboard',     path: '/sales-intern/dashboard' },
  { id: 'leads',       label: 'My Leads',    icon: 'PersonAdd',     path: '/sales/leads'            },
  { id: 'follow-ups',  label: 'Follow Ups',  icon: 'PhoneCallback', path: '/sales/follow-ups'       },
  { id: 'tasks',       label: 'Tasks',       icon: 'TaskAlt',       path: '/sales/tasks'            },
  { id: 'activities',  label: 'Activities',  icon: 'CalendarMonth', path: '/sales/activities'       },
  { id: 'profile',     label: 'Profile',     icon: 'AccountCircle', path: '/sales/profile'          },
]

export const salesExecutiveMenu = [
  { id: 'dashboard',     label: 'Dashboard',     icon: 'Dashboard',     path: '/sales/dashboard'     },
  { id: 'leads',         label: 'Leads',         icon: 'PersonAdd',     path: '/sales/leads'         },
  { id: 'follow-ups',    label: 'Follow Ups',    icon: 'PhoneCallback', path: '/sales/follow-ups'    },
  { id: 'meetings',      label: 'Meetings',      icon: 'VideoCall',     path: '/sales/meetings'      },
  { id: 'customers',     label: 'Customers',     icon: 'People',        path: '/sales/customers'     },
  { id: 'tasks',         label: 'Tasks',         icon: 'TaskAlt',       path: '/sales/tasks'         },
  { id: 'activities',    label: 'Activities',    icon: 'CalendarMonth', path: '/sales/activities'    },
  { id: 'performance',   label: 'Performance',   icon: 'Leaderboard',   path: '/sales/performance'   },
  { id: 'profile',       label: 'Profile',       icon: 'AccountCircle', path: '/sales/profile'       },
]

export const salesHeadMenu = [
  { id: 'dashboard',      label: 'Dashboard',       icon: 'Dashboard',     path: '/sales-manager/dashboard' },
  { id: 'team',           label: 'Team',            icon: 'People',        path: '/sales/team'              },
  { id: 'leads',          label: 'Lead Assignment', icon: 'PersonAdd',     path: '/sales/leads'             },
  { id: 'performance',    label: 'Performance',     icon: 'Leaderboard',   path: '/sales/performance'       },
  { id: 'reports',        label: 'Reports',         icon: 'Assessment',    path: '/sales/reports'           },
  { id: 'approvals',      label: 'Approvals',       icon: 'TaskAlt',       path: '/sales/approvals'         },
  { id: 'profile',        label: 'Profile',         icon: 'AccountCircle', path: '/sales/profile'           },
]

// Legacy alias — kept for any remaining callers
export const salesMenu = salesExecutiveMenu

// ─── MARKETING MODULE MENUS ──────────────────────────────────────────────────

export const marketingInternMenu = [
  { id: 'dashboard',  label: 'Dashboard', icon: 'Dashboard',     path: '/marketing-intern/dashboard' },
  { id: 'tasks',      label: 'Tasks',     icon: 'TaskAlt',       path: '/marketing/tasks'            },
  { id: 'assets',     label: 'Content',   icon: 'People',        path: '/marketing/assets'           },
  { id: 'campaigns',  label: 'Campaigns', icon: 'TrendingUp',    path: '/marketing/campaigns'        },
  { id: 'profile',    label: 'Profile',   icon: 'AccountCircle', path: '/marketing/profile'          },
]

export const marketingExecutiveMenu = [
  { id: 'dashboard',       label: 'Dashboard',       icon: 'Dashboard',     path: '/marketing/dashboard'       },
  { id: 'campaigns',       label: 'Campaigns',       icon: 'TrendingUp',    path: '/marketing/campaigns'       },
  { id: 'email-marketing', label: 'Email Marketing', icon: 'VideoCall',     path: '/marketing/email-marketing' },
  { id: 'assets',          label: 'Assets',          icon: 'People',        path: '/marketing/assets'          },
  { id: 'leads',           label: 'Lead Funnels',    icon: 'PersonAdd',     path: '/marketing/leads'           },
  { id: 'tasks',           label: 'Tasks',           icon: 'TaskAlt',       path: '/marketing/tasks'           },
  { id: 'reports',         label: 'Reports',         icon: 'Assessment',    path: '/marketing/reports'         },
  { id: 'profile',         label: 'Profile',         icon: 'AccountCircle', path: '/marketing/profile'         },
]

export const marketingManagerMenu = [
  { id: 'dashboard',       label: 'Dashboard',       icon: 'Dashboard',     path: '/marketing-manager/dashboard' },
  { id: 'campaigns',       label: 'Campaigns',       icon: 'TrendingUp',    path: '/marketing/campaigns'         },
  { id: 'approvals',       label: 'Approvals',       icon: 'TaskAlt',       path: '/marketing/approvals'         },
  { id: 'team',            label: 'Team',            icon: 'People',        path: '/marketing/team'              },
  { id: 'performance',     label: 'Performance',     icon: 'Leaderboard',   path: '/marketing/performance'       },
  { id: 'reports',         label: 'Reports',         icon: 'Assessment',    path: '/marketing/reports'           },
  { id: 'profile',         label: 'Profile',         icon: 'AccountCircle', path: '/marketing/profile'           },
]

// Legacy alias
export const marketingMenu = marketingExecutiveMenu

// ─── PRODUCTION (Documentation) MODULE ───────────────────────────────────────

export const productionInternMenu = [
  { id: 'dashboard',   label: 'Dashboard',  icon: 'Dashboard',     path: '/production/dashboard'  },
  { id: 'documents',   label: 'Documents',  icon: 'Assessment',    path: '/production/documents'  },
  { id: 'tasks',       label: 'Tasks',      icon: 'TaskAlt',       path: '/production/tasks'      },
  { id: 'profile',     label: 'Profile',    icon: 'AccountCircle', path: '/production/profile'    },
]

export const productionExecutiveMenu = [
  { id: 'dashboard',     label: 'Dashboard',    icon: 'Dashboard',     path: '/production/dashboard'    },
  { id: 'cases',         label: 'Cases',        icon: 'RequestQuote',  path: '/production/cases'        },
  { id: 'documents',     label: 'Documents',    icon: 'Assessment',    path: '/production/documents'    },
  { id: 'verification',  label: 'Verification', icon: 'TrendingUp',    path: '/production/verification' },
  { id: 'tasks',         label: 'Tasks',        icon: 'TaskAlt',       path: '/production/tasks'        },
  { id: 'reports',       label: 'Reports',      icon: 'Leaderboard',   path: '/production/reports'      },
  { id: 'profile',       label: 'Profile',      icon: 'AccountCircle', path: '/production/profile'      },
]

export const productionManagerMenu = [
  { id: 'dashboard',    label: 'Dashboard', icon: 'Dashboard',     path: '/production/dashboard'  },
  { id: 'cases',        label: 'Cases',     icon: 'RequestQuote',  path: '/production/cases'      },
  { id: 'approvals',    label: 'Approvals', icon: 'TaskAlt',       path: '/production/approvals'  },
  { id: 'team',         label: 'Team',      icon: 'People',        path: '/production/team'       },
  { id: 'reports',      label: 'Reports',   icon: 'Assessment',    path: '/production/reports'    },
  { id: 'profile',      label: 'Profile',   icon: 'AccountCircle', path: '/production/profile'    },
]

// Role-specific documentation entry dashboards (same sub-pages, different home)
export const documentationInternMenu    = withDashboardPath(productionInternMenu,   '/documentation-intern/dashboard')
export const documentationExecutiveMenu = withDashboardPath(productionExecutiveMenu, '/documentation/dashboard')
export const documentationManagerMenu   = withDashboardPath(productionManagerMenu,  '/documentation-manager/dashboard')

// Legacy alias
export const productionMenu = productionExecutiveMenu

// ─── EVALUATION MODULE ────────────────────────────────────────────────────────

export const evaluationMenu = [
  { id: 'dashboard', label: 'Dashboard', icon: 'Dashboard', path: '/evaluation/dashboard' },
]

export const headEvaluationMenu = withDashboardPath(evaluationMenu, '/head-evaluation/dashboard')
export const professorMenu      = withDashboardPath(evaluationMenu, '/professor/dashboard')

// ─── HR MODULE ────────────────────────────────────────────────────────────────

export const hrMenu = [
  { id: 'dashboard',    label: 'Dashboard',    icon: 'Dashboard',     path: '/hr/dashboard'    },
  { id: 'employees',    label: 'Employees',    icon: 'People',        path: '/hr/employees'    },
  { id: 'recruitment',  label: 'Recruitment',  icon: 'PersonAdd',     path: '/hr/recruitment'  },
  { id: 'attendance',   label: 'Attendance',   icon: 'CalendarMonth', path: '/hr/attendance'   },
  { id: 'performance',  label: 'Performance',  icon: 'Leaderboard',   path: '/hr/performance'  },
  { id: 'reports',      label: 'Reports',      icon: 'Assessment',    path: '/hr/reports'      },
  { id: 'profile',      label: 'Profile',      icon: 'AccountCircle', path: '/hr/profile'      },
]

export const hrExecutiveMenu   = withDashboardPath(hrMenu, '/hr-executive/dashboard')
export const recruitmentMenu   = withDashboardPath(hrMenu, '/recruitment/dashboard')

// ─── OWNER / HEAD MODULE ──────────────────────────────────────────────────────

export const ownerMenu = [
  { id: 'dashboard',   label: 'Dashboard',  icon: 'Dashboard',     path: '/owner/dashboard'   },
  { id: 'businesses',  label: 'Businesses', icon: 'People',        path: '/owner/businesses'  },
  { id: 'employees',   label: 'Employees',  icon: 'PersonAdd',     path: '/owner/employees'   },
  { id: 'reports',     label: 'Reports',    icon: 'Assessment',    path: '/owner/reports'     },
  { id: 'analytics',   label: 'Analytics',  icon: 'TrendingUp',    path: '/owner/analytics'   },
  { id: 'approvals',   label: 'Approvals',  icon: 'TaskAlt',       path: '/owner/approvals'   },
  { id: 'profile',     label: 'Profile',    icon: 'AccountCircle', path: '/owner/profile'     },
]

// Immigration Head and Vertical Manager share the same sub-pages as Owner
// but have their own dashboard entry points.
export const headMenu     = withDashboardPath(ownerMenu, '/head/dashboard')
export const verticalMenu = withDashboardPath(ownerMenu, '/vertical/dashboard')

// ─── ADMIN MODULE ─────────────────────────────────────────────────────────────

export const adminMenu = [
  { id: 'dashboard',     label: 'Dashboard',             icon: 'Dashboard',     path: '/admin/dashboard'     },
  { id: 'org-explorer',  label: 'Organization Explorer', icon: 'AccountTree',   path: '/admin/org-explorer'  },
  { id: 'users',         label: 'Users',                 icon: 'People',        path: '/admin/users'         },
  { id: 'roles',         label: 'Roles & Permissions',   icon: 'RequestQuote',  path: '/admin/roles'         },
  { id: 'audit',         label: 'Audit Logs',            icon: 'Assessment',    path: '/admin/audit'         },
  { id: 'settings',      label: 'Settings',              icon: 'Settings',      path: '/admin/settings'      },
]

export const superAdminMenu = withDashboardPath(adminMenu, '/super-admin/dashboard')
