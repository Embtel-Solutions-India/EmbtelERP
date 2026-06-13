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
  ChevronLeft,
  ExpandMore,
  Close as CloseIcon,
  Home as HomeIcon,
  AccountTree as VerticalIcon,
  SupervisedUserCircle as HeadIcon,
  ManageAccounts as ManagerIcon,
  School as InternIcon,
} from "@mui/icons-material";
import {
  salesInternMenu,
  salesExecutiveMenu,
  salesHeadMenu,
  salesMenu,
  marketingInternMenu,
  marketingExecutiveMenu,
  marketingManagerMenu,
  marketingMenu,
  productionInternMenu,
  productionExecutiveMenu,
  productionManagerMenu,
  productionMenu,
  documentationInternMenu,
  documentationExecutiveMenu,
  documentationManagerMenu,
  evaluationMenu,
  headEvaluationMenu,
  professorMenu,
  hrMenu,
  hrExecutiveMenu,
  recruitmentMenu,
  ownerMenu,
  headMenu,
  verticalMenu,
  adminMenu,
  superAdminMenu,
} from "../config/sidebarConfig";
import { APP_NAME } from "../constants";
import { getInitials } from "../utils";
import {
  fetchPerspectives,
  switchPerspective,
  resetPerspective,
  fetchCurrentPerspective,
  fetchHierarchyTree,
  fetchImmigrationHierarchyTree,
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
  AccountTree: VerticalIcon,
};

// Section break labels: key = item.id, value = section header shown BEFORE that item
const SECTION_BREAKS = {
  leads: "Sales Work",
  team: "Management",
  performance: "Analytics",
  calendar: "Schedule",
  profile: "Account",
  settings: "Account",
  cases: "Case Work",
  campaigns: "Campaigns",
  documents: "Documents",
  reports: "Analytics",
  approvals: "Approvals",
  employees: "HR Tools",
  recruitment: "Recruitment",
  evaluation: "Evaluations",
  verticals: "Organization",
};

// Resolve which menu to show based on active module + role level + designation
function resolveMenu(activeModule, level, designation) {
  const desg = (designation || "").toLowerCase();

  switch (activeModule) {
    case "sales":
      if (level <= 0) return salesInternMenu;
      if (level >= 2 || desg.includes("head") || desg.includes("manager"))
        return salesHeadMenu;
      return salesExecutiveMenu;

    case "sales-intern":
      return salesInternMenu;

    case "sales-manager":
      return salesHeadMenu;

    case "marketing":
      if (level <= 0) return marketingInternMenu;
      if (level >= 2 || desg.includes("manager")) return marketingManagerMenu;
      return marketingExecutiveMenu;

    case "marketing-intern":
      return marketingInternMenu;

    case "marketing-manager":
      return marketingManagerMenu;

    case "production":
      if (level <= 0) return productionInternMenu;
      if (level >= 2 || desg.includes("manager")) return productionManagerMenu;
      return productionExecutiveMenu;

    case "documentation-intern":
      return documentationInternMenu;

    case "documentation":
      return documentationExecutiveMenu;

    case "documentation-manager":
      return documentationManagerMenu;

    case "evaluation":
      return evaluationMenu;

    case "head-evaluation":
      return headEvaluationMenu;

    case "professor":
      return professorMenu;

    case "hr":
      return hrMenu;

    case "hr-executive":
      return hrExecutiveMenu;

    case "recruitment":
      return recruitmentMenu;

    case "owner":
      return ownerMenu;

    case "head":
      return headMenu;

    case "vertical":
      return verticalMenu;

    case "admin":
      return adminMenu;

    case "super-admin":
      return superAdminMenu;

    default:
      return salesMenu;
  }
}

const moduleLabelMap = {
  sales: "Sales Platform",
  "sales-intern": "Sales Platform",
  "sales-manager": "Sales Platform",
  marketing: "Marketing Platform",
  "marketing-intern": "Marketing Platform",
  "marketing-manager": "Marketing Platform",
  production: "Documentation Platform",
  documentation: "Documentation Platform",
  "documentation-intern": "Documentation Platform",
  "documentation-manager": "Documentation Platform",
  evaluation: "Evaluation Platform",
  "head-evaluation": "Evaluation Platform",
  professor: "Evaluation Platform",
  hr: "HR Platform",
  "hr-executive": "HR Platform",
  recruitment: "HR Platform",
  owner: "Management Platform",
  head: "Management Platform",
  vertical: "Management Platform",
  admin: "Admin Platform",
  "super-admin": "Admin Platform",
};

const IconComponent = ({ name, size = 18 }) => {
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
      <div
        className={`sidebar-link ${isActive ? "active" : ""} ${collapsed ? "justify-center !px-2.5" : ""}`}
        title={collapsed ? item.label : undefined}
      >
        <span className="flex-shrink-0">
          <IconComponent name={item.icon} size={18} />
        </span>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="text-sm font-medium whitespace-nowrap overflow-hidden"
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
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
    node.nodeType === "business"
      ? "BUSINESS"
      : node.nodeType === "vertical"
        ? "VERTICAL"
        : node.nodeType === "department"
          ? "MANAGER"
          : roleLevelToType(node.roleLevel);
  return {
    id: node.id,
    type,
    label: node.name,
    designation: node.designation,
    memberCount: node.memberCount,
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
          <BusinessIcon style={{ fontSize: 14 }} className="text-blue-500" />
        );
      case "VERTICAL":
        return (
          <VerticalIcon style={{ fontSize: 14 }} className="text-amber-500" />
        );
      case "HEAD":
        return (
          <HeadIcon style={{ fontSize: 14 }} className="text-indigo-500" />
        );
      case "TEAM":
        return (
          <TeamIcon style={{ fontSize: 14 }} className="text-emerald-500" />
        );
      case "EMPLOYEE":
        return (
          <PersonIcon style={{ fontSize: 14 }} className="text-purple-500" />
        );
      case "MANAGER":
        return (
          <ManagerIcon style={{ fontSize: 14 }} className="text-green-500" />
        );
      case "INTERN":
        return (
          <InternIcon style={{ fontSize: 14 }} className="text-pink-400" />
        );
      default:
        return null;
    }
  };

  const handleClick = () => {
    if (hasChildren) {
      setExpanded(!expanded);
    }
    onSelect(node.type, node.id);
  };

  if (collapsed) {
    if (depth > 0) return null;
    return (
      <div className="flex justify-center py-1">
        <button
          onClick={handleClick}
          className="w-8 h-8 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700/50 flex items-center justify-center"
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
        className={`w-full flex items-center gap-1.5 py-1.5 rounded-lg text-xs transition-colors ${
          isActive
            ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300"
            : "hover:bg-neutral-50 dark:hover:bg-neutral-700/50 text-neutral-600 dark:text-neutral-400"
        }`}
        style={{ paddingLeft: `${10 + depth * 14}px`, paddingRight: "8px" }}
      >
        {hasChildren ? (
          <span className="flex-shrink-0 w-3.5 h-3.5 flex items-center justify-center">
            {expanded ? (
              <ExpandMore style={{ fontSize: 13 }} />
            ) : (
              <ChevronRight style={{ fontSize: 13 }} />
            )}
          </span>
        ) : (
          <span className="w-3.5 flex-shrink-0" />
        )}
        <span className="flex-shrink-0">{getIcon()}</span>
        <span className="truncate font-medium leading-none">{node.label}</span>
        {node.memberCount && (
          <span className="ml-auto text-[9px] text-neutral-400 dark:text-neutral-500 bg-neutral-100 dark:bg-neutral-700 px-1.5 py-0.5 rounded-full">
            {node.memberCount}
          </span>
        )}
        {isActive && (
          <span className="w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0 ml-auto" />
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
            <ChevronRight
              style={{ fontSize: 12 }}
              className="text-neutral-400"
            />
            <span
              className={
                index === breadcrumb.length - 1
                  ? "text-primary-700 dark:text-primary-300 font-semibold"
                  : "text-neutral-500 dark:text-neutral-400"
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
  const rawSegment = pathSegments[0] || "sales";

  // Audit Logs / Calendar are shared routes ("/audit", "/calendar") that aren't
  // module-scoped. When the user lands on one, keep showing the module they came
  // from instead of falling back to the Sales default — otherwise the Dashboard
  // link would point at /sales/dashboard regardless of the originating module.
  const SHARED_SEGMENTS = new Set(["audit", "calendar"]);
  const [stickyModule, setStickyModule] = useState(
    () => sessionStorage.getItem("activeModule") || "sales",
  );
  useEffect(() => {
    if (!SHARED_SEGMENTS.has(rawSegment)) {
      setStickyModule(rawSegment);
      sessionStorage.setItem("activeModule", rawSegment);
    }
  }, [rawSegment]);
  const activeModule = SHARED_SEGMENTS.has(rawSegment)
    ? stickyModule
    : rawSegment;

  const level = Number(user?.employeeLevel ?? user?.roleLevel ?? 0);
  const designation = user?.designation || "";
  const items = resolveMenu(activeModule, level, designation);
  const platformLabel = moduleLabelMap[activeModule] || "Sales Platform";
  const isViewingOther = activePerspective !== null;

  useEffect(() => {
    dispatch(fetchPerspectives());
    dispatch(fetchCurrentPerspective());
    const isImmigrationModule =
      activeModule === "head" || activeModule === "vertical";
    isImmigrationModule
      ? dispatch(fetchImmigrationHierarchyTree())
      : dispatch(fetchHierarchyTree());
  }, [dispatch, activeModule]);

  const refreshAfterSwitch = () => {
    dispatch(fetchPerspectives());
    dispatch(fetchCurrentPerspective());
    const isImmigrationModule =
      activeModule === "head" || activeModule === "vertical";
    isImmigrationModule
      ? dispatch(fetchImmigrationHierarchyTree())
      : dispatch(fetchHierarchyTree());
    dispatch(fetchDashboardOverview());
    dispatch(fetchDashboardPerformance());
    dispatch(fetchDashboardInsights());
    dispatch(fetchDashboardTeam());
  };

  const handlePerspectiveSelect = (targetType, targetId) => {
    dispatch(switchPerspective({ targetType, targetId })).then(
      refreshAfterSwitch,
    );
  };

  const handleResetPerspective = () => {
    dispatch(resetPerspective()).then(refreshAfterSwitch);
  };

  // Build nav item list with section break info
  const renderNavItems = (itemList, collapsed) => {
    let lastSection = null;
    return itemList.map((item) => {
      const sectionLabel = SECTION_BREAKS[item.id];
      const showHeader =
        !collapsed && sectionLabel && sectionLabel !== lastSection;
      if (sectionLabel) lastSection = sectionLabel;

      return (
        <div key={item.id}>
          {showHeader && (
            <p className="sidebar-section-title">{sectionLabel}</p>
          )}
          <NavItem item={item} collapsed={collapsed} />
        </div>
      );
    });
  };

  const sidebarContent = (isCollapsed) => (
    <div className="flex flex-col h-full">
      {/* Logo area — 72px height */}
      <div
        className={`flex items-center border-b border-neutral-200 dark:border-neutral-800 flex-shrink-0 ${
          isCollapsed ? "justify-center px-0" : "gap-3 px-5"
        }`}
        style={{ height: 72 }}
      >
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-600 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-brand">
          <span className="text-white font-bold text-sm">C</span>
        </div>
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden min-w-0"
            >
              <span className="font-bold text-neutral-800 dark:text-white text-lg leading-none block">
                {APP_NAME}
              </span>
              <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5 truncate">
                {platformLabel}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Perspective: breadcrumb banner */}
      {isViewingOther && currentInfo?.breadcrumb && (
        <PerspectiveBreadcrumb
          breadcrumb={currentInfo.breadcrumb}
          onReset={handleResetPerspective}
        />
      )}

      {/* Perspective: viewing-other banner (no breadcrumb) */}
      {isViewingOther && !currentInfo?.breadcrumb && (
        <div className="px-3 py-2 bg-amber-50 dark:bg-amber-900/10 border-b border-amber-100 dark:border-amber-900/20">
          <div
            className={`flex items-center gap-2 ${isCollapsed ? "justify-center" : ""}`}
          >
            <VisibilityIcon
              style={{ fontSize: 15 }}
              className="text-amber-600 dark:text-amber-400 flex-shrink-0"
            />
            <AnimatePresence>
              {!isCollapsed && (
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

      {/* Hierarchy Tree section */}
      {/* {!isCollapsed && (
        <div className="border-b border-neutral-200 dark:border-neutral-800">
          <div className="px-3.5 py-2 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-600">
              Hierarchy
            </span>
            {isViewingOther && (
              <button
                onClick={handleResetPerspective}
                className="flex items-center gap-0.5 text-[10px] text-primary-600 dark:text-primary-400 hover:underline font-medium"
              >
                <CloseIcon style={{ fontSize: 11 }} />
                Reset
              </button>
            )}
          </div>
          <div className="pb-2 px-1.5 max-h-52 overflow-y-auto">
            {perspectiveLoading ? (
              <div className="px-3 py-3 text-xs text-neutral-400 text-center">
                Loading…
              </div>
            ) : hierarchyTree.length === 0 ? (
              <div className="px-3 py-3 text-xs text-neutral-400 text-center">
                No hierarchy data
              </div>
            ) : (
              hierarchyTree.map(mapRoleTree).map((business) => (
                <TreeNode
                  key={business.id}
                  node={business}
                  depth={0}
                  collapsed={false}
                  onSelect={handlePerspectiveSelect}
                  activeId={activePerspective?.perspectiveTargetId}
                />
              ))
            )}
          </div>
        </div>
      )} */}

      {/* Collapsed hierarchy: just top-level icons */}
      {/* {isCollapsed && hierarchyTree.length > 0 && (
        <div className="border-b border-neutral-200 dark:border-neutral-800 py-1 px-1.5">
          {hierarchyTree.map(mapRoleTree).map((business) => (
            <TreeNode
              key={business.id}
              node={business}
              depth={0}
              collapsed={true}
              onSelect={handlePerspectiveSelect}
              activeId={activePerspective?.perspectiveTargetId}
            />
          ))}
        </div>
      )} */}

      {/* Navigation */}
      <nav className="flex-1 px-2.5 py-3 overflow-y-auto">
        {renderNavItems(items, isCollapsed)}
      </nav>

      {/* Bottom user profile */}
      <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 flex-shrink-0">
        <div
          className={`flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer transition-colors ${
            isCollapsed ? "justify-center" : ""
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center flex-shrink-0 text-white font-bold text-xs">
            {getInitials(user?.name)}
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="min-w-0"
              >
                <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 truncate leading-tight">
                  {user?.name}
                </p>
                <p className="text-xs text-neutral-400 dark:text-neutral-500 truncate leading-tight">
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
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col flex-shrink-0 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 overflow-hidden transition-all duration-300 relative ${
          open ? "w-[260px]" : "w-[72px]"
        }`}
      >
        {sidebarContent(!open)}
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed left-0 top-0 bottom-0 w-[260px] z-30 lg:hidden flex flex-col bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 shadow-xl"
          >
            {sidebarContent(false)}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
