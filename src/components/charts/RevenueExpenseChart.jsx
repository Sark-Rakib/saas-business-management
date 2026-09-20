"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-700 bg-[#111a2e] px-4 py-3 shadow-xl">
      <p className="text-xs font-medium text-slate-300 mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name}: {entry.value?.toLocaleString("en-IN")}
        </p>
      ))}
    </div>
  );
};

export default function RevenueExpenseChart({ labels = [], revenue = [], expenses = [] }) {
  const hasData = labels.length > 0 && (revenue.some((v) => v > 0) || expenses.some((v) => v > 0));

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-[320px] text-sm text-ink-muted">
        No data available
      </div>
    );
  }

  const data = labels.map((label, i) => ({
    name: label,
    Revenue: revenue[i] || 0,
    Expenses: expenses[i] || 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#4f6ef7" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#4f6ef7" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradExpenses" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f05d5e" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#f05d5e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Area
          type="monotone"
          dataKey="Revenue"
          stroke="#4f6ef7"
          strokeWidth={2}
          fill="url(#gradRevenue)"
        />
        <Area
          type="monotone"
          dataKey="Expenses"
          stroke="#f05d5e"
          strokeWidth={2}
          fill="url(#gradExpenses)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
