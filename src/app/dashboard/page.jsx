"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Banknote,
  Receipt,
  TrendingUp,
  Wallet,
  PiggyBank,
  HandCoins,
  CreditCard,
  Users,
  ShoppingCart,
  ReceiptText,
  BadgeDollarSign,
  Hash,
  Package,
  Boxes,
  AlertTriangle,
  XCircle,
  UserPlus,
  ArrowDownToLine,
  Building2,
  ArrowLeftRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useFetch } from "@/hooks";
import { formatMoney } from "@/constants";
import PageHeader from "@/components/common/PageHeader";
import StatCard from "@/components/common/StatCard";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import Button from "@/components/ui/Button";
import RevenueExpenseChart from "@/components/charts/RevenueExpenseChart";
import ProfitLossChart from "@/components/charts/ProfitLossChart";
import ExpenseCategoryChart from "@/components/charts/ExpenseCategoryChart";
import CashFlowChart from "@/components/charts/CashFlowChart";

const PERIODS = [
  { key: "today", label: "Today" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
  { key: "lastMonth", label: "Last Month" },
  { key: "year", label: "Year" },
];

const actColor = {
  primary: "bg-primary-100 text-primary-600 dark:bg-primary-500/15 dark:text-primary-400",
  green: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
  red: "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400",
  amber: "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
  blue: "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
  purple: "bg-purple-100 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400",
};

const QUICK_ACTIONS = [
  { href: "/dashboard/sales?new=1", label: "Record Sale", icon: ShoppingCart, color: "primary" },
  { href: "/dashboard/customers?new=1", label: "Add Customer", icon: UserPlus, color: "green" },
  { href: "/dashboard/products?new=1", label: "Add Product", icon: Package, color: "blue" },
  { href: "/dashboard/expenses?new=1", label: "Add Expense", icon: Receipt, color: "red" },
  { href: "/dashboard/purchases?new=1", label: "Add Purchase", icon: ArrowDownToLine, color: "amber" },
  { href: "/dashboard/suppliers?new=1", label: "Add Supplier", icon: Building2, color: "purple" },
  { href: "/dashboard/investments?new=1", label: "Add Investment", icon: PiggyBank, color: "amber" },
  { href: "/dashboard/transactions?new=1", label: "New Transaction", icon: ArrowLeftRight, color: "blue" },
];

function QuickActions() {
  return (
    <div className="bg-surface-soft border border-border rounded-2xl p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-ink mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {QUICK_ACTIONS.map(({ href, label, icon: Icon, color }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-center gap-3 rounded-xl border border-border bg-surface-card p-3 transition hover:border-primary-400 hover:shadow-sm"
          >
            <span className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center ${actColor[color]}`}>
              <Icon className="w-5 h-5" />
            </span>
            <span className="text-xs sm:text-sm font-medium text-ink group-hover:text-primary-600 transition">
              {label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-9 w-28 rounded-xl" />
      </div>

      <div className="flex gap-2">
        {PERIODS.map((p) => (
          <Skeleton key={p.key} className="h-8 w-16 rounded-lg" />
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-surface-soft border border-border rounded-2xl p-5">
            <Skeleton className="h-5 w-36 mb-4" />
            <Skeleton className="h-[320px] rounded-xl" />
          </div>
        ))}
      </div>

      <div className="bg-surface-soft border border-border rounded-2xl p-5">
        <Skeleton className="h-5 w-40 mb-4" />
        <Skeleton className="h-[320px] rounded-xl" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, business } = useAuth();
  const currency = business?.currency || "BDT";

  const [activePeriod, setActivePeriod] = useState("month");

  const {
    data: overview,
    loading: overviewLoading,
    error: overviewError,
    refetch: refetchOverview,
  } = useFetch("/dashboard");

  const {
    data: charts,
    loading: chartsLoading,
    error: chartsError,
    refetch: refetchCharts,
  } = useFetch("/dashboard/charts");

  const loading = overviewLoading || chartsLoading;
  const error = overviewError || chartsError;

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => { refetchOverview(); refetchCharts(); }} />;
  }

  if (!overview?.financialOverview) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          description={`Welcome back, ${user?.name?.split(" ")[0] || "there"}`}
          action={
            <Link href="/dashboard/sales?new=1">
              <Button size="sm">New Sale</Button>
            </Link>
          }
        />
        <QuickActions />
        <EmptyState
          title="No dashboard data"
          description="Start by recording your first transaction."
        />
      </div>
    );
  }

  const { financialOverview: fin, todaysOverview: today, periods, products } = overview;
  const { labels, series, expenseCategories, cashFlow } = charts || {};
  const periodData = periods?.[activePeriod] || {};

  const netProfitDisplay = fin.netProfit > 0 ? formatMoney(fin.netProfit, currency) : `-${formatMoney(fin.netLoss, currency)}`;
  const netProfitColor = fin.netProfit > 0 ? "green" : "red";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${user?.name?.split(" ")[0] || "there"}`}
        action={
          <Link href="/dashboard/sales?new=1">
            <Button size="sm">New Sale</Button>
          </Link>
        }
      />

      {/* Quick Actions */}
      <QuickActions />

      {/* Period Selector */}
      <div className="flex flex-wrap gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => setActivePeriod(p.key)}
            className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition ${
              activePeriod === p.key
                ? "bg-primary-600 text-white shadow-sm"
                : "bg-surface-soft border border-border text-ink-muted hover:text-ink"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Period Summary */}
      {periodData && (
        <div className="bg-surface-soft border border-border rounded-2xl p-4 flex flex-wrap gap-6 text-sm">
          <div>
            <span className="text-ink-muted">Period Revenue</span>
            <p className="font-bold text-ink">{formatMoney(periodData.revenue, currency)}</p>
          </div>
          <div>
            <span className="text-ink-muted">Period Expenses</span>
            <p className="font-bold text-ink">{formatMoney(periodData.expenses, currency)}</p>
          </div>
          <div>
            <span className="text-ink-muted">Period Profit</span>
            <p className={`font-bold ${periodData.profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {periodData.profit >= 0 ? "" : "-"}{formatMoney(Math.abs(periodData.profit || 0), currency)}
            </p>
          </div>
          <div>
            <span className="text-ink-muted">Transactions</span>
            <p className="font-bold text-ink">{periodData.transactions ?? 0}</p>
          </div>
        </div>
      )}

      {/* Financial Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={formatMoney(fin.totalRevenue, currency)}
          icon={<Banknote className="w-5 h-5" />}
          color="primary"
        />
        <StatCard
          title="Total Expenses"
          value={formatMoney(fin.totalExpenses, currency)}
          icon={<Receipt className="w-5 h-5" />}
          color="red"
        />
        <StatCard
          title="Total Investment"
          value={formatMoney(fin.totalInvestment, currency)}
          icon={<TrendingUp className="w-5 h-5" />}
          color="amber"
        />
        <StatCard
          title="Net Profit / Loss"
          value={netProfitDisplay}
          icon={<Wallet className="w-5 h-5" />}
          color={netProfitColor}
        />
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Available Balance"
          value={formatMoney(fin.availableBalance, currency)}
          icon={<PiggyBank className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          title="Receivables"
          value={formatMoney(fin.outstandingReceivables, currency)}
          icon={<HandCoins className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          title="Payables"
          value={formatMoney(fin.outstandingPayables, currency)}
          icon={<CreditCard className="w-5 h-5" />}
          color="primary"
        />
        <StatCard
          title="Total Customers"
          value={overview.totalCustomers ?? 0}
          icon={<Users className="w-5 h-5" />}
          color="purple"
        />
      </div>

      {/* Today's Overview */}
      {today && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Today's Sales"
            value={formatMoney(today.todaysSales, currency)}
            icon={<ShoppingCart className="w-5 h-5" />}
            color="green"
          />
          <StatCard
            title="Today's Expenses"
            value={formatMoney(today.todaysExpenses, currency)}
            icon={<ReceiptText className="w-5 h-5" />}
            color="red"
          />
          <StatCard
            title="Today's Profit"
            value={formatMoney(today.todaysProfit, currency)}
            icon={<BadgeDollarSign className="w-5 h-5" />}
            color={today.todaysProfit >= 0 ? "green" : "red"}
          />
          <StatCard
            title="Transactions Today"
            value={today.transactionCount ?? 0}
            icon={<Hash className="w-5 h-5" />}
            color="blue"
          />
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface-soft border border-border rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-ink mb-4">Revenue & Expenses</h3>
          <RevenueExpenseChart labels={labels} revenue={series?.revenue} expenses={series?.expenses} />
        </div>
        <div className="bg-surface-soft border border-border rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-ink mb-4">Profit / Loss</h3>
          <ProfitLossChart labels={labels} profit={series?.profit} />
        </div>
        <div className="bg-surface-soft border border-border rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-ink mb-4">Expense Categories</h3>
          <ExpenseCategoryChart data={expenseCategories} />
        </div>
        <div className="bg-surface-soft border border-border rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-ink mb-4">Monthly Cash Flow</h3>
          <div className="flex gap-4 mb-2 text-xs text-ink-muted">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Inflow (Revenue)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Outflow (Expenses)
            </span>
          </div>
          <CashFlowChart labels={labels} inflow={series?.revenue} outflow={series?.expenses} />
        </div>
      </div>

      {/* Full Width Monthly Performance */}
      {series?.profit && (
        <div className="bg-surface-soft border border-border rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-ink mb-4">Monthly Performance</h3>
          <ProfitLossChart labels={labels} profit={series.profit} />
        </div>
      )}

      {/* Products Strip */}
      {products && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Products"
            value={products.total ?? 0}
            icon={<Package className="w-5 h-5" />}
            color="primary"
          />
          <StatCard
            title="Total Stock"
            value={products.totalStock ?? 0}
            icon={<Boxes className="w-5 h-5" />}
            color="blue"
          />
          <StatCard
            title="Low Stock"
            value={products.lowStock ?? 0}
            icon={<AlertTriangle className="w-5 h-5" />}
            color="amber"
          />
          <StatCard
            title="Out of Stock"
            value={products.outOfStock ?? 0}
            icon={<XCircle className="w-5 h-5" />}
            color="red"
          />
        </div>
      )}
    </div>
  );
}
