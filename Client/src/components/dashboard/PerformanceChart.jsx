import { useState } from "react";
import { useSelector } from "react-redux";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { motion } from "framer-motion";
import { formatCurrency } from "../../utils";
import SectionCard from "../common/SectionCard";

const PERIODS = ["Weekly", "Monthly", "Quarterly"];
const CHART_TABS = ["Revenue", "Leads", "Activity"];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-xl border border-neutral-100 dark:border-neutral-700 p-3">
      <p className="text-xs font-bold text-neutral-600 dark:text-neutral-300 mb-2">
        {label}
      </p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-xs">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: p.color }}
          />
          <span className="text-neutral-500 dark:text-neutral-400 capitalize">
            {p.name}:
          </span>
          <span className="font-bold text-neutral-700 dark:text-neutral-200">
            {p.name === "revenue" || p.name === "target"
              ? formatCurrency(p.value)
              : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function PerformanceChart({ data: apiData }) {
  const performance = useSelector((s) => s.dashboard.performance) || [];
  const [chartTab, setChartTab] = useState("Revenue");
  const [period, setPeriod] = useState("Monthly");

  // Real, hierarchy-scoped performance series from the backend: head sees the
  // aggregate of their whole reporting subtree; executive/intern see only their
  // own — enforced server-side via the request scope (scope.visibleEmployees).
  const source = apiData && apiData.length > 0 ? apiData : performance;
  const monthName = (per) => {
    if (!per) return "";
    const d = new Date(per + "-01");
    return isNaN(d.getTime()) ? per : d.toLocaleString("default", { month: "short" });
  };
  const toRow = (p, label) => ({
    label, month: label, day: label,
    revenue: Number(p.revenue) || 0,
    target: Number(p.target) || 0,
    leads: Number(p.leads) || 0,
    won: Number(p.conversions) || 0,
    calls: Number(p.tasksCompleted) || 0,
    emails: Number(p.employeeProductivity) || 0,
    meetings: Number(p.tasksCreated) || 0,
  });

  let data;
  if (period === "Quarterly") {
    const qmap = new Map();
    source.forEach((p) => {
      const y = String(p.period).slice(0, 4);
      const m = Number(String(p.period).slice(5, 7)) || 1;
      const key = `${y} Q${Math.floor((m - 1) / 3) + 1}`;
      const e = qmap.get(key) || { label: key, month: key, day: key, revenue: 0, target: 0, leads: 0, won: 0, calls: 0, meetings: 0, emails: 0 };
      e.revenue += Number(p.revenue) || 0;
      e.target += Number(p.target) || 0;
      e.leads += Number(p.leads) || 0;
      e.won += Number(p.conversions) || 0;
      e.calls += Number(p.tasksCompleted) || 0;
      e.meetings += Number(p.tasksCreated) || 0;
      qmap.set(key, e);
    });
    data = [...qmap.values()].map((e) => ({ ...e, emails: e.meetings > 0 ? Math.round((e.calls / e.meetings) * 100) : 0 }));
  } else if (period === "Weekly") {
    // Backend granularity is monthly — show the most recent months.
    data = source.slice(-6).map((p) => toRow(p, monthName(p.period)));
  } else {
    data = source.map((p) => toRow(p, monthName(p.period)));
  }

  // Render whenever the backend returned real periods (values may be 0 — that is
  // honest live data); only show the empty state when there is no series at all.
  const hasData = data.length > 0;

  const isDark = document.documentElement.classList.contains("dark");
  const axisColor = isDark ? "#6b7280" : "#94a3b8";
  const gridColor = isDark ? "#1f2937" : "#f1f5f9";

  return (
    <SectionCard
      title="Performance Analytics"
      subtitle="Revenue, leads & activity trends"
      delay={0.2}
      actions={
        <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-700 rounded-xl p-1">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                period === p
                  ? "bg-white dark:bg-neutral-600 text-primary-600 dark:text-primary-400 shadow-sm"
                  : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      }
      className="h-[420px] flex flex-col"
    >
      <div className="flex gap-2 mb-4">
        {CHART_TABS.map((t) => (
          <button
            key={t}
            onClick={() => setChartTab(t)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
              chartTab === t
                ? "bg-primary-600 text-white shadow-brand"
                : "text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <motion.div
        key={`${chartTab}-${period}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex-1 min-h-0"
      >
        {hasData ? (
        <ResponsiveContainer width="100%" height="100%">
          {chartTab === "Revenue" ? (
            <AreaChart
              data={data}
              margin={{ top: 5, right: 5, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="tgtGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis
                dataKey={period === "Weekly" ? "day" : "month"}
                tick={{ fontSize: 11, fill: axisColor }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: axisColor }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#6366f1"
                strokeWidth={2.5}
                fill="url(#revGrad)"
                dot={false}
                activeDot={{ r: 5, fill: "#6366f1" }}
              />
              <Area
                type="monotone"
                dataKey="target"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#tgtGrad)"
                strokeDasharray="5 5"
                dot={false}
                activeDot={{ r: 4, fill: "#10b981" }}
              />
            </AreaChart>
          ) : chartTab === "Leads" ? (
            <BarChart
              data={data}
              margin={{ top: 5, right: 5, left: 0, bottom: 0 }}
              barSize={16}
              barGap={4}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis
                dataKey={period === "Weekly" ? "day" : "month"}
                tick={{ fontSize: 11, fill: axisColor }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: axisColor }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="leads" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="won" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <BarChart
              data={data}
              margin={{ top: 5, right: 5, left: 0, bottom: 0 }}
              barSize={12}
              barGap={2}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: axisColor }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: axisColor }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="calls" fill="#6366f1" radius={[3, 3, 0, 0]} />
              <Bar dataKey="emails" fill="#06b6d4" radius={[3, 3, 0, 0]} />
              <Bar dataKey="meetings" fill="#10b981" radius={[3, 3, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center text-neutral-400 gap-1">
            <p className="text-sm">No performance data yet</p>
            <p className="text-xs">Metrics appear as KPIs, revenue and tasks are recorded.</p>
          </div>
        )}
      </motion.div>
    </SectionCard>
  );
}
