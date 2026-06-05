import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import {
  Dashboard,
  PersonAdd,
  PhoneCallback,
  VideoCall,
  People,
  TrendingUp,
  RequestQuote,
  TaskAlt,
  CalendarMonth,
  Leaderboard,
  Assessment,
  AccountCircle,
  Settings,
  Visibility as VisibilityIcon,
  Business as BusinessIcon,
  Group as TeamIcon,
  Person as PersonIcon,
  ChevronRight,
  ExpandMore,
  Close as CloseIcon,
  Home as HomeIcon,
  AccountTree as VerticalIcon,
  SupervisedUserCircle as HeadIcon,
  ManageAccounts as ManagerIcon,
  School as InternIcon,
} from "@mui/icons-material";
import {
  salesMenu,
  marketingMenu,
  productionMenu,
  evaluationMenu,
  hrMenu,
  ownerMenu,
  adminMenu,
} from "../config/sidebarConfig";
import { APP_NAME } from "../constants";
import { getInitials } from "../utils";
import {
  fetchPerspectives,
  switchPerspective,
  resetPerspective,
  fetchCurrentPerspective,
  fetchHierarchyTree,
} from "../redux/slices/perspectiveSlice";
import {
  fetchDashboardOverview,
  fetchDashboardPerformance,
  fetchDashboardInsights,
  fetchDashboardTeam,
} from "../redux/slices/dashboardSlice";

const ICON_MAP = {
  Dashboard,
  PersonAdd,
  PhoneCallback,
  VideoCall,
  People,
  TrendingUp,
  RequestQuote,
  TaskAlt,
  CalendarMonth,
  Leaderboard,
  Assessment,
  AccountCircle,
  Settings,
};

const menuMap = {
  sales: salesMenu,
  marketing: marketingMenu,
  production: productionMenu,
  evaluation: evaluationMenu,
  hr: hrMenu,
  owner: ownerMenu,
  admin: adminMenu,
};

const moduleLabelMap = {
  sales: "Sales Platform",
  marketing: "Marketing Platform",
  production: "Production Platform",
  evaluation: "Evaluation Platform",
  hr: "HR Platform",
  owner: "Owner Platform",
  admin: "Admin Platform",
};

const IconComponent = ({ name, size = 20 }) => {
  const Icon = ICON_MAP[name];
  return Icon ? <Icon style={{ fontSize: size }} /> : null;
};

function NavItem({ item, collapsed }) {
  const location = useLocation();
  const isActive =
    location.pathname === item.path ||
    (!item.path.endsWith("/dashboard") &&
      location.pathname.startsWith(item.path));

  return (
    <NavLink to={item.path} className="block">
      <motion.div
        whileHover={{ x: 2 }}
        whileTap={{ scale: 0.97 }}
        className={`sidebar-link ${isActive ? "active" : ""} ${collapsed ? "justify-center px-3" : ""}`}
        title={collapsed ? item.label : undefined}
      >
        <span className="flex-shrink-0">
          <IconComponent name={item.icon} size={20} />
        </span>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="text-sm font-medium whitespace-nowrap overflow-hidden"
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </NavLink>
  );
}

function roleLevelToType(level) {
  if (level === 3) return "HEAD";
  if (level === 2) return "MANAGER";
  if (level === 1) return "EMPLOYEE";
  if (level === 0) return "INTERN";
  return "EMPLOYEE";
}

function mapRoleTree(node) {
  const type =
    node.nodeType === "business" ? "BUSINESS" : roleLevelToType(node.roleLevel);
  return {
    id: node.id,
    type,
    label: node.name,
    designation: node.designation,
    children: (node.children || []).map(mapRoleTree),
  };
}

function TreeNode({ node, depth = 0, collapsed, onSelect, activeId }) {
  const [expanded, setExpanded] = useState(depth < 3);
  const hasChildren = node.children && node.children.length > 0;
  const isActive = activeId === node.id;

  const getIcon = () => {
    switch (node.type) {
      case "BUSINESS":
        return (
          <BusinessIcon style={{ fontSize: 16 }} className="text-blue-500" />
        );
      case "VERTICAL":
        return (
          <VerticalIcon style={{ fontSize: 16 }} className="text-amber-500" />
        );
      case "HEAD":
        return (
          <HeadIcon style={{ fontSize: 16 }} className="text-indigo-500" />
        );
      case "TEAM":
        return (
          <TeamIcon style={{ fontSize: 16 }} className="text-emerald-500" />
        );
      case "EMPLOYEE":
        return (
          <PersonIcon style={{ fontSize: 16 }} className="text-purple-500" />
        );
      case "MANAGER":
        return (
          <ManagerIcon style={{ fontSize: 16 }} className="text-green-500" />
        );
      case "INTERN":
        return (
          <InternIcon style={{ fontSize: 16 }} className="text-pink-400" />
        );
      default:
        return null;
    }
  };

  const handleClick = () => {
    if (hasChildren) {
      setExpanded(!expanded);
    }
    // All node types can now be selected for perspective switching
    onSelect(node.type, node.id);
  };

  if (collapsed) {
    if (depth > 0) return null;
    return (
      <div className="flex justify-center py-1">
        <button
          onClick={handleClick}
          className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700/50 flex items-center justify-center"
          title={node.label}
        >
          {getIcon()}
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={handleClick}
        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${
          isActive
            ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300"
            : "hover:bg-slate-50 dark:hover:bg-gray-700/50 text-slate-600 dark:text-slate-400"
        }`}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
      >
        {hasChildren ? (
          <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
            {expanded ? (
              <ExpandMore style={{ fontSize: 14 }} />
            ) : (
              <ChevronRight style={{ fontSize: 14 }} />
            )}
          </span>
        ) : (
          <span className="w-4 flex-shrink-0" />
        )}
        <span className="flex-shrink-0">{getIcon()}</span>
        <span className="truncate font-medium">{node.label}</span>
        {node.memberCount && (
          <span className="ml-auto text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-full">
            {node.memberCount}
          </span>
        )}
        {isActive && (
          <span className="w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0" />
        )}
      </button>
      <AnimatePresence>
        {hasChildren && expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
          >
            {node.children.map((child) => (
              <TreeNode
                key={child.id}
                node={child}
                depth={depth + 1}
                collapsed={collapsed}
                onSelect={onSelect}
                activeId={activeId}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PerspectiveBreadcrumb({ breadcrumb, onReset }) {
  if (!breadcrumb || breadcrumb.length === 0) return null;

  return (
    <div className="px-3 py-2 bg-gradient-to-r from-primary-50/80 to-blue-50/80 dark:from-primary-900/10 dark:to-blue-900/10 border-b border-primary-100 dark:border-primary-900/20">
      <div className="flex items-center gap-1 text-xs flex-wrap">
        <button
          onClick={onReset}
          className="flex items-center gap-0.5 text-primary-600 dark:text-primary-400 hover:underline font-medium"
        >
          <HomeIcon style={{ fontSize: 12 }} />
          <span>All</span>
        </button>
        {breadcrumb.map((crumb, index) => (
          <span key={crumb.id} className="flex items-center gap-1">
            <ChevronRight style={{ fontSize: 12 }} className="text-slate-400" />
            <span
              className={
                index === breadcrumb.length - 1
                  ? "text-primary-700 dark:text-primary-300 font-semibold"
                  : "text-slate-500 dark:text-slate-400"
              }
            >
              {crumb.label}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Sidebar({ open, mobileOpen }) {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const {
    current: activePerspective,
    currentInfo,
    hierarchyTree,
    loading: perspectiveLoading,
  } = useSelector((s) => s.perspective);
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);
  const activeModule = pathSegments[0] || "sales";

  const items = menuMap[activeModule] || salesMenu;
  const platformLabel = moduleLabelMap[activeModule] || "Sales Platform";
  const isViewingOther = activePerspective !== null;

  useEffect(() => {
    dispatch(fetchPerspectives());
    dispatch(fetchCurrentPerspective());
    dispatch(fetchHierarchyTree());
  }, [dispatch]);

  const refreshAfterSwitch = () => {
    dispatch(fetchPerspectives());
    dispatch(fetchCurrentPerspective());
    dispatch(fetchHierarchyTree());
    dispatch(fetchDashboardOverview());
    dispatch(fetchDashboardPerformance());
    dispatch(fetchDashboardInsights());
    dispatch(fetchDashboardTeam());
  };

  const handlePerspectiveSelect = (targetType, targetId) => {
    dispatch(switchPerspective({ targetType, targetId })).then(refreshAfterSwitch);
  };

  const handleResetPerspective = () => {
    dispatch(resetPerspective()).then(refreshAfterSwitch);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
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

      {isViewingOther && currentInfo?.breadcrumb && (
        <PerspectiveBreadcrumb
          breadcrumb={currentInfo.breadcrumb}
          onReset={handleResetPerspective}
        />
      )}

      {isViewingOther && !currentInfo?.breadcrumb && (
        <div className="px-3 py-2 bg-amber-50 dark:bg-amber-900/10 border-b border-amber-100 dark:border-amber-900/20">
          <div
            className={`flex items-center gap-2 ${!open ? "justify-center" : ""}`}
          >
            <VisibilityIcon
              style={{ fontSize: 16 }}
              className="text-amber-600 dark:text-amber-400 flex-shrink-0"
            />
            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="min-w-0"
                >
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 truncate">
                    Viewing: {currentInfo?.label || "Team/Employee"}
                  </p>
                  <p className="text-[10px] text-amber-600/70 dark:text-amber-500/70 truncate">
                    Click "Reset" to go back
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {open && (
        <div className="border-b border-slate-100 dark:border-gray-700/50">
          <div className="px-4 py-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Hierarchy
            </span>
            {isViewingOther && (
              <button
                onClick={handleResetPerspective}
                className="flex items-center gap-1 text-[10px] text-primary-600 dark:text-primary-400 hover:underline font-medium"
              >
                <CloseIcon style={{ fontSize: 12 }} />
                Reset
              </button>
            )}
          </div>
          <div className="pb-2 max-h-64 overflow-y-auto">
            {perspectiveLoading ? (
              <div className="px-4 py-3 text-xs text-slate-400 text-center">
                Loading...
              </div>
            ) : hierarchyTree.length === 0 ? (
              <div className="px-4 py-3 text-xs text-slate-400 text-center">
                No hierarchy data
              </div>
            ) : (
              hierarchyTree.map(mapRoleTree).map((business) => (
                <TreeNode
                  key={business.id}
                  node={business}
                  depth={0}
                  collapsed={!open}
                  onSelect={handlePerspectiveSelect}
                  activeId={activePerspective?.perspectiveTargetId}
                />
              ))
            )}
          </div>
        </div>
      )}

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {(() => {
          const mainItems = items.filter(
            (item) => item.id !== "profile" && item.id !== "settings",
          );
          const bottomItems = items.filter(
            (item) => item.id === "profile" || item.id === "settings",
          );
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

      <div className="p-3 border-t border-slate-100 dark:border-gray-700/50">
        <div
          className={`flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ${
            !open ? "justify-center" : ""
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
                <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                  {user?.role}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <motion.aside
        animate={{ width: open ? 260 : 72 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="hidden lg:flex flex-col flex-shrink-0 bg-white dark:bg-gray-900 border-r border-slate-100 dark:border-gray-700/50 overflow-hidden"
      >
        {sidebarContent}
      </motion.aside>

      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed left-0 top-0 bottom-0 w-[260px] z-30 lg:hidden flex flex-col bg-white dark:bg-gray-900 border-r border-slate-100 dark:border-gray-700/50 shadow-xl"
          >
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
