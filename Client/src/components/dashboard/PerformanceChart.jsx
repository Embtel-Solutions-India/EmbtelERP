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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-slate-100 dark:border-gray-700 p-3">
      <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">
        {label}
      </p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-xs">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: p.color }}
          />
          <span className="text-slate-500 dark:text-slate-400 capitalize">
            {p.name}:
          </span>
          <span className="font-bold text-slate-700 dark:text-slate-200">
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
  const { monthlyRevenue, weeklyData } = useSelector((s) => s.dashboard);
  const [chartTab, setChartTab] = useState("Revenue");
  const [period, setPeriod] = useState("Monthly");

  // Use API data if provided, otherwise fall back to Redux store
  const chartData =
    apiData && apiData.length > 0
      ? apiData.map((d) => ({
          month: d.period
            ? new Date(d.period + "-01").toLocaleString("default", {
                month: "short",
              })
            : "",
          revenue: d.revenue,
          target: d.target,
          leads: d.leads,
          won: d.conversions,
          calls: d.tasksCompleted,
          emails: d.employeeProductivity,
          meetings: d.tasksCreated,
        }))
      : period === "Weekly"
        ? weeklyData
        : monthlyRevenue;

  const data = chartData;
  const isDark = document.documentElement.classList.contains("dark");
  const axisColor = isDark ? "#6b7280" : "#94a3b8";
  const gridColor = isDark ? "#1f2937" : "#f1f5f9";

  return (
    <SectionCard
      title="Performance Analytics"
      subtitle="Revenue, leads & activity trends"
      delay={0.2}
      actions={
        <div className="flex gap-1 bg-slate-100 dark:bg-gray-700 rounded-xl p-1">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                period === p
                  ? "bg-white dark:bg-gray-600 text-primary-600 dark:text-primary-400 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      }
      className="h-[380px] flex flex-col"
    >
      <div className="flex gap-2 mb-4">
        {CHART_TABS.map((t) => (
          <button
            key={t}
            onClick={() => setChartTab(t)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
              chartTab === t
                ? "bg-primary-600 text-white shadow-brand"
                : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-700"
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
              data={weeklyData}
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
      </motion.div>
    </SectionCard>
  );
}
