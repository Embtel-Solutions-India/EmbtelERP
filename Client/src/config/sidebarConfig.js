// ─── HELPERS ─────────────────────────────────────────────────────────────────
// First path segment of a route, e.g. '/documentation/dashboard' -> 'documentation'
function moduleFromPath(routePath) {
  return routePath.split('/').filter(Boolean)[0]
}

// Creates a copy of a menu with the Dashboard item pointing to a different path.
// Calendar/Audit stay on their shared routes (the only ones mounted in App.jsx).
function withDashboardPath(menu, dashPath) {
  return menu.map(item => (item.id === 'dashboard' ? { ...item, path: dashPath } : item))
}

// ─── SALES MODULE MENUS ──────────────────────────────────────────────────────

export const salesInternMenu = [
  { id: 'dashboard',   label: 'Dashboard',   icon: 'Dashboard',     path: '/sales-intern/dashboard' },
  { id: 'leads',       label: 'My Leads',    icon: 'PersonAdd',     path: '/sales/leads'            },
  { id: 'follow-ups',  label: 'Follow Ups',  icon: 'PhoneCallback', path: '/sales/follow-ups'       },
  { id: 'tasks',       label: 'Tasks',       icon: 'TaskAlt',       path: '/sales/tasks'            },
  { id: 'targets',     label: 'My Targets',  icon: 'Leaderboard',   path: '/sales/targets'          },
  { id: 'audit',       label: 'Audit Logs',  icon: 'Assessment',    path: '/audit'                  },
  { id: 'calendar',    label: 'Calendar',    icon: 'CalendarMonth', path: '/calendar'                },
  { id: 'profile',     label: 'Profile',     icon: 'AccountCircle', path: '/sales/profile'          },
]

export const salesExecutiveMenu = [
  { id: 'dashboard',     label: 'Dashboard',     icon: 'Dashboard',     path: '/sales/dashboard'     },
  { id: 'leads',         label: 'Leads',         icon: 'PersonAdd',     path: '/sales/leads'         },
  { id: 'follow-ups',    label: 'Follow Ups',    icon: 'PhoneCallback', path: '/sales/follow-ups'    },
  { id: 'meetings',      label: 'Meetings',      icon: 'VideoCall',     path: '/sales/meetings'      },
  { id: 'customers',     label: 'Customers',     icon: 'People',        path: '/sales/customers'     },
  { id: 'tasks',         label: 'Tasks',         icon: 'TaskAlt',       path: '/sales/tasks'         },
  { id: 'targets',       label: 'My Targets',    icon: 'Leaderboard',   path: '/sales/targets'       },
  { id: 'performance',   label: 'Performance',   icon: 'Leaderboard',   path: '/sales/performance'   },
  { id: 'audit',         label: 'Audit Logs',    icon: 'Assessment',    path: '/audit'               },
  { id: 'calendar',      label: 'Calendar',      icon: 'CalendarMonth', path: '/calendar'            },
  { id: 'profile',       label: 'Profile',       icon: 'AccountCircle', path: '/sales/profile'       },
]

export const salesHeadMenu = [
  { id: 'dashboard',      label: 'Dashboard',       icon: 'Dashboard',     path: '/sales-manager/dashboard' },
  { id: 'team',           label: 'Team',            icon: 'People',        path: '/sales/team'              },
  { id: 'tasks',          label: 'Tasks',           icon: 'TaskAlt',       path: '/sales/tasks'             },
  { id: 'leads',          label: 'Lead Assignment', icon: 'PersonAdd',     path: '/sales/leads'             },
  { id: 'targets',        label: 'Targets',         icon: 'Leaderboard',   path: '/sales/targets'           },
  { id: 'performance',    label: 'Performance',     icon: 'Leaderboard',   path: '/sales/performance'       },
  { id: 'reports',        label: 'Reports',         icon: 'Assessment',    path: '/sales/reports'           },
  { id: 'approvals',      label: 'Approvals',       icon: 'TaskAlt',       path: '/sales/approvals'         },
  { id: 'audit',          label: 'Audit Logs',      icon: 'Assessment',    path: '/audit'                   },
  { id: 'calendar',       label: 'Calendar',        icon: 'CalendarMonth', path: '/calendar'                },
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
  { id: 'audit',      label: 'Audit Logs', icon: 'Assessment',    path: '/audit'                      },
  { id: 'calendar',   label: 'Calendar',   icon: 'CalendarMonth', path: '/calendar'                   },
  { id: 'profile',    label: 'Profile',    icon: 'AccountCircle', path: '/marketing/profile'          },
]

export const marketingExecutiveMenu = [
  { id: 'dashboard',       label: 'Dashboard',       icon: 'Dashboard',     path: '/marketing/dashboard'       },
  { id: 'campaigns',       label: 'Campaigns',        icon: 'TrendingUp',    path: '/marketing/campaigns'       },
  { id: 'leads',           label: 'Lead Funnels',     icon: 'PersonAdd',     path: '/marketing/leads'           },
  { id: 'email-marketing', label: 'Email Marketing',  icon: 'Assessment',    path: '/marketing/email-marketing' },
  { id: 'assets',          label: 'Assets & Content', icon: 'RequestQuote',  path: '/marketing/assets'          },
  { id: 'tasks',           label: 'Tasks',            icon: 'TaskAlt',       path: '/marketing/tasks'           },
  { id: 'audit',           label: 'Audit Logs',       icon: 'Assessment',    path: '/audit'                     },
  { id: 'performance',     label: 'Performance',      icon: 'Leaderboard',   path: '/marketing/performance'     },
  { id: 'reports',         label: 'Reports',          icon: 'Assessment',    path: '/marketing/reports'         },
  { id: 'calendar',        label: 'Calendar',         icon: 'CalendarMonth', path: '/marketing/calendar'        },
  { id: 'profile',         label: 'Profile',          icon: 'AccountCircle', path: '/marketing/profile'         },
]

export const marketingManagerMenu = [
  { id: 'dashboard',       label: 'Dashboard',       icon: 'Dashboard',     path: '/marketing-manager/dashboard' },
  { id: 'campaigns',       label: 'Campaigns',        icon: 'TrendingUp',    path: '/marketing/campaigns'         },
  { id: 'team',            label: 'Team',             icon: 'People',        path: '/marketing/team'              },
  { id: 'tasks',           label: 'Tasks',            icon: 'TaskAlt',       path: '/marketing/tasks'             },
  { id: 'leads',           label: 'Lead Funnels',     icon: 'PersonAdd',     path: '/marketing/leads'             },
  { id: 'performance',     label: 'Performance',      icon: 'Leaderboard',   path: '/marketing/performance'       },
  { id: 'approvals',       label: 'Approvals',        icon: 'TaskAlt',       path: '/marketing/approvals'         },
  { id: 'reports',         label: 'Reports',          icon: 'Assessment',    path: '/marketing/reports'           },
  { id: 'audit',           label: 'Audit Logs',       icon: 'Assessment',    path: '/audit'                       },
  { id: 'calendar',        label: 'Calendar',         icon: 'CalendarMonth', path: '/calendar'                    },
  { id: 'profile',         label: 'Profile',          icon: 'AccountCircle', path: '/marketing/profile'           },
]

// Legacy alias
export const marketingMenu = marketingExecutiveMenu

// ─── PRODUCTION (Documentation) MODULE ───────────────────────────────────────

export const productionInternMenu = [
  { id: 'dashboard',   label: 'Dashboard',  icon: 'Dashboard',     path: '/production/dashboard'  },
  { id: 'documents',   label: 'Documents',  icon: 'Assessment',    path: '/production/documents'  },
  { id: 'tasks',       label: 'Tasks',      icon: 'TaskAlt',       path: '/production/tasks'      },
  { id: 'audit',       label: 'Audit Logs', icon: 'Assessment',    path: '/audit'                 },
  { id: 'calendar',    label: 'Calendar',   icon: 'CalendarMonth', path: '/calendar'              },
  { id: 'profile',     label: 'Profile',    icon: 'AccountCircle', path: '/production/profile'    },
]

export const productionExecutiveMenu = [
  { id: 'dashboard',     label: 'Dashboard',    icon: 'Dashboard',     path: '/production/dashboard'    },
  { id: 'cases',         label: 'Cases',        icon: 'RequestQuote',  path: '/production/cases'        },
  { id: 'documents',     label: 'Documents',    icon: 'Assessment',    path: '/production/documents'    },
  { id: 'verification',  label: 'Verification', icon: 'TrendingUp',    path: '/production/verification' },
  { id: 'tasks',         label: 'Tasks',        icon: 'TaskAlt',       path: '/production/tasks'        },
  { id: 'reports',       label: 'Reports',      icon: 'Leaderboard',   path: '/production/reports'      },
  { id: 'audit',         label: 'Audit Logs',   icon: 'Assessment',    path: '/audit'                   },
  { id: 'calendar',      label: 'Calendar',     icon: 'CalendarMonth', path: '/calendar'                },
  { id: 'profile',       label: 'Profile',      icon: 'AccountCircle', path: '/production/profile'      },
]

export const productionManagerMenu = [
  { id: 'dashboard',    label: 'Dashboard', icon: 'Dashboard',     path: '/production/dashboard'  },
  { id: 'cases',        label: 'Cases',     icon: 'RequestQuote',  path: '/production/cases'      },
  { id: 'tasks',        label: 'Tasks',     icon: 'TaskAlt',       path: '/production/tasks'      },
  { id: 'approvals',    label: 'Approvals', icon: 'TaskAlt',       path: '/production/approvals'  },
  { id: 'team',         label: 'Team',      icon: 'People',        path: '/production/team'       },
  { id: 'reports',      label: 'Reports',   icon: 'Assessment',    path: '/production/reports'    },
  { id: 'audit',        label: 'Audit Logs', icon: 'Assessment',   path: '/audit'                 },
  { id: 'calendar',     label: 'Calendar',  icon: 'CalendarMonth', path: '/calendar'              },
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
  { id: 'dashboard', label: 'Dashboard',  icon: 'Dashboard',     path: '/evaluation/dashboard' },
  { id: 'audit',     label: 'Audit Logs', icon: 'Assessment',    path: '/audit'                },
  { id: 'calendar',  label: 'Calendar',   icon: 'CalendarMonth', path: '/calendar'             },
]

export const headEvaluationMenu = [
  { id: 'dashboard',    label: 'Dashboard',    icon: 'Dashboard',     path: '/head-evaluation/dashboard' },
  { id: 'evaluations',  label: 'Evaluations',  icon: 'Assessment',    path: '/evaluation/cases'          },
  { id: 'team',         label: 'Team',         icon: 'People',        path: '/evaluation/team'           },
  { id: 'performance',  label: 'Performance',  icon: 'Leaderboard',   path: '/evaluation/performance'    },
  { id: 'approvals',    label: 'Approvals',    icon: 'TaskAlt',       path: '/evaluation/approvals'      },
  { id: 'reports',      label: 'Reports',      icon: 'TrendingUp',    path: '/evaluation/reports'        },
  { id: 'audit',        label: 'Audit Logs',   icon: 'Assessment',    path: '/audit'                     },
  { id: 'calendar',     label: 'Calendar',     icon: 'CalendarMonth', path: '/calendar'                  },
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
  { id: 'audit',        label: 'Audit Logs',   icon: 'Assessment',    path: '/audit'           },
  { id: 'calendar',     label: 'Calendar',     icon: 'CalendarMonth', path: '/calendar'        },
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
  { id: 'audit',       label: 'Audit Logs', icon: 'Assessment',    path: '/audit'             },
  { id: 'calendar',    label: 'Calendar',   icon: 'CalendarMonth', path: '/calendar'          },
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
  { id: 'audit',       label: 'Audit Logs',   icon: 'Assessment',    path: '/audit'             },
  { id: 'calendar',    label: 'Calendar',     icon: 'CalendarMonth', path: '/calendar'          },
  { id: 'profile',     label: 'Profile',      icon: 'AccountCircle', path: '/head/profile'      },
]
// Vertical Manager: owner-style menu + a Targets entry for the target system.
const verticalBase = withDashboardPath(ownerMenu, '/vertical/dashboard')
export const verticalMenu = [
  verticalBase[0],
  { id: 'targets', label: 'Targets', icon: 'Leaderboard', path: '/sales/targets' },
  ...verticalBase.slice(1),
]

// ─── IT DEVELOPMENT MODULE (isolated) ─────────────────────────────────────────
// Mirrors the mockup: an IT-team nav group + a Reporting group. The non-Overview
// items are stubs that point at the dashboard (their backends are not built yet).
export const itMenu = [
  { id: 'dashboard',    label: 'Overview',         icon: 'Dashboard',     path: '/it/dashboard'    },
  { id: 'tasks',        label: 'My tasks',         icon: 'TaskAlt',       path: '/it/tasks'        },
  { id: 'tickets',      label: 'Tickets',          icon: 'RequestQuote',  path: '/it/tickets'      },
  { id: 'credentials',  label: 'Credential vault', icon: 'Settings',      path: '/it/credentials'  },
  { id: 'productivity', label: 'Dev productivity', icon: 'TrendingUp',    path: '/it/productivity' },
  { id: 'reviews',      label: 'Code reviews',     icon: 'Assessment',    path: '/it/code-reviews' },
  { id: 'audit',        label: 'Audit Logs',       icon: 'Assessment',    path: '/audit'           },
  { id: 'calendar',     label: 'Calendar',         icon: 'CalendarMonth', path: '/calendar'        },
  { id: 'profile',      label: 'Profile',          icon: 'AccountCircle', path: '/it/dashboard'    },
]

// ─── ADMIN MODULE ─────────────────────────────────────────────────────────────

export const adminMenu = [
  { id: 'dashboard',     label: 'Dashboard',             icon: 'Dashboard',     path: '/admin/dashboard'     },
  { id: 'org-explorer',  label: 'Organization Explorer', icon: 'AccountTree',   path: '/admin/org-explorer'  },
  { id: 'users',         label: 'Users',                 icon: 'People',        path: '/admin/users'         },
  { id: 'roles',         label: 'Roles & Permissions',   icon: 'RequestQuote',  path: '/admin/roles'         },
  { id: 'audit',         label: 'Audit Logs',            icon: 'Assessment',    path: '/audit'               },
  { id: 'calendar',      label: 'Calendar',              icon: 'CalendarMonth', path: '/calendar'            },
  { id: 'settings',      label: 'Settings',              icon: 'Settings',      path: '/admin/settings'      },
]

export const superAdminMenu = withDashboardPath(adminMenu, '/super-admin/dashboard')

// ─── Calendar route scoping ──────────────────────────────────────────────────
// The calendar is a strictly personal, per-role screen. Each menu's Calendar entry
// opens its own module-scoped route (e.g. /sales/calendar, /head/calendar) — all
// mounted in App.jsx. Keeping the calendar inside the module namespace preserves
// hierarchy context so the sidebar's Dashboard link returns to the correct role
// dashboard (never bounces to /sales/dashboard). Never link to the bare /calendar.
function scopeCalendarRoute(menu) {
  const dash = menu.find((i) => i.id === 'dashboard')
  const cal  = menu.find((i) => i.id === 'calendar')
  if (dash && cal) cal.path = `/${moduleFromPath(dash.path)}/calendar`
  return menu
}

;[
  salesInternMenu, salesExecutiveMenu, salesHeadMenu,
  marketingInternMenu, marketingExecutiveMenu, marketingManagerMenu,
  productionInternMenu, productionExecutiveMenu, productionManagerMenu,
  documentationInternMenu, documentationExecutiveMenu, documentationManagerMenu,
  evaluationMenu, headEvaluationMenu, professorMenu,
  hrMenu, hrExecutiveMenu, recruitmentMenu,
  ownerMenu, headMenu, verticalMenu,
  adminMenu, superAdminMenu,
].forEach(scopeCalendarRoute)
