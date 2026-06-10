import { useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu as MenuIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  DarkMode,
  LightMode,
  Add as AddIcon,
  KeyboardArrowDown,
  Message as MessageIcon,
  Check as CheckIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon,
  Home as HomeIcon,
  ChevronRight,
} from '@mui/icons-material'
import { Tooltip } from '@mui/material'
import {
  FaUserPlus,
  FaCalendarAlt,
  FaPhone,
  FaTasks,
  FaBullseye,
  FaCommentDots,
  FaCog,
  FaBullhorn,
  FaEnvelope,
  FaFileUpload,
  FaRocket,
} from 'react-icons/fa'
import { logout } from '../redux/slices/authSlice'
import { toggleTheme } from '../redux/slices/themeSlice'
import { markAllRead } from '../redux/slices/notificationSlice'
import {
  resetPerspective,
  fetchPerspectives,
  fetchCurrentPerspective,
} from '../redux/slices/perspectiveSlice'
import { getInitials, timeAgo } from '../utils'

const QUICK_ACTIONS = [
  { label: 'Add Lead', path: '/sales/leads', Icon: FaUserPlus },
  { label: 'Schedule Meeting', path: '/sales/meetings', Icon: FaCalendarAlt },
  { label: 'Create Follow Up', path: '/sales/follow-ups', Icon: FaPhone },
  { label: 'New Task', path: '/sales/tasks', Icon: FaTasks },
]

const MARKETING_QUICK_ACTIONS = [
  { label: 'Create Campaign', path: '/marketing/campaigns', Icon: FaBullhorn },
  { label: 'Schedule Email', path: '/marketing/email-marketing', Icon: FaEnvelope },
  { label: 'Upload Creative', path: '/marketing/assets', Icon: FaFileUpload },
  { label: 'Create Marketing Task', path: '/marketing/tasks', Icon: FaTasks },
  { label: 'Launch Campaign', path: '/marketing/campaigns', Icon: FaRocket },
]

const NOTIFICATION_ICON_MAP = {
  lead:    { Icon: FaUserPlus,    bg: 'bg-indigo-100 dark:bg-indigo-900/30',   cls: 'text-indigo-600 dark:text-indigo-400' },
  meeting: { Icon: FaCalendarAlt, bg: 'bg-cyan-100 dark:bg-cyan-900/30',       cls: 'text-cyan-600 dark:text-cyan-400' },
  target:  { Icon: FaBullseye,    bg: 'bg-purple-100 dark:bg-purple-900/30',   cls: 'text-purple-600 dark:text-purple-400' },
  client:  { Icon: FaCommentDots, bg: 'bg-emerald-100 dark:bg-emerald-900/30', cls: 'text-emerald-600 dark:text-emerald-400' },
  system:  { Icon: FaCog,         bg: 'bg-neutral-100 dark:bg-neutral-700',    cls: 'text-neutral-500 dark:text-neutral-400' },
}

export default function Navbar({ onToggleSidebar }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { isDark } = useSelector((s) => s.theme)
  const { user } = useSelector((s) => s.auth)
  const { list: notifications, unreadCount } = useSelector((s) => s.notifications)
  const { current: activePerspective, currentInfo } = useSelector((s) => s.perspective)

  const [search, setSearch] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(false)

  const notifRef = useRef(null)
  const profileRef = useRef(null)
  const isViewingOther = activePerspective !== null

  const dropdownClass =
    'absolute right-0 top-full mt-2 bg-white dark:bg-neutral-800 rounded-2xl shadow-card-hover border border-neutral-200 dark:border-neutral-700 z-50 overflow-hidden'

  const iconBtnClass =
    'w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center justify-center text-neutral-600 dark:text-neutral-400 transition-colors'

  const handleResetPerspective = () => {
    dispatch(resetPerspective()).then(() => {
      dispatch(fetchPerspectives())
      dispatch(fetchCurrentPerspective())
    })
  }

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-20 flex items-center gap-2 px-4 md:px-6 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 h-[72px]">
      {/* Hamburger */}
      <button
        onClick={onToggleSidebar}
        className={iconBtnClass}
        aria-label="Toggle sidebar"
      >
        <MenuIcon style={{ fontSize: 20 }} />
      </button>

      {/* Perspective breadcrumb */}
      {isViewingOther && currentInfo?.breadcrumb && (
        <div className="hidden lg:flex items-center gap-1.5 ml-1">
          <button
            onClick={handleResetPerspective}
            className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <HomeIcon style={{ fontSize: 14 }} />
          </button>
          {currentInfo.breadcrumb.map((crumb, index) => (
            <span key={crumb.id} className="flex items-center gap-1">
              <ChevronRight style={{ fontSize: 14 }} className="text-neutral-300 dark:text-neutral-600" />
              <span
                className={`text-xs font-medium ${
                  index === currentInfo.breadcrumb.length - 1
                    ? 'text-primary-700 dark:text-primary-300'
                    : 'text-neutral-500 dark:text-neutral-400'
                }`}
              >
                {crumb.label}
              </span>
            </span>
          ))}
        </div>
      )}

      {/* Perspective pill */}
      {isViewingOther && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30"
        >
          <VisibilityIcon style={{ fontSize: 13 }} className="text-amber-600 dark:text-amber-400" />
          <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 max-w-32 truncate">
            {currentInfo?.label || 'Perspective'}
          </span>
          <button
            onClick={handleResetPerspective}
            className="ml-0.5 w-4 h-4 rounded-full hover:bg-amber-200 dark:hover:bg-amber-800/40 flex items-center justify-center transition-colors"
          >
            <CloseIcon style={{ fontSize: 10 }} className="text-amber-600 dark:text-amber-400" />
          </button>
        </motion.div>
      )}

      {/* Search bar */}
      <div className="flex-1 max-w-sm md:max-w-md relative hidden md:block mx-2">
        <SearchIcon
          className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          style={{ fontSize: 17 }}
        />
        <input
          type="text"
          placeholder="Search leads, contacts, deals…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl pl-9 pr-3 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all text-neutral-900 dark:text-neutral-100"
        />
      </div>

      {/* Right actions */}
      <div className="ml-auto flex items-center gap-2">
        {/* Theme toggle */}
        <Tooltip title={isDark ? 'Light mode' : 'Dark mode'}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => dispatch(toggleTheme())}
            className={iconBtnClass}
            aria-label="Toggle theme"
          >
            {isDark
              ? <LightMode style={{ fontSize: 18 }} />
              : <DarkMode style={{ fontSize: 18 }} />}
          </motion.button>
        </Tooltip>

        {/* Messages */}
        <Tooltip title="Messages">
          <div className="relative">
            <button className={iconBtnClass} aria-label="Messages">
              <MessageIcon style={{ fontSize: 18 }} />
            </button>
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none pointer-events-none">
              3
            </span>
          </div>
        </Tooltip>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <Tooltip title="Notifications">
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications)
                  setShowProfile(false)
                  setShowQuickActions(false)
                }}
                className={iconBtnClass}
                aria-label="Notifications"
              >
                <NotificationsIcon style={{ fontSize: 18 }} />
              </button>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none pointer-events-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
          </Tooltip>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className={`${dropdownClass} w-80`}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-neutral-700">
                  <span className="font-semibold text-sm text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
                    Notifications
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-[10px] font-bold rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </span>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => dispatch(markAllRead())}
                      className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                    >
                      <CheckIcon style={{ fontSize: 13 }} />
                      Mark all read
                    </button>
                  )}
                </div>

                {/* List */}
                <div className="max-h-72 overflow-y-auto divide-y divide-neutral-50 dark:divide-neutral-700/60">
                  {notifications.slice(0, 6).map((n) => {
                    const entry = NOTIFICATION_ICON_MAP[n.type] || NOTIFICATION_ICON_MAP.system
                    const { Icon } = entry
                    return (
                      <div
                        key={n.id}
                        className={`px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-700/40 cursor-pointer transition-colors ${
                          !n.read ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''
                        }`}
                      >
                        <div className="flex gap-3 items-start">
                          <div className={`flex-shrink-0 w-9 h-9 rounded-full ${entry.bg} flex items-center justify-center`}>
                            <Icon className={entry.cls} size={14} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 flex items-center gap-1.5 leading-snug">
                              {n.title}
                              {!n.read && (
                                <span className="w-1.5 h-1.5 rounded-full bg-primary-600 inline-block flex-shrink-0" />
                              )}
                            </p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-1">{n.message}</p>
                            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1">{timeAgo(n.time)}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Footer */}
                <div className="px-4 py-2.5 border-t border-neutral-100 dark:border-neutral-700 text-center">
                  <button className="text-xs text-primary-600 dark:text-primary-400 font-semibold hover:underline">
                    View all notifications
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Quick Add */}
        <div className="relative">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setShowQuickActions(!showQuickActions)
              setShowNotifications(false)
              setShowProfile(false)
            }}
            className="h-9 px-4 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-brand active:scale-95"
          >
            <AddIcon style={{ fontSize: 18 }} />
            <span className="hidden sm:inline">Quick Add</span>
          </motion.button>

          <AnimatePresence>
            {showQuickActions && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className={`${dropdownClass} w-52`}
              >
                <div className="py-1">
                  {(() => {
                    const isMarketing = user?.role === 'Marketing Executive'
                    const actionsList = isMarketing ? MARKETING_QUICK_ACTIONS : QUICK_ACTIONS
                    return actionsList.map((a) => (
                      <button
                        key={a.label}
                        onClick={() => {
                          navigate(a.path)
                          setShowQuickActions(false)
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 text-left text-sm text-neutral-700 dark:text-neutral-300 transition-colors"
                      >
                        <a.Icon className="text-neutral-400 flex-shrink-0" size={13} />
                        <span className="font-medium">{a.label}</span>
                      </button>
                    ))
                  })()}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => {
              setShowProfile(!showProfile)
              setShowNotifications(false)
              setShowQuickActions(false)
            }}
            className="flex items-center gap-2.5 pl-1 pr-3 h-10 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {getInitials(user?.name)}
            </div>
            <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 hidden sm:block leading-none">
              {user?.name?.split(' ')[0]}
            </span>
            <KeyboardArrowDown style={{ fontSize: 16 }} className="text-neutral-400 hidden sm:block" />
          </button>

          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className={`${dropdownClass} w-56`}
              >
                {/* User info header */}
                <div className="px-4 py-3.5 border-b border-neutral-100 dark:border-neutral-700">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {getInitials(user?.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-neutral-800 dark:text-neutral-100 truncate leading-tight">
                        {user?.name}
                      </p>
                      <p className="text-xs text-neutral-400 dark:text-neutral-500 truncate leading-tight mt-0.5">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  <span className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400">
                    {user?.role}
                  </span>
                </div>

                {/* Profile menu items */}
                <div className="py-1">
                  {(() => {
                    const activeModule = location.pathname.split('/').filter(Boolean)[0] || 'sales'
                    const profileItems = [
                      { icon: <PersonIcon style={{ fontSize: 17 }} />, label: 'View Profile', path: `/${activeModule}/profile` },
                      { icon: <SettingsIcon style={{ fontSize: 17 }} />, label: 'Settings', path: `/${activeModule}/settings` },
                    ]
                    return profileItems.map((item) => (
                      <button
                        key={item.label}
                        onClick={() => {
                          navigate(item.path)
                          setShowProfile(false)
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 text-left text-sm text-neutral-700 dark:text-neutral-300 transition-colors"
                      >
                        <span className="text-neutral-400 dark:text-neutral-500">{item.icon}</span>
                        <span className="font-medium">{item.label}</span>
                      </button>
                    ))
                  })()}
                </div>

                {/* Logout */}
                <div className="border-t border-neutral-100 dark:border-neutral-700 py-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-left text-sm text-red-600 dark:text-red-400 transition-colors"
                  >
                    <LogoutIcon style={{ fontSize: 17 }} />
                    <span className="font-medium">Sign out</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}
