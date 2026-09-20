"use client";

import { useState, useEffect } from "react";
import { Layers, Crown, Boxes, CalendarClock } from "lucide-react";
import { useFetch, usePagination } from "@/hooks";
import { formatDate, capitalize } from "@/constants";
import AdminLayout from "@/components/layout/AdminLayout";
import PageHeader from "@/components/common/PageHeader";
import StatCard from "@/components/common/StatCard";
import FilterBar from "@/components/common/FilterBar";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import Pagination from "@/components/common/Pagination";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Badge from "@/components/ui/Badge";
import Select from "@/components/ui/Select";

const ID = (item) => item._id || item.id;

export default function AdminSubscriptionsPage() {
  const { page, limit, setPage } = usePagination(1);

  const [plan, setPlan] = useState("all");
  const [status, setStatus] = useState("all");

  const params = {
    page,
    limit,
    plan: plan === "all" ? undefined : plan,
    status: status === "all" ? undefined : status,
  };

  const {
    data: subscriptions,
    loading,
    error,
    pagination,
    refetch,
  } = useFetch("/admin/subscriptions", params);

  useEffect(() => {
    setPage(1);
  }, [plan, status, setPage]);

  const activeCount = subscriptions?.filter((s) => s.status !== "expired").length || 0;
  const expiredCount = subscriptions?.filter((s) => s.status === "expired").length || 0;

  const userOf = (sub) =>
    sub.userId?.name || sub.user?.name || sub.userName || "Unknown user";
  const businessOf = (sub) =>
    sub.businessId?.name || sub.business?.name || sub.businessName || "—";

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader title="Subscriptions" description="All business subscriptions and their status" />

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Total Subscriptions"
            value={loading ? "—" : (pagination?.total ?? subscriptions?.length ?? 0)}
            icon={<Layers className="w-5 h-5" />}
            color="blue"
          />
          <StatCard
            title="Active"
            value={loading ? "—" : activeCount}
            icon={<CalendarClock className="w-5 h-5" />}
            color="green"
          />
          <StatCard
            title="Expired"
            value={loading ? "—" : expiredCount}
            icon={<CalendarClock className="w-5 h-5" />}
            color="red"
          />
        </div>

        {/* Filters */}
        <FilterBar>
          <Select
            label="Plan"
            className="w-full sm:w-40"
            options={[
              { value: "all", label: "All plans" },
              { value: "free", label: "Free" },
              { value: "pro", label: "Pro" },
            ]}
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
          />
          <Select
            label="Status"
            className="w-full sm:w-40"
            options={[
              { value: "all", label: "All statuses" },
              { value: "active", label: "Active" },
              { value: "expired", label: "Expired" },
            ]}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          />
        </FilterBar>

        {/* Table */}
        <div className="bg-surface-soft border border-border rounded-2xl overflow-hidden">
          {loading ? (
            <LoadingSpinner label="Loading subscriptions..." />
          ) : error ? (
            <ErrorState message={error} onRetry={refetch} />
          ) : !subscriptions?.length ? (
            <EmptyState
              icon={<Layers className="w-7 h-7 text-ink-muted" />}
              title="No subscriptions found"
              description={
                plan !== "all" || status !== "all"
                  ? "Try adjusting your filters."
                  : "No subscriptions have been created yet."
              }
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-ink-muted border-b border-border">
                      <th className="px-6 py-3 font-medium">User</th>
                      <th className="px-4 py-3 font-medium">Business</th>
                      <th className="px-4 py-3 font-medium">Plan</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Start Date</th>
                      <th className="px-4 py-3 font-medium">Expiry Date</th>
                      <th className="px-6 py-3 font-medium">Payment ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {subscriptions.map((subscription) => {
                      const isExpired =
                        subscription.status === "expired" || subscription.isExpired === true;
                      const subPlan = subscription.plan || "free";
                      return (
                        <tr
                          key={ID(subscription)}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                        >
                          <td className="px-6 py-3">
                            <p className="text-ink font-medium">{userOf(subscription)}</p>
                            {subscription.userId?.email && (
                              <p className="text-xs text-ink-muted truncate max-w-[200px]">
                                {subscription.userId.email}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-ink-soft truncate max-w-[180px]">
                            {businessOf(subscription)}
                          </td>
                          <td className="px-4 py-3">
                            <Badge color={subPlan === "pro" ? "blue" : "gray"}>
                              <span className="inline-flex items-center gap-1">
                                {subPlan === "pro" ? (
                                  <Crown className="w-3.5 h-3.5" />
                                ) : (
                                  <Boxes className="w-3.5 h-3.5" />
                                )}
                                {capitalize(subPlan)}
                              </span>
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge color={isExpired ? "red" : "green"}>
                              {isExpired ? "Expired" : "Active"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-ink-soft whitespace-nowrap">
                            {formatDate(subscription.startDate)}
                          </td>
                          <td className="px-4 py-3 text-ink-soft whitespace-nowrap">
                            {formatDate(subscription.expiryDate)}
                          </td>
                          <td className="px-6 py-3 text-ink-soft">
                            {subscription.paymentId || subscription.payment?._id || "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {pagination && pagination.pages > 1 && (
                <div className="px-6 py-4 border-t border-border">
                  <Pagination
                    page={pagination.page}
                    pages={pagination.pages}
                    total={pagination.total}
                    onChange={setPage}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}