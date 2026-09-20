"use client";

import { useState } from "react";
import { PieChart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useFetch } from "@/hooks";
import { formatMoney } from "@/constants";
import PageHeader from "@/components/common/PageHeader";
import SubscriptionGuard from "@/components/common/SubscriptionGuard";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import RevenueExpenseChart from "@/components/charts/RevenueExpenseChart";
import ProfitLossChart from "@/components/charts/ProfitLossChart";
import ExpenseCategoryChart from "@/components/charts/ExpenseCategoryChart";
import SimpleBarChart from "@/components/charts/SimpleBarChart";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";

const PERIODS = [
  { id: "half", label: "6 Months" },
  { id: "year", label: "This Year" },
];

function AnalyticsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Skeleton className="lg:col-span-2 h-[380px] rounded-2xl" />
      <Skeleton className="h-[360px] rounded-2xl" />
      <Skeleton className="h-[360px] rounded-2xl" />
      <Skeleton className="h-[360px] rounded-2xl" />
      <Skeleton className="h-[360px] rounded-2xl" />
      <Skeleton className="lg:col-span-2 h-[360px] rounded-2xl" />
    </div>
  );
}

function BestSellersCard({ bestSellers = [], currency }) {
  const total = bestSellers.reduce((sum, item) => sum + (item.revenue || 0), 0);

  return (
    <Card title="Best Selling Products" subtitle="Top products by units sold">
      {!bestSellers.length ? (
        <p className="text-sm text-ink-muted py-5 text-center">
          No product sales in this period
        </p>
      ) : (
        <div className="space-y-4">
          {bestSellers.map((item) => {
            const pct =
              total > 0 ? Math.round(((item.revenue || 0) / total) * 100) : 0;
            return (
              <div key={item._id || item.name}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-ink font-medium truncate">
                    {item._id || item.name || "Unknown"}
                  </span>
                  <span className="text-ink-soft text-xs">
                    {item.quantitySold ?? 0} sold ·{" "}
                    {formatMoney(item.revenue ?? 0, currency)}
                  </span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-600 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function CustomerActivityCard({ activity = [], currency }) {
  return (
    <Card
      title="Customer Activity"
      subtitle="Most valuable customers in this period"
    >
      {!activity.length ? (
        <p className="text-sm text-ink-muted py-8 text-center">
          No customer activity in this period
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-ink-muted border-b border-border">
                <th className="py-3 pr-2 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium text-right">Purchases</th>
                <th className="py-3 pl-2 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {activity.map((row, idx) => (
                <tr
                  key={row.customerId || `walkin-${idx}`}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                >
                  <td className="py-3 pr-2 text-ink">
                    {row.customerId ? row.customerId : "Walk-in"}
                  </td>
                  <td className="px-4 py-3 text-right text-ink">
                    {row.purchases ?? 0}
                  </td>
                  <td className="py-3 pl-2 text-right text-ink font-medium">
                    {formatMoney(row.total ?? 0, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

export default function AnalyticsPage() {
  const { business } = useAuth();
  const currency = business?.currency || "BDT";
  const [period, setPeriod] = useState("half");

  const { data, loading, error, refetch } = useFetch("/analytics", { period });

  return (
    <SubscriptionGuard feature="advancedAnalytics">
      <div className="space-y-6">
        <PageHeader
          title="Analytics"
          description="Visualize growth trends and business performance over time"
          action={
            <div className="flex gap-2">
              {PERIODS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPeriod(p.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                    period === p.id
                      ? "bg-primary-600 text-white shadow-sm"
                      : "bg-surface-soft border border-border text-ink-muted hover:text-ink hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          }
        />

        {loading ? (
          <AnalyticsSkeleton />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : !data || !data.labels || !data.labels.length ? (
          <EmptyState
            icon={<PieChart className="w-7 h-7 text-ink-muted" />}
            title="No analytics data"
            description="Record sales and expenses to see your analytics here."
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="lg:col-span-2">
              <Card title="Revenue & Expense Growth">
                <RevenueExpenseChart
                  labels={data.labels}
                  revenue={data.revenueSeries}
                  expenses={data.expenseSeries}
                />
              </Card>
            </div>

            <Card title="Profit Growth">
              <ProfitLossChart
                labels={data.labels}
                profit={data.profitSeries}
              />
            </Card>

            <Card title="Investment Trends">
              <SimpleBarChart
                labels={data.labels}
                data={data.investmentSeries}
                color="#f59e0b"
              />
            </Card>

            <BestSellersCard
              bestSellers={data.bestSellers}
              currency={currency}
            />

            <Card
              title="Expense Categories"
              subtitle="Share of total expenses by category"
            >
              <ExpenseCategoryChart data={data.expenseCategories} />
            </Card>

            <div className="lg:col-span-2">
              <CustomerActivityCard
                activity={data.customerActivity}
                currency={currency}
              />
            </div>
          </div>
        )}
      </div>
    </SubscriptionGuard>
  );
}
