import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon,
  Home as HomeIcon,
  ChevronRight,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import { logout } from "../redux/slices/authSlice";
import {
  resetPerspective,
  fetchPerspectives,
  fetchCurrentPerspective,
} from "../redux/slices/perspectiveSlice";

export default function Navbar({ onToggleSidebar }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const { current: activePerspective, currentInfo } = useSelector(
    (s) => s.perspective,
  );
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const isViewingOther = activePerspective !== null;

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const handleResetPerspective = () => {
    dispatch(resetPerspective()).then(() => {
      dispatch(fetchPerspectives());
      dispatch(fetchCurrentPerspective());
    });
  };

  return (
    <header className="sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-gray-700/50">
      <div className="flex items-center justify-between px-4 lg:px-6 h-16">
        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="w-9 h-9 rounded-xl hover:bg-slate-100 dark:hover:bg-gray-700/50 flex items-center justify-center transition-colors"
          >
            <MenuIcon className="text-slate-600 dark:text-slate-400" />
          </button>

          {/* Perspective Breadcrumb in Navbar */}
          {isViewingOther && currentInfo?.breadcrumb && (
            <div className="hidden md:flex items-center gap-1.5 ml-2">
              <button
                onClick={handleResetPerspective}
                className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                <HomeIcon style={{ fontSize: 14 }} />
              </button>
              {currentInfo.breadcrumb.map((crumb, index) => (
                <span key={crumb.id} className="flex items-center gap-1">
                  <ChevronRight
                    style={{ fontSize: 14 }}
                    className="text-slate-300 dark:text-slate-600"
                  />
                  <span
                    className={`text-xs font-medium ${
                      index === currentInfo.breadcrumb.length - 1
                        ? "text-primary-700 dark:text-primary-300"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {crumb.label}
                  </span>
                </span>
              ))}
            </div>
          )}

          {/* Perspective Badge */}
          {isViewingOther && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30"
            >
              <VisibilityIcon
                style={{ fontSize: 14 }}
                className="text-amber-600 dark:text-amber-400"
              />
              <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                {currentInfo?.label || "Perspective"}
              </span>
              <button
                onClick={handleResetPerspective}
                className="ml-0.5 w-4 h-4 rounded-full hover:bg-amber-200 dark:hover:bg-amber-800/40 flex items-center justify-center transition-colors"
              >
                <CloseIcon
                  style={{ fontSize: 10 }}
                  className="text-amber-600 dark:text-amber-400"
                />
              </button>
            </motion.div>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="w-9 h-9 rounded-xl hover:bg-slate-100 dark:hover:bg-gray-700/50 flex items-center justify-center transition-colors"
          >
            <SearchIcon className="text-slate-500 dark:text-slate-400" />
          </button>

          {/* Notifications */}
          <button className="w-9 h-9 rounded-xl hover:bg-slate-100 dark:hover:bg-gray-700/50 flex items-center justify-center transition-colors relative">
            <NotificationsIcon className="text-slate-500 dark:text-slate-400" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 border-2 border-white dark:border-gray-900" />
          </button>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 ml-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs">
                {user?.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-slate-100 dark:border-gray-700/50 overflow-hidden"
                >
                  <div className="p-4 border-b border-slate-100 dark:border-gray-700/50">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">
                      {user?.name}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      {user?.email}
                    </p>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        navigate("/profile");
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-700/50 rounded-xl transition-colors"
                    >
                      Profile
                    </button>
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        navigate("/settings");
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-700/50 rounded-xl transition-colors"
                    >
                      Settings
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
