import { useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
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
} from "@mui/icons-material";
import { Badge, Tooltip } from "@mui/material";
import {
  FaUserPlus,
  FaCalendarAlt,
  FaPhone,
  FaTasks,
  FaBullseye,
  FaCommentDots,
  FaCog,
} from "react-icons/fa";
import { toggleTheme } from "../redux/slices/themeSlice";
import { markAllRead } from "../redux/slices/notificationSlice";
import { getInitials, timeAgo } from "../utils";
import {
  FaUserPlus, FaCalendarAlt, FaPhone, FaTasks,
  FaBullseye, FaCommentDots, FaCog,
} from 'react-icons/fa'
import { toggleTheme } from '../redux/slices/themeSlice'
import { markAllRead } from '../redux/slices/notificationSlice'
import { getInitials, timeAgo } from '../utils'

const QUICK_ACTIONS = [
  { label: 'Add Lead',         path: '/leads',      Icon: FaUserPlus    },
  { label: 'Schedule Meeting', path: '/meetings',   Icon: FaCalendarAlt },
  { label: 'Create Follow Up', path: '/follow-ups', Icon: FaPhone       },
  { label: 'New Task',         path: '/tasks',      Icon: FaTasks       },
]

const NOTIFICATION_ICON_MAP = {
  lead: { Icon: FaUserPlus, cls: "text-indigo-500" },
  meeting: { Icon: FaCalendarAlt, cls: "text-cyan-500" },
  target: { Icon: FaBullseye, cls: "text-purple-500" },
  client: { Icon: FaCommentDots, cls: "text-emerald-500" },
  system: { Icon: FaCog, cls: "text-slate-400" },
};

export default function Navbar({ onMenuToggle, onMobileMenuToggle }) {
  const dispatch  = useDispatch()
  const navigate  = useNavigate()
  const { isDark } = useSelector((s) => s.theme)
  const { user }   = useSelector((s) => s.auth)
  const { list: notifications, unreadCount } = useSelector((s) => s.notifications)

  const [search, setSearch] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showPerspective, setShowPerspective] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const perspectiveRef = useRef(null);

  const {
    available: perspectives,
    current: activePerspective,
    loading: perspectiveLoading,
  } = useSelector((s) => s.perspective);

  // Fetch available perspectives on mount
  useEffect(() => {
    dispatch(fetchAvailablePerspectives());
    dispatch(fetchCurrentPerspective());
  }, [dispatch]);

  const handleSwitchPerspective = (targetUserId) => {
    dispatch(switchPerspective(targetUserId));
    setShowPerspective(false);
  };

  const handleResetPerspective = () => {
    dispatch(resetPerspective());
    setShowPerspective(false);
  };

  const isViewingOther =
    activePerspective &&
    activePerspective.currentPerspectiveId &&
    activePerspective.currentPerspectiveId !== user?.id;

  const dropdownClass =
    "absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-slate-100 dark:border-gray-700 z-50 overflow-hidden";

  return (
    <header className="sticky top-0 z-10 h-16 flex items-center gap-3 px-4 md:px-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-gray-700/50">
      {/* Menu toggles */}
      <button onClick={onMobileMenuToggle} className="btn-ghost p-2 lg:hidden">
        <MenuIcon fontSize="small" />
      </button>
      <button onClick={onMenuToggle} className="btn-ghost p-2 hidden lg:flex">
        <MenuIcon fontSize="small" />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-md relative hidden md:block">
        <SearchIcon
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          style={{ fontSize: 18 }}
        />
        <input
          type="text"
          placeholder="Search leads, contacts, deals…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-9 py-2 text-sm"
        />
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        {/* Perspective Switcher */}
        <div className="relative" ref={perspectiveRef}>
          <Tooltip
            title={
              isViewingOther
                ? "Viewing as another user - Click to change"
                : "Switch perspective"
            }
          >
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setShowPerspective(!showPerspective);
                setShowNotifications(false);
                setShowProfile(false);
                setShowQuickActions(false);
              }}
              className={`flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl transition-colors ${
                isViewingOther
                  ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                  : "btn-ghost"
              }`}
            >
              <VisibilityIcon style={{ fontSize: 18 }} />
              <span className="hidden sm:inline text-xs font-medium">
                {isViewingOther ? "Perspective" : "My View"}
              </span>
              {isViewingOther && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </motion.button>
          </Tooltip>

          <AnimatePresence>
            {showPerspective && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className={`${dropdownClass} w-64`}
              >
                <div className="px-4 py-3 border-b border-slate-100 dark:border-gray-700">
                  <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">
                    Switch Perspective
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    View dashboard as another user
                  </p>
                </div>

                {isViewingOther && (
                  <button
                    onClick={handleResetPerspective}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-gray-700/50 text-left text-sm text-primary-600 dark:text-primary-400 font-semibold transition-colors border-b border-slate-100 dark:border-gray-700"
                  >
                    <CloseIcon fontSize="small" />
                    Reset to my view
                  </button>
                )}

                <div className="max-h-60 overflow-y-auto">
                  {perspectiveLoading ? (
                    <div className="px-4 py-8 text-center text-sm text-slate-400">
                      Loading...
                    </div>
                  ) : perspectives.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-slate-400">
                      No other perspectives available
                    </div>
                  ) : (
                    perspectives.map((p) => {
                      const isActive =
                        activePerspective?.currentPerspectiveId === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => handleSwitchPerspective(p.id)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-gray-700/50 text-left text-sm transition-colors ${
                            isActive
                              ? "bg-primary-50 dark:bg-primary-900/10 text-primary-700 dark:text-primary-300"
                              : "text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0 ${
                              isActive
                                ? "bg-primary-500"
                                : "bg-slate-300 dark:bg-gray-600"
                            }`}
                          >
                            {getInitials(p.name)}
                          </div>
                          <span className="font-medium truncate">{p.name}</span>
                          {isActive && (
                            <span className="ml-auto w-2 h-2 rounded-full bg-primary-500" />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Theme Toggle */}
        <Tooltip title={isDark ? "Light mode" : "Dark mode"}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => dispatch(toggleTheme())}
            className="btn-ghost p-2 rounded-xl"
          >
            {isDark ? (
              <LightMode fontSize="small" />
            ) : (
              <DarkMode fontSize="small" />
            )}
          </motion.button>
        </Tooltip>

        {/* Messages */}
        <Tooltip title="Messages">
          <button className="btn-ghost p-2 rounded-xl relative">
            <Badge
              badgeContent={3}
              color="error"
              sx={{
                "& .MuiBadge-badge": { fontSize: 10, minWidth: 16, height: 16 },
              }}
            >
              <MessageIcon fontSize="small" />
            </Badge>
          </button>
        </Tooltip>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <Tooltip title="Notifications">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfile(false);
                setShowQuickActions(false);
              }}
              className="btn-ghost p-2 rounded-xl relative"
            >
              <Badge
                badgeContent={unreadCount}
                color="error"
                sx={{
                  "& .MuiBadge-badge": {
                    fontSize: 10,
                    minWidth: 16,
                    height: 16,
                  },
                }}
              >
                <NotificationsIcon fontSize="small" />
              </Badge>
            </button>
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
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-gray-700">
                  <span className="font-semibold text-sm text-slate-800 dark:text-slate-100">
                    Notifications{" "}
                    {unreadCount > 0 && (
                      <span className="ml-1 badge badge-primary">
                        {unreadCount} new
                      </span>
                    )}
                  </span>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => dispatch(markAllRead())}
                      className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                    >
                      <CheckIcon style={{ fontSize: 13 }} /> Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-50 dark:divide-gray-700">
                  {notifications.slice(0, 6).map((n) => {
                    const entry =
                      NOTIFICATION_ICON_MAP[n.type] ||
                      NOTIFICATION_ICON_MAP.system;
                    const { Icon } = entry;
                    return (
                      <div
                        key={n.id}
                        className={`px-4 py-3 hover:bg-slate-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ${!n.read ? "bg-primary-50/40 dark:bg-primary-900/10" : ""}`}
                      >
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-100 dark:bg-gray-700 flex items-center justify-center">
                            <Icon className={entry.cls} size={14} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                              {n.title}
                              {!n.read && (
                                <span className="w-1.5 h-1.5 rounded-full bg-primary-600 inline-block" />
                              )}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                              {n.message}
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                              {timeAgo(n.time)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="px-4 py-2.5 border-t border-slate-100 dark:border-gray-700 text-center">
                  <button className="text-xs text-primary-600 dark:text-primary-400 font-medium hover:underline">
                    View all notifications
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Quick Actions */}
        <div className="relative">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setShowQuickActions(!showQuickActions);
              setShowNotifications(false);
              setShowProfile(false);
            }}
            className="btn-primary flex items-center gap-1.5 text-sm px-3 py-2"
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
                className={`${dropdownClass} w-48`}
              >
                {QUICK_ACTIONS.map((a) => (
                  <button
                    key={a.label}
                    onClick={() => { navigate(a.path); setShowQuickActions(false) }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-gray-700/50 text-left text-sm text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    <a.Icon className="text-slate-400" size={14} />
                    <span className="font-medium">{a.label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => {
              setShowProfile(!showProfile);
              setShowNotifications(false);
              setShowQuickActions(false);
            }}
            className="flex items-center gap-2 p-1.5 pr-2 rounded-xl hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs">
              {getInitials(user?.name)}
            </div>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 hidden sm:block">
              {user?.name?.split(" ")[0]}
            </span>
            <KeyboardArrowDown
              style={{ fontSize: 16 }}
              className="text-slate-400 hidden sm:block"
            />
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
                <div className="px-4 py-3 border-b border-slate-100 dark:border-gray-700">
                  <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">
                    {user?.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {user?.email}
                  </p>
                  <span className="badge badge-primary mt-1">{user?.role}</span>
                </div>
                {[
                  { icon: <PersonIcon fontSize="small" />, label: 'View Profile', path: '/profile' },
                  { icon: <SettingsIcon fontSize="small" />, label: 'Settings', path: '/settings' },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => { navigate(item.path); setShowProfile(false) }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-gray-700/50 text-left text-sm text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    <span className="text-slate-400">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
                <div className="border-t border-slate-100 dark:border-gray-700">
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-left text-sm text-red-600 dark:text-red-400 transition-colors">
                    <LogoutIcon fontSize="small" />
                    <span className="font-medium">Sign out</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
