import { useState } from "react";
import { Outlet, useLocation, Navigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import {
  resetPerspective,
  fetchPerspectives,
  fetchCurrentPerspective,
  fetchHierarchyTree,
} from "../redux/slices/perspectiveSlice";
import {
  fetchDashboardOverview,
  fetchDashboardPerformance,
  fetchDashboardInsights,
  fetchDashboardTeam,
} from "../redux/slices/dashboardSlice";

export default function MainLayout() {
  const dispatch = useDispatch();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated } = useSelector((s) => s.auth);
  const { current: activePerspective, currentInfo } = useSelector((s) => s.perspective);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const isViewingOther = activePerspective !== null;

  const handleResetPerspective = () => {
    dispatch(resetPerspective()).then(() => {
      dispatch(fetchPerspectives());
      dispatch(fetchCurrentPerspective());
      dispatch(fetchHierarchyTree());
      dispatch(fetchDashboardOverview());
      dispatch(fetchDashboardPerformance());
      dispatch(fetchDashboardInsights());
      dispatch(fetchDashboardTeam());
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50 dark:bg-neutral-950" style={{ backgroundColor: 'var(--body-bg)' }}>
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <Sidebar
        open={sidebarOpen}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          onToggleSidebar={() => {
            setSidebarOpen(!sidebarOpen);
            setMobileSidebarOpen(true);
          }}
        />

        <AnimatePresence>
          {isViewingOther && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-2.5 flex flex-wrap items-center justify-between text-xs font-semibold gap-3 shadow-inner relative z-10"
            >
              <div className="flex items-center gap-2">
                <span className="animate-pulse bg-white text-amber-600 rounded px-1.5 py-0.5 text-[10px] font-bold shadow-sm">
                  IMPERSONATION ACTIVE
                </span>
                <span className="text-neutral-100">
                  Currently viewing scope as:{" "}
                  <strong className="text-white underline font-bold">
                    {currentInfo?.label || "Target employee/department"}
                  </strong>
                  . Data modifications (write/edit/delete) are blocked.
                </span>
              </div>
              <button
                onClick={handleResetPerspective}
                className="bg-white/10 hover:bg-white/20 active:bg-white/30 text-white border border-white/30 px-3.5 py-1.5 rounded-lg transition-colors uppercase text-[10px] tracking-wider font-bold"
              >
                Exit Impersonation
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-6 lg:px-8">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
