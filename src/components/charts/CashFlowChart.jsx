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

export default function CashFlowChart({ labels = [], inflow = [], outflow = [] }) {
  const hasData = labels.length > 0 && (inflow.some((v) => v > 0) || outflow.some((v) => v > 0));

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-[320px] text-sm text-ink-muted">
        No cash flow data
      </div>
    );
  }

  const data = labels.map((label, i) => ({
    name: label,
    Inflow: inflow[i] || 0,
    Outflow: outflow[i] || 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar dataKey="Inflow" fill="#10b981" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Outflow" fill="#ef4444" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
