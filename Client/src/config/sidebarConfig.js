// ─── HELPERS ─────────────────────────────────────────────────────────────────
// First path segment of a route, e.g. '/documentation/dashboard' -> 'documentation'
function moduleFromPath(routePath) {
  return routePath.split('/').filter(Boolean)[0]
}

// Creates a copy of a menu with the Dashboard item pointing to a different path.
// The Calendar item is also re-scoped to the same module so navigating to the
// calendar keeps the user inside their own route namespace (hierarchy context).
function withDashboardPath(menu, dashPath) {
  const mod = moduleFromPath(dashPath)
  return menu.map(item => {
    if (item.id === 'dashboard') return { ...item, path: dashPath }
    if (item.id === 'calendar')  return { ...item, path: `/${mod}/calendar` }
    return item
  })
}

// ─── SALES MODULE MENUS ──────────────────────────────────────────────────────

export const salesInternMenu = [
  { id: 'dashboard',   label: 'Dashboard',   icon: 'Dashboard',     path: '/sales-intern/dashboard' },
  { id: 'leads',       label: 'My Leads',    icon: 'PersonAdd',     path: '/sales/leads'            },
  { id: 'follow-ups',  label: 'Follow Ups',  icon: 'PhoneCallback', path: '/sales/follow-ups'       },
  { id: 'tasks',       label: 'Tasks',       icon: 'TaskAlt',       path: '/sales/tasks'            },
  { id: 'activities',  label: 'Activities',  icon: 'CalendarMonth', path: '/sales/activities'       },
  { id: 'calendar',    label: 'Calendar',    icon: 'CalendarMonth', path: '/sales-intern/calendar'  },
  { id: 'profile',     label: 'Profile',     icon: 'AccountCircle', path: '/sales/profile'          },
]

export const salesExecutiveMenu = [
  { id: 'dashboard',     label: 'Dashboard',     icon: 'Dashboard',     path: '/sales/dashboard'     },
  { id: 'overview',      label: 'My Overview',   icon: 'Leaderboard',   path: '/sales/overview'      },
  { id: 'leads',         label: 'Leads',         icon: 'PersonAdd',     path: '/sales/leads'         },
  { id: 'add-lead',      label: 'Add Lead',      icon: 'PersonAdd',     path: '/sales/add-lead'      },
  { id: 'follow-ups',    label: 'Follow Ups',    icon: 'PhoneCallback', path: '/sales/follow-ups'    },
  { id: 'meetings',      label: 'Meetings',      icon: 'VideoCall',     path: '/sales/meetings'      },
  { id: 'customers',     label: 'Customers',     icon: 'People',        path: '/sales/customers'     },
  { id: 'tasks',         label: 'Tasks',         icon: 'TaskAlt',       path: '/sales/tasks'         },
  { id: 'new-task',      label: 'New Task',      icon: 'TaskAlt',       path: '/sales/tasks/new'     },
  { id: 'activities',    label: 'Activities',    icon: 'CalendarMonth', path: '/sales/activities'    },
  { id: 'performance',   label: 'Performance',   icon: 'Leaderboard',   path: '/sales/performance'   },
  { id: 'calendar',      label: 'Calendar',      icon: 'CalendarMonth', path: '/sales/calendar'      },
  { id: 'profile',       label: 'Profile',       icon: 'AccountCircle', path: '/sales/profile'       },
]

export const salesHeadMenu = [
  { id: 'dashboard',      label: 'Dashboard',       icon: 'Dashboard',     path: '/sales-manager/dashboard' },
  { id: 'team',           label: 'Team',            icon: 'People',        path: '/sales/team'              },
  { id: 'leads',          label: 'Lead Assignment', icon: 'PersonAdd',     path: '/sales/leads'             },
  { id: 'performance',    label: 'Performance',     icon: 'Leaderboard',   path: '/sales/performance'       },
  { id: 'reports',        label: 'Reports',         icon: 'Assessment',    path: '/sales/reports'           },
  { id: 'approvals',      label: 'Approvals',       icon: 'TaskAlt',       path: '/sales/approvals'         },
  { id: 'calendar',       label: 'Calendar',        icon: 'CalendarMonth', path: '/sales-manager/calendar'  },
  { id: 'profile',        label: 'Profile',         icon: 'AccountCircle', path: '/sales/profile'           },
]

// Legacy alias — kept for any remaining callers
export const salesMenu = salesExecutiveMenu

// ─── MARKETING MODULE MENUS ──────────────────────────────────────────────────

export const marketingInternMenu = [
  { id: 'dashboard',  label: 'Dashboard',  icon: 'Dashboard',     path: '/marketing-intern/dashboard' },
  { id: 'tasks',      label: 'Tasks',      icon: 'TaskAlt',       path: '/marketing/tasks'            },
  { id: 'campaigns',  label: 'Campaigns',  icon: 'TrendingUp',    path: '/marketing/campaigns'        },
  { id: 'assets',     label: 'Content',    icon: 'RequestQuote',  path: '/marketing/assets'           },
  { id: 'activities', label: 'Activities', icon: 'CalendarMonth', path: '/marketing/activities'       },
  { id: 'calendar',   label: 'Calendar',   icon: 'CalendarMonth', path: '/marketing-intern/calendar'  },
  { id: 'profile',    label: 'Profile',    icon: 'AccountCircle', path: '/marketing/profile'          },
]

export const marketingExecutiveMenu = [
  { id: 'dashboard',       label: 'Dashboard',       icon: 'Dashboard',     path: '/marketing/dashboard'       },
  { id: 'campaigns',       label: 'Campaigns',        icon: 'TrendingUp',    path: '/marketing/campaigns'       },
  { id: 'leads',           label: 'Lead Funnels',     icon: 'PersonAdd',     path: '/marketing/leads'           },
  { id: 'email-marketing', label: 'Email Marketing',  icon: 'Assessment',    path: '/marketing/email-marketing' },
  { id: 'assets',          label: 'Assets & Content', icon: 'RequestQuote',  path: '/marketing/assets'          },
  { id: 'tasks',           label: 'Tasks',            icon: 'TaskAlt',       path: '/marketing/tasks'           },
  { id: 'activities',      label: 'Activities',       icon: 'CalendarMonth', path: '/marketing/activities'      },
  { id: 'performance',     label: 'Performance',      icon: 'Leaderboard',   path: '/marketing/performance'     },
  { id: 'reports',         label: 'Reports',          icon: 'Assessment',    path: '/marketing/reports'         },
  { id: 'calendar',        label: 'Calendar',         icon: 'CalendarMonth', path: '/marketing/calendar'        },
  { id: 'profile',         label: 'Profile',          icon: 'AccountCircle', path: '/marketing/profile'         },
]

export const marketingManagerMenu = [
  { id: 'dashboard',       label: 'Dashboard',       icon: 'Dashboard',     path: '/marketing-manager/dashboard' },
  { id: 'campaigns',       label: 'Campaigns',        icon: 'TrendingUp',    path: '/marketing/campaigns'         },
  { id: 'team',            label: 'Team',             icon: 'People',        path: '/marketing/team'              },
  { id: 'leads',           label: 'Lead Funnels',     icon: 'PersonAdd',     path: '/marketing/leads'             },
  { id: 'performance',     label: 'Performance',      icon: 'Leaderboard',   path: '/marketing/performance'       },
  { id: 'approvals',       label: 'Approvals',        icon: 'TaskAlt',       path: '/marketing/approvals'         },
  { id: 'reports',         label: 'Reports',          icon: 'Assessment',    path: '/marketing/reports'           },
  { id: 'activities',      label: 'Activities',       icon: 'CalendarMonth', path: '/marketing/activities'        },
  { id: 'calendar',        label: 'Calendar',         icon: 'CalendarMonth', path: '/marketing-manager/calendar'  },
  { id: 'profile',         label: 'Profile',          icon: 'AccountCircle', path: '/marketing/profile'           },
]

// Legacy alias
export const marketingMenu = marketingExecutiveMenu

// ─── PRODUCTION (Documentation) MODULE ───────────────────────────────────────

export const productionInternMenu = [
  { id: 'dashboard',   label: 'Dashboard',  icon: 'Dashboard',     path: '/production/dashboard'  },
  { id: 'documents',   label: 'Documents',  icon: 'Assessment',    path: '/production/documents'  },
  { id: 'tasks',       label: 'Tasks',      icon: 'TaskAlt',       path: '/production/tasks'      },
  { id: 'calendar',    label: 'Calendar',   icon: 'CalendarMonth', path: '/production/calendar'   },
  { id: 'profile',     label: 'Profile',    icon: 'AccountCircle', path: '/production/profile'    },
]

export const productionExecutiveMenu = [
  { id: 'dashboard',     label: 'Dashboard',    icon: 'Dashboard',     path: '/production/dashboard'    },
  { id: 'cases',         label: 'Cases',        icon: 'RequestQuote',  path: '/production/cases'        },
  { id: 'documents',     label: 'Documents',    icon: 'Assessment',    path: '/production/documents'    },
  { id: 'verification',  label: 'Verification', icon: 'TrendingUp',    path: '/production/verification' },
  { id: 'tasks',         label: 'Tasks',        icon: 'TaskAlt',       path: '/production/tasks'        },
  { id: 'reports',       label: 'Reports',      icon: 'Leaderboard',   path: '/production/reports'      },
  { id: 'calendar',      label: 'Calendar',     icon: 'CalendarMonth', path: '/production/calendar'     },
  { id: 'profile',       label: 'Profile',      icon: 'AccountCircle', path: '/production/profile'      },
]

export const productionManagerMenu = [
  { id: 'dashboard',    label: 'Dashboard', icon: 'Dashboard',     path: '/production/dashboard'  },
  { id: 'cases',        label: 'Cases',     icon: 'RequestQuote',  path: '/production/cases'      },
  { id: 'approvals',    label: 'Approvals', icon: 'TaskAlt',       path: '/production/approvals'  },
  { id: 'team',         label: 'Team',      icon: 'People',        path: '/production/team'       },
  { id: 'reports',      label: 'Reports',   icon: 'Assessment',    path: '/production/reports'    },
  { id: 'calendar',     label: 'Calendar',  icon: 'CalendarMonth', path: '/production/calendar'   },
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
  { id: 'dashboard', label: 'Dashboard', icon: 'Dashboard',     path: '/evaluation/dashboard' },
  { id: 'calendar',  label: 'Calendar',  icon: 'CalendarMonth', path: '/evaluation/calendar'  },
]

export const headEvaluationMenu = [
  { id: 'dashboard',    label: 'Dashboard',    icon: 'Dashboard',     path: '/head-evaluation/dashboard' },
  { id: 'evaluations',  label: 'Evaluations',  icon: 'Assessment',    path: '/evaluation/cases'          },
  { id: 'team',         label: 'Team',         icon: 'People',        path: '/evaluation/team'           },
  { id: 'performance',  label: 'Performance',  icon: 'Leaderboard',   path: '/evaluation/performance'    },
  { id: 'approvals',    label: 'Approvals',    icon: 'TaskAlt',       path: '/evaluation/approvals'      },
  { id: 'reports',      label: 'Reports',      icon: 'TrendingUp',    path: '/evaluation/reports'        },
  { id: 'calendar',     label: 'Calendar',     icon: 'CalendarMonth', path: '/head-evaluation/calendar'  },
  { id: 'profile',      label: 'Profile',      icon: 'AccountCircle', path: '/evaluation/profile'        },
]
export const professorMenu      = withDashboardPath(evaluationMenu, '/professor/dashboard')

// ─── HR MODULE ────────────────────────────────────────────────────────────────

export const hrMenu = [
  { id: 'dashboard',    label: 'Dashboard',    icon: 'Dashboard',     path: '/hr/dashboard'    },
  { id: 'employees',    label: 'Employees',    icon: 'People',        path: '/hr/employees'    },
  { id: 'recruitment',  label: 'Recruitment',  icon: 'PersonAdd',     path: '/hr/recruitment'  },
  { id: 'attendance',   label: 'Attendance',   icon: 'CalendarMonth', path: '/hr/attendance'   },
  { id: 'performance',  label: 'Performance',  icon: 'Leaderboard',   path: '/hr/performance'  },
  { id: 'reports',      label: 'Reports',      icon: 'Assessment',    path: '/hr/reports'      },
  { id: 'calendar',     label: 'Calendar',     icon: 'CalendarMonth', path: '/hr/calendar'     },
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
  { id: 'calendar',    label: 'Calendar',   icon: 'CalendarMonth', path: '/owner/calendar'    },
  { id: 'profile',     label: 'Profile',    icon: 'AccountCircle', path: '/owner/profile'     },
]

// Immigration Head has its own tailored menu with dedicated /head/* routes.
export const headMenu = [
  { id: 'dashboard',   label: 'Dashboard',    icon: 'Dashboard',     path: '/head/dashboard'    },
  { id: 'cases',       label: 'Active Cases', icon: 'RequestQuote',  path: '/head/cases'        },
  { id: 'team',        label: 'Team',         icon: 'People',        path: '/head/employees'    },
  { id: 'leads',       label: 'Lead Funnel',  icon: 'PersonAdd',     path: '/head/businesses'   },
  { id: 'performance', label: 'Performance',  icon: 'Leaderboard',   path: '/head/analytics'    },
  { id: 'reports',     label: 'Reports',      icon: 'Assessment',    path: '/head/reports'      },
  { id: 'approvals',   label: 'Approvals',    icon: 'TaskAlt',       path: '/head/approvals'    },
  { id: 'calendar',    label: 'Calendar',     icon: 'CalendarMonth', path: '/head/calendar'     },
  { id: 'profile',     label: 'Profile',      icon: 'AccountCircle', path: '/head/profile'      },
]
export const verticalMenu = withDashboardPath(ownerMenu, '/vertical/dashboard')

// ─── ADMIN MODULE ─────────────────────────────────────────────────────────────

export const adminMenu = [
  { id: 'dashboard',     label: 'Dashboard',             icon: 'Dashboard',     path: '/admin/dashboard'     },
  { id: 'org-explorer',  label: 'Organization Explorer', icon: 'AccountTree',   path: '/admin/org-explorer'  },
  { id: 'users',         label: 'Users',                 icon: 'People',        path: '/admin/users'         },
  { id: 'roles',         label: 'Roles & Permissions',   icon: 'RequestQuote',  path: '/admin/roles'         },
  { id: 'audit',         label: 'Audit Logs',            icon: 'Assessment',    path: '/admin/audit'         },
  { id: 'calendar',      label: 'Calendar',              icon: 'CalendarMonth', path: '/admin/calendar'      },
  { id: 'settings',      label: 'Settings',              icon: 'Settings',      path: '/admin/settings'      },
]

export const superAdminMenu = withDashboardPath(adminMenu, '/super-admin/dashboard')
