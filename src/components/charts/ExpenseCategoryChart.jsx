"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#64748b"];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-700 bg-[#111a2e] px-4 py-3 shadow-xl">
      <p className="text-xs font-medium text-slate-300 mb-1">{payload[0]?.name}</p>
      <p className="text-sm font-semibold text-white">
        {payload[0]?.value?.toLocaleString("en-IN")}
      </p>
    </div>
  );
};

export default function ExpenseCategoryChart({ data = [] }) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-[320px] text-sm text-ink-muted">
        No expense categories
      </div>
    );
  }

  const chartData = data.map((item) => ({
    name: item._id || item.name || "Unknown",
    value: item.total || 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
          nameKey="name"
        >
          {chartData.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          verticalAlign="bottom"
          height={36}
          formatter={(value) => (
            <span className="text-xs text-slate-300">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
