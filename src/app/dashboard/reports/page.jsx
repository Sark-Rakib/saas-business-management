"use client";

import { useState } from "react";
import {
  Banknote,
  Wallet,
  Coins,
  ShoppingBag,
  Package,
  Users,
  Download,
  Printer,
  ArrowRightLeft,
  Layers,
  CircleDollarSign,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useFetch } from "@/hooks";
import { formatMoney, capitalize } from "@/constants";
import PageHeader from "@/components/common/PageHeader";
import StatCard from "@/components/common/StatCard";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import DateRangePicker from "@/components/common/DateRangePicker";
import SubscriptionGuard from "@/components/common/SubscriptionGuard";
import CashFlowChart from "@/components/charts/CashFlowChart";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

const TABS = [
  { id: "pnl", label: "Profit & Loss" },
  { id: "sales", label: "Sales" },
  { id: "expenses", label: "Expenses" },
  { id: "investments", label: "Investments" },
  { id: "cash-flow", label: "Cash Flow" },
  { id: "products", label: "Products" },
  { id: "customers", label: "Customers" },
];

const PRESETS = [
  { id: "thisMonth", label: "This Month" },
  { id: "lastMonth", label: "Last Month" },
  { id: "thisYear", label: "This Year" },
  { id: "all", label: "All time" },
];

function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function downloadCSV(filename, rows) {
  const escape = (cell) => {
    const str = cell == null ? "" : String(cell);
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };
  const csv = rows.map((row) => row.map(escape).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function handlePrint(title, headers, rows) {
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) return;
  const thead = headers.map((h) => `<th>${h}</th>`).join("");
  const tbody = rows
    .map(
      (row) =>
        `<tr>${row.map((cell) => `<td>${String(cell ?? "")}</td>`).join("")}</tr>`,
    )
    .join("");
  win.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; }
          h1 { font-size: 18px; margin-bottom: 16px; }
          table { border-collapse: collapse; width: 100%; font-size: 13px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
          th { background: #f1f5f9; }
          tr:nth-child(even) td { background: #f8fafc; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <table>
          <thead><tr>${thead}</tr></thead>
          <tbody>${tbody}</tbody>
        </table>
      </body>
    </html>
  `);
  win.document.close();
  win.focus();
  win.print();
}

function buildExportContent(tab, report) {
  if (!report) return null;
  if (Array.isArray(report)) {
    if (tab !== "customers") return null;
    return {
      title: "Customers Report",
      headers: ["Name", "Phone", "Purchases", "Paid", "Due"],
      rows: report.map((c) => [
        c.name || "",
        c.phone || "",
        c.totalPurchases ?? 0,
        c.totalPaid ?? 0,
        c.dueAmount ?? 0,
      ]),
    };
  }
  const d = report;
  switch (tab) {
    case "pnl":
      return {
        title: "Profit & Loss Report",
        headers: ["Item", "Amount"],
        rows: [
          ["Gross Revenue", d.grossRevenue ?? 0],
          ["Sales Count", d.salesCount ?? 0],
          ["Total Cost", d.totalCost ?? 0],
          ["Gross Profit", d.grossProfit ?? 0],
          ["Operating Expenses", d.operatingExpenses ?? 0],
          [
            (d.netProfit ?? 0) >= 0 ? "Net Profit" : "Net Loss",
            (d.netProfit ?? 0) >= 0 ? d.netProfit : (d.netLoss ?? 0),
          ],
        ],
      };
    case "sales":
      return {
        title: "Sales Report",
        headers: ["Product", "Quantity", "Revenue"],
        rows: (d.byProduct || []).map((p) => [
          p._id || p.name || "Unknown",
          p.quantity || 0,
          p.revenue || 0,
        ]),
      };
    case "expenses":
      return {
        title: "Expenses Report",
        headers: ["Category", "Amount", "Count"],
        rows: (d.byCategory || []).map((c) => [
          c._id || "Other",
          c.total || 0,
          c.count || 0,
        ]),
      };
    case "investments":
      return {
        title: "Investment Report",
        headers: ["Type", "Amount", "Count"],
        rows: (d.byType || []).map((t) => [
          t._id || "Other",
          t.total || 0,
          t.count || 0,
        ]),
      };
    case "cash-flow": {
      const rows = [
        ["Opening Balance", d.openingBalance ?? 0],
        ["Income", d.income ?? 0],
        ["Investment", d.investment ?? 0],
        ["Expenses", d.expenses ?? 0],
        ["Purchases", d.purchases ?? 0],
        ["Withdrawals", d.withdrawals ?? 0],
        ["Closing Balance", d.closingBalance ?? 0],
      ];
      return { title: "Cash Flow Report", headers: ["Item", "Amount"], rows };
    }
    case "products": {
      const soldMap = {};
      (d.salesByProduct || []).forEach((s) => {
        soldMap[s._id] = s;
      });
      const rows = (d.products || []).map((p) => {
        const info = soldMap[p._id] || {};
        return [
          p.name || "",
          info.quantitySold || 0,
          info.revenue || 0,
          p.stock ?? 0,
        ];
      });
      return {
        title: "Products Report",
        headers: ["Name", "Quantity Sold", "Revenue", "Stock"],
        rows,
      };
    }
    default:
      return null;
  }
}

function isEmptyReport(tab, report) {
  if (!report) return true;
  if (Array.isArray(report)) return report.length === 0;
  const d = report;
  switch (tab) {
    case "pnl":
      return (
        !d.grossRevenue &&
        !d.totalCost &&
        !d.operatingExpenses &&
        !d.totalInvestment
      );
    case "sales":
    case "expenses":
    case "investments": {
      const s = d.summary || {};
      return !s.total && !s.count;
    }
    case "cash-flow":
      return (
        !d.income &&
        !d.investment &&
        !d.expenses &&
        !d.purchases &&
        !d.withdrawals
      );
    case "products":
      return (
        (!d.products || d.products.length === 0) &&
        (!d.salesByProduct || d.salesByProduct.length === 0)
      );
    default:
      return false;
  }
}

function PnlReport({ data, currency }) {
  const netProfit = data.netProfit ?? 0;
  const steps = [
    {
      label: "Gross Revenue",
      value: data.grossRevenue ?? 0,
      sign: 1,
      isTotal: false,
    },
    {
      label: "Total Cost",
      value: data.totalCost ?? 0,
      sign: -1,
      isTotal: false,
    },
    {
      label: "Gross Profit",
      value: data.grossProfit ?? 0,
      sign: 1,
      isTotal: true,
    },
    {
      label: "Operating Expenses",
      value: data.operatingExpenses ?? 0,
      sign: -1,
      isTotal: false,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Gross Revenue"
          value={formatMoney(data.grossRevenue ?? 0, currency)}
          icon={<Banknote className="w-5 h-5" />}
          color="primary"
        />
        <StatCard
          title="Total Cost"
          value={formatMoney(data.totalCost ?? 0, currency)}
          icon={<Coins className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          title="Gross Profit"
          value={formatMoney(data.grossProfit ?? 0, currency)}
          icon={<TrendingUp className="w-5 h-5" />}
          color="purple"
        />
        <StatCard
          title="Operating Expenses"
          value={formatMoney(data.operatingExpenses ?? 0, currency)}
          icon={<Layers className="w-5 h-5" />}
          color="amber"
        />
        <StatCard
          title={netProfit >= 0 ? "Net Profit" : "Net Loss"}
          value={formatMoney(
            netProfit >= 0 ? netProfit : (data.netLoss ?? 0),
            currency,
          )}
          icon={
            netProfit >= 0 ? (
              <TrendingUp className="w-5 h-5" />
            ) : (
              <TrendingDown className="w-5 h-5" />
            )
          }
          color={netProfit >= 0 ? "green" : "red"}
        />
      </div>

      <div className="bg-surface-soft border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-base font-semibold text-ink">
            Profit & Loss Breakdown
          </h3>
          <p className="text-sm text-ink-muted mt-0.5">
            How the net figure is calculated
          </p>
        </div>
        <div className="px-6 py-5 space-y-3">
          {steps.map((step) => (
            <div
              key={step.label}
              className="flex items-center justify-between text-sm"
            >
              <span
                className={
                  step.isTotal ? "font-semibold text-ink" : "text-ink-soft"
                }
              >
                {step.label}
              </span>
              <span
                className={`${step.isTotal ? "font-bold text-ink" : "font-medium"} ${
                  step.sign < 0
                    ? "text-red-600 dark:text-red-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {step.sign < 0 ? "-" : "+"}
                {formatMoney(step.value, currency)}
              </span>
            </div>
          ))}
          <div className="border-t border-border pt-3 flex items-center justify-between text-sm">
            <span className="font-semibold text-ink">
              Net {netProfit >= 0 ? "Profit" : "Loss"}
            </span>
            <span
              className={`font-bold ${netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
            >
              {formatMoney(
                netProfit >= 0 ? netProfit : (data.netLoss ?? 0),
                currency,
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SalesReport({ data, currency }) {
  const summary = data.summary || {};
  const byProduct = data.byProduct || [];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Sales"
          value={formatMoney(summary.total ?? 0, currency)}
          icon={<Banknote className="w-5 h-5" />}
          color="primary"
        />
        <StatCard
          title="Total Profit"
          value={formatMoney(summary.profit ?? 0, currency)}
          icon={<Wallet className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          title="Total Cost"
          value={formatMoney(summary.cost ?? 0, currency)}
          icon={<Coins className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          title="Sales Count"
          value={summary.count ?? 0}
          icon={<ShoppingBag className="w-5 h-5" />}
          color="purple"
        />
      </div>

      <div className="bg-surface-soft border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-base font-semibold text-ink">
            Best Selling Products
          </h3>
        </div>
        {!byProduct.length ? (
          <EmptyState
            title="No products sold"
            description="No sales were recorded in this period."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-ink-muted border-b border-border">
                  <th className="px-6 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium text-right">Quantity</th>
                  <th className="px-6 py-3 font-medium text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {byProduct.map((item) => (
                  <tr
                    key={item._id || item.name}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                  >
                    <td className="px-6 py-3 text-ink">
                      {item._id || item.name || "Unknown"}
                    </td>
                    <td className="px-4 py-3 text-right text-ink">
                      {item.quantity ?? 0}
                    </td>
                    <td className="px-6 py-3 text-right text-ink font-medium">
                      {formatMoney(item.revenue ?? 0, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ExpensesReport({ data, currency }) {
  const summary = data.summary || {};
  const byCategory = data.byCategory || [];
  const max = Math.max(...byCategory.map((c) => c.total || 0), 1);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          title="Total Expenses"
          value={formatMoney(summary.total ?? 0, currency)}
          icon={<Wallet className="w-5 h-5" />}
          color="red"
        />
        <StatCard
          title="Expense Count"
          value={summary.count ?? 0}
          icon={<ShoppingBag className="w-5 h-5" />}
          color="amber"
        />
      </div>

      <div className="bg-surface-soft border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-base font-semibold text-ink">
            Category Breakdown
          </h3>
        </div>
        {!byCategory.length ? (
          <EmptyState
            title="No expenses"
            description="No expenses were recorded in this period."
          />
        ) : (
          <div className="px-6 py-5 space-y-5">
            {byCategory.map((cat) => (
              <div key={cat._id}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-ink">{capitalize(cat._id)}</span>
                  <span className="text-ink-soft">
                    {formatMoney(cat.total ?? 0, currency)}
                    <span className="ml-2 text-xs text-ink-muted">
                      ({cat.count ?? 0})
                    </span>
                  </span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-600 rounded-full transition-all"
                    style={{ width: `${((cat.total || 0) / max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InvestmentsReport({ data, currency }) {
  const summary = data.summary || {};
  const byType = data.byType || [];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          title="Total Invested"
          value={formatMoney(summary.total ?? 0, currency)}
          icon={<CircleDollarSign className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          title="Investment Count"
          value={summary.count ?? 0}
          icon={<Layers className="w-5 h-5" />}
          color="blue"
        />
      </div>

      <div className="bg-surface-soft border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-base font-semibold text-ink">By Type</h3>
        </div>
        {!byType.length ? (
          <EmptyState
            title="No investments"
            description="No investments were recorded in this period."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-ink-muted border-b border-border">
                  <th className="px-6 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium text-right">Amount</th>
                  <th className="px-6 py-3 font-medium text-right">Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {byType.map((item) => (
                  <tr
                    key={item._id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                  >
                    <td className="px-6 py-3 text-ink">
                      {capitalize(item._id)}
                    </td>
                    <td className="px-4 py-3 text-right text-ink font-medium">
                      {formatMoney(item.total ?? 0, currency)}
                    </td>
                    <td className="px-6 py-3 text-right text-ink">
                      {item.count ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function CashFlowReport({ data, currency }) {
  const inflow = [data.income ?? 0, data.investment ?? 0, 0, 0, 0];
  const outflow = [
    0,
    0,
    data.expenses ?? 0,
    data.purchases ?? 0,
    data.withdrawals ?? 0,
  ];
  const labels = [
    "Income",
    "Investment",
    "Expenses",
    "Purchases",
    "Withdrawals",
  ];
  const closing = data.closingBalance ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard
          title="Opening Balance"
          value={formatMoney(data.openingBalance ?? 0, currency)}
          icon={<Wallet className="w-5 h-5" />}
          color="gray"
        />
        <StatCard
          title="Income"
          value={formatMoney(data.income ?? 0, currency)}
          icon={<Banknote className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          title="Investment"
          value={formatMoney(data.investment ?? 0, currency)}
          icon={<CircleDollarSign className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          title="Expenses"
          value={formatMoney(data.expenses ?? 0, currency)}
          icon={<ArrowRightLeft className="w-5 h-5" />}
          color="red"
        />
        <StatCard
          title="Purchases"
          value={formatMoney(data.purchases ?? 0, currency)}
          icon={<ShoppingBag className="w-5 h-5" />}
          color="amber"
        />
        <StatCard
          title="Withdrawals"
          value={formatMoney(data.withdrawals ?? 0, currency)}
          icon={<Coins className="w-5 h-5" />}
          color="purple"
        />
        <StatCard
          title="Closing Balance"
          value={formatMoney(closing, currency)}
          icon={<Wallet className="w-5 h-5" />}
          color={closing >= 0 ? "green" : "red"}
        />
      </div>

      <div className="bg-surface-soft border border-border rounded-2xl shadow-sm p-6">
        <h3 className="text-base font-semibold text-ink mb-4">
          Cash Flow Overview
        </h3>
        <CashFlowChart labels={labels} inflow={inflow} outflow={outflow} />
      </div>
    </div>
  );
}

function ProductsReport({ data, currency }) {
  const soldMap = {};
  (data.salesByProduct || []).forEach((s) => {
    soldMap[s._id] = s;
  });
  const products = data.products || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Products"
          value={products.length}
          icon={<Package className="w-5 h-5" />}
          color="primary"
        />
        <StatCard
          title="Units Sold"
          value={(data.salesByProduct || []).reduce(
            (sum, s) => sum + (s.quantitySold || 0),
            0,
          )}
          icon={<ShoppingBag className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          title="Revenue"
          value={formatMoney(
            (data.salesByProduct || []).reduce(
              (sum, s) => sum + (s.revenue || 0),
              0,
            ),
            currency,
          )}
          icon={<Banknote className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          title="Low Stock Items"
          value={products.filter((p) => p.stock <= p.lowStockWarning).length}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="red"
        />
      </div>

      <div className="bg-surface-soft border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-base font-semibold text-ink">
            Products Performance
          </h3>
        </div>
        {!products.length ? (
          <EmptyState
            title="No products"
            description="Add products to see how they perform."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-ink-muted border-b border-border">
                  <th className="px-6 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium text-right">
                    Quantity Sold
                  </th>
                  <th className="px-4 py-3 font-medium text-right">Revenue</th>
                  <th className="px-4 py-3 font-medium text-right">Stock</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((product) => {
                  const info = soldMap[product._id] || {};
                  const lowStock =
                    product.stock <= (product.lowStockWarning ?? 5);
                  return (
                    <tr
                      key={product._id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="px-6 py-3 text-ink font-medium">
                        {product.name}
                      </td>
                      <td className="px-4 py-3 text-right text-ink">
                        {info.quantitySold || 0}
                      </td>
                      <td className="px-4 py-3 text-right text-ink font-medium">
                        {formatMoney(info.revenue || 0, currency)}
                      </td>
                      <td className="px-4 py-3 text-right text-ink">
                        {product.stock ?? 0}
                      </td>
                      <td className="px-6 py-3">
                        {lowStock ? (
                          <Badge color="red">Low stock</Badge>
                        ) : (
                          <Badge color="green">In stock</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function CustomersReport({ data, currency }) {
  const customers = Array.isArray(data) ? data : [];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Customers"
          value={customers.length}
          icon={<Users className="w-5 h-5" />}
          color="primary"
        />
        <StatCard
          title="Total Purchases"
          value={formatMoney(
            customers.reduce((sum, c) => sum + (c.totalPurchases || 0), 0),
            currency,
          )}
          icon={<Banknote className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          title="Total Due"
          value={formatMoney(
            customers.reduce((sum, c) => sum + (c.dueAmount || 0), 0),
            currency,
          )}
          icon={<Coins className="w-5 h-5" />}
          color="red"
        />
      </div>

      <div className="bg-surface-soft border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-base font-semibold text-ink">Customer Summary</h3>
        </div>
        {!customers.length ? (
          <EmptyState
            title="No customers"
            description="Customers will appear here once they place orders."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-ink-muted border-b border-border">
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium text-right">
                    Purchases
                  </th>
                  <th className="px-4 py-3 font-medium text-right">Paid</th>
                  <th className="px-6 py-3 font-medium text-right">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {customers.map((customer) => (
                  <tr
                    key={customer._id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                  >
                    <td className="px-6 py-3 text-ink font-medium">
                      {customer.name}
                    </td>
                    <td className="px-4 py-3 text-ink-soft">
                      {customer.phone || "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-ink">
                      {formatMoney(customer.totalPurchases ?? 0, currency)}
                    </td>
                    <td className="px-4 py-3 text-right text-ink">
                      {formatMoney(customer.totalPaid ?? 0, currency)}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span
                        className={`font-medium ${(customer.dueAmount || 0) > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}
                      >
                        {formatMoney(customer.dueAmount ?? 0, currency)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const { business } = useAuth();
  const currency = business?.currency || "BDT";
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activeTab, setActiveTab] = useState("pnl");
  const [activePreset, setActivePreset] = useState("thisMonth");

  const {
    data: report,
    loading,
    error,
    refetch,
  } = useFetch(`/reports/${activeTab}`, {
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const applyPreset = (id) => {
    const now = new Date();
    setActivePreset(id);
    if (id === "thisMonth") {
      setStartDate(toISODate(new Date(now.getFullYear(), now.getMonth(), 1)));
      setEndDate(toISODate(now));
    } else if (id === "lastMonth") {
      setStartDate(
        toISODate(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
      );
      setEndDate(toISODate(new Date(now.getFullYear(), now.getMonth(), 0)));
    } else if (id === "thisYear") {
      setStartDate(toISODate(new Date(now.getFullYear(), 0, 1)));
      setEndDate(toISODate(now));
    } else {
      setStartDate("");
      setEndDate("");
    }
  };

  const handleDateChange = (setter) => (value) => {
    setActivePreset(null);
    setter(value);
  };

  const exportContent = buildExportContent(activeTab, report);
  const empty = isEmptyReport(activeTab, report);

  const renderReport = () => {
    if (loading) return <LoadingSpinner label="Loading report..." />;
    if (error) return <ErrorState message={error} onRetry={refetch} />;
    if (empty)
      return (
        <EmptyState
          title="No data for this period"
          description="Try a different date range or record some activity first."
        />
      );
    const d = report;
    switch (activeTab) {
      case "pnl":
        return <PnlReport data={d} currency={currency} />;
      case "sales":
        return <SalesReport data={d} currency={currency} />;
      case "expenses":
        return <ExpensesReport data={d} currency={currency} />;
      case "investments":
        return <InvestmentsReport data={d} currency={currency} />;
      case "cash-flow":
        return <CashFlowReport data={d} currency={currency} />;
      case "products":
        return <ProductsReport data={d} currency={currency} />;
      case "customers":
        return <CustomersReport data={d} currency={currency} />;
      default:
        return null;
    }
  };

  return (
    <SubscriptionGuard feature="advancedReports">
      <div className="space-y-6">
        <PageHeader
          title="Reports"
          description="Get detailed insights into the financial health of your business"
        />

        {/* Filters */}
        <div className="bg-surface-soft border border-border rounded-2xl shadow-sm p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  activePreset === preset.id
                    ? "bg-primary-600 text-white shadow-sm"
                    : "bg-surface-soft border border-border text-ink-muted hover:text-ink hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartChange={handleDateChange(setStartDate)}
            onEndChange={handleDateChange(setEndDate)}
          />
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition ${
                tab.id === activeTab
                  ? "bg-primary-600 text-white shadow-sm"
                  : "bg-surface-soft border border-border text-ink-muted hover:text-ink hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Export actions */}
        {!loading && !error && exportContent && (
          <SubscriptionGuard feature="pdfExport">
            <div className="flex flex-wrap items-center gap-3">
              <Button
                size="sm"
                variant="outline"
                icon={<Download className="w-4 h-4" />}
                onClick={() =>
                  downloadCSV(`${activeTab}-report.csv`, [
                    exportContent.headers,
                    ...exportContent.rows,
                  ])
                }
              >
                Export CSV
              </Button>
              <Button
                size="sm"
                variant="outline"
                icon={<Printer className="w-4 h-4" />}
                onClick={() =>
                  handlePrint(
                    exportContent.title,
                    exportContent.headers,
                    exportContent.rows,
                  )
                }
              >
                Print
              </Button>
            </div>
          </SubscriptionGuard>
        )}

        {renderReport()}
      </div>
    </SubscriptionGuard>
  );
}
