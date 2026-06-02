export const APP_NAME = 'CRM Pro'

export const PIPELINE_COLUMNS = [
  { id: 'new',         label: 'New Leads',     color: '#6366f1' },
  { id: 'contacted',   label: 'Contacted',     color: '#f59e0b' },
  { id: 'qualified',   label: 'Qualified',     color: '#06b6d4' },
  { id: 'proposal',    label: 'Proposal Sent', color: '#8b5cf6' },
  { id: 'negotiation', label: 'Negotiation',   color: '#ec4899' },
  { id: 'won',         label: 'Won',           color: '#10b981' },
]

export const MOTIVATIONAL_QUOTES = [
  '"Success is not final; failure is not fatal: it is the courage to continue that counts." — Winston Churchill',
  '"The harder the conflict, the more glorious the triumph." — Thomas Paine',
  '"Your time is limited, don\'t waste it living someone else\'s life." — Steve Jobs',
  '"Either you run the day or the day runs you." — Jim Rohn',
  '"The secret of getting ahead is getting started." — Mark Twain',
  '"Winners never quit and quitters never win." — Vince Lombardi',
]

export const NAV_ITEMS = [
  { id: 'dashboard',     label: 'Dashboard',    icon: 'Dashboard',     path: '/dashboard'     },
  { id: 'leads',         label: 'Leads',        icon: 'PersonAdd',     path: '/leads'         },
  { id: 'follow-ups',    label: 'Follow Ups',     icon: 'PhoneCallback', path: '/follow-ups'    },
  { id: 'meetings',      label: 'Meetings',       icon: 'VideoCall',     path: '/meetings'      },
  { id: 'customers',     label: 'Customers',      icon: 'People',        path: '/customers'     },
  { id: 'opportunities', label: 'Opportunities',  icon: 'TrendingUp',    path: '/opportunities' },
  { id: 'tasks',         label: 'Tasks',          icon: 'TaskAlt',       path: '/tasks'         },
  { id: 'performance',   label: 'Performance',    icon: 'Leaderboard',   path: '/performance'   },
  { id: 'reports',       label: 'Reports',        icon: 'Assessment',    path: '/reports'       },
  { id: 'profile',       label: 'Profile',        icon: 'AccountCircle', path: '/profile'       },
  { id: 'settings',      label: 'Settings',       icon: 'Settings',      path: '/settings'      },
]

export const MARKETING_PIPELINE_COLUMNS = [
  { id: 'Draft',     label: 'Draft',     color: '#6366f1' },
  { id: 'Active',    label: 'Active',    color: '#10b981' },
  { id: 'Paused',    label: 'Paused',    color: '#f59e0b' },
  { id: 'Completed', label: 'Completed', color: '#06b6d4' },
  { id: 'Archived',  label: 'Archived',  color: '#ef4444' },
]

export const MARKETING_NAV_ITEMS = [
  { id: 'dashboard',       label: 'Dashboard',       icon: 'Dashboard',     path: '/marketing/dashboard'       },
  { id: 'leads',           label: 'Leads',           icon: 'PersonAdd',     path: '/marketing/leads'           },
  { id: 'activities',      label: 'Activities',      icon: 'PhoneCallback', path: '/marketing/activities'      },
  { id: 'email-marketing', label: 'Email Marketing', icon: 'VideoCall',     path: '/marketing/email-marketing' },
  { id: 'assets',          label: 'Asset Library',   icon: 'People',        path: '/marketing/assets'          },
  { id: 'campaigns',       label: 'Campaigns',       icon: 'TrendingUp',    path: '/marketing/campaigns'       },
  { id: 'tasks',           label: 'Tasks',           icon: 'TaskAlt',       path: '/marketing/tasks'           },
  { id: 'performance',     label: 'Performance',     icon: 'Leaderboard',   path: '/marketing/performance'     },
  { id: 'reports',         label: 'Reports',         icon: 'Assessment',    path: '/marketing/reports'         },
  { id: 'profile',         label: 'Profile',         icon: 'AccountCircle', path: '/profile'                   },
  { id: 'settings',        label: 'Settings',        icon: 'Settings',      path: '/settings'                  },
]
