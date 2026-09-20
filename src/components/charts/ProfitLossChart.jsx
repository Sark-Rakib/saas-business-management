"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value;
  const color = value >= 0 ? "#10b981" : "#ef4444";
  return (
    <div className="rounded-xl border border-slate-700 bg-[#111a2e] px-4 py-3 shadow-xl">
      <p className="text-xs font-medium text-slate-300 mb-1">{label}</p>
      <p className="text-sm font-semibold" style={{ color }}>
        Profit/Loss: {value?.toLocaleString("en-IN")}
      </p>
    </div>
  );
};

export default function ProfitLossChart({ labels = [], profit = [] }) {
  const hasData = labels.length > 0 && profit.some((v) => v !== 0);

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-[320px] text-sm text-ink-muted">
        No data available
      </div>
    );
  }

  const data = labels.map((label, i) => ({
    name: label,
    "Profit/Loss": profit[i] || 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar dataKey="Profit/Loss" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={index}
              fill={entry["Profit/Loss"] >= 0 ? "#10b981" : "#ef4444"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
