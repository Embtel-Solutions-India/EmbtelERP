import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useSelector } from 'react-redux'
import {
  Dashboard, PersonAdd, PhoneCallback, VideoCall, People, TrendingUp,
  RequestQuote, TaskAlt, CalendarMonth, Leaderboard, Assessment,
  AccountCircle, Settings,
} from '@mui/icons-material'
import {
  salesMenu,
  marketingMenu,
  productionMenu,
  evaluationMenu,
  hrMenu,
  ownerMenu,
  adminMenu,
} from '../config/sidebarConfig'
import { APP_NAME } from '../constants'
import { getInitials } from '../utils'

const ICON_MAP = {
  Dashboard, PersonAdd, PhoneCallback, VideoCall, People, TrendingUp,
  RequestQuote, TaskAlt, CalendarMonth, Leaderboard, Assessment,
  AccountCircle, Settings,
}

const IconComponent = ({ name, size = 20 }) => {
  const Icon = ICON_MAP[name]
  return Icon ? <Icon style={{ fontSize: size }} /> : null
}

function NavItem({ item, collapsed }) {
  const location = useLocation()
  const isActive =
    location.pathname === item.path ||
    (!item.path.endsWith('/dashboard') && location.pathname.startsWith(item.path))

  return (
    <NavLink to={item.path} className="block">
      <motion.div
        whileHover={{ x: 2 }}
        whileTap={{ scale: 0.97 }}
        className={`sidebar-link ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-3' : ''}`}
        title={collapsed ? item.label : undefined}
      >
        <span className="flex-shrink-0">
          <IconComponent name={item.icon} size={20} />
        </span>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="text-sm font-medium whitespace-nowrap overflow-hidden"
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </NavLink>
  )
}

const menuMap = {
  sales: salesMenu,
  marketing: marketingMenu,
  production: productionMenu,
  evaluation: evaluationMenu,
  hr: hrMenu,
  owner: ownerMenu,
  admin: adminMenu,
}

const moduleLabelMap = {
  sales: 'Sales Platform',
  marketing: 'Marketing Platform',
  production: 'Production Platform',
  evaluation: 'Evaluation Platform',
  hr: 'HR Platform',
  owner: 'Owner Platform',
  admin: 'Admin Platform',
}

export default function Sidebar({ open, mobileOpen, onMobileClose }) {
  const { user } = useSelector((s) => s.auth)
  const location = useLocation()
  const pathSegments = location.pathname.split('/').filter(Boolean)
  const activeModule = pathSegments[0] || 'sales'

  const items = menuMap[activeModule] || salesMenu
  const platformLabel = moduleLabelMap[activeModule] || 'Sales Platform'

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100 dark:border-gray-700/50">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-600 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-brand">
          <span className="text-white font-bold text-sm">C</span>
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="overflow-hidden"
            >
              <span className="font-bold text-slate-800 dark:text-white text-lg leading-none">
                {APP_NAME}
              </span>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                {platformLabel}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {(() => {
          const mainItems = items.filter(item => item.id !== 'profile' && item.id !== 'settings');
          const bottomItems = items.filter(item => item.id === 'profile' || item.id === 'settings');
          return (
            <>
              {mainItems.map((item) => (
                <NavItem key={item.id} item={item} collapsed={!open} />
              ))}
              {bottomItems.length > 0 && (
                <>
                  <div className="border-t border-slate-100 dark:border-gray-700/50 my-3" />
                  {bottomItems.map((item) => (
                    <NavItem key={item.id} item={item} collapsed={!open} />
                  ))}
                </>
              )}
            </>
          );
        })()}
      </nav>

      {/* User Profile Bottom */}
      <div className="p-3 border-t border-slate-100 dark:border-gray-700/50">
        <div
          className={`flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ${
            !open ? 'justify-center' : ''
          }`}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
            {getInitials(user?.name)}
          </div>
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="min-w-0"
              >
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{user?.role}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: open ? 260 : 72 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="hidden lg:flex flex-col flex-shrink-0 bg-white dark:bg-gray-900 border-r border-slate-100 dark:border-gray-700/50 overflow-hidden"
      >
        {sidebarContent}
      </motion.aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed left-0 top-0 bottom-0 w-[260px] z-30 lg:hidden flex flex-col bg-white dark:bg-gray-900 border-r border-slate-100 dark:border-gray-700/50 shadow-xl"
          >
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}
