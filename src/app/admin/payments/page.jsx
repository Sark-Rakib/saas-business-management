"use client";

import { useState } from "react";
import {
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Smartphone,
  Crown,
} from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { useFetch, useMutation, usePagination } from "@/hooks";
import { getErrorMessage } from "@/lib/api";
import { formatMoney, formatDate, capitalize } from "@/constants";
import AdminLayout from "@/components/layout/AdminLayout";
import PageHeader from "@/components/common/PageHeader";
import StatCard from "@/components/common/StatCard";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import Pagination from "@/components/common/Pagination";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

const ID = (item) => item._id || item.id;

const STATUS_TABS = [
  { value: "all", label: "All", color: "blue" },
  { value: "pending", label: "Pending", color: "amber" },
  { value: "approved", label: "Approved", color: "green" },
  { value: "rejected", label: "Rejected", color: "red" },
];

function statusColor(status) {
  if (status === "approved") return "green";
  if (status === "rejected") return "red";
  if (status === "pending") return "amber";
  return "gray";
}

export default function AdminPaymentsPage() {
  const { showToast } = useToast();
  const { page, limit, setPage } = usePagination(1);
  const { patch, loading: mutating } = useMutation();

  const [statusFilter, setStatusFilter] = useState("all");
  const [viewing, setViewing] = useState(null);
  const [reviewAction, setReviewAction] = useState(null);
  const [reviewNote, setReviewNote] = useState("");

  const params = {
    page,
    limit,
    status: statusFilter === "all" ? undefined : statusFilter,
  };

  const { data: payments, loading, error, pagination, refetch } = useFetch(
    "/admin/payments",
    params
  );

  const pendingQuery = useFetch("/admin/payments", { status: "pending", limit: 1 });
  const approvedQuery = useFetch("/admin/payments", { status: "approved", limit: 1 });
  const rejectedQuery = useFetch("/admin/payments", { status: "rejected", limit: 1 });

  const pendingCount = pendingQuery.pagination?.total ?? pendingQuery.data?.length ?? 0;
  const approvedCount = approvedQuery.pagination?.total ?? approvedQuery.data?.length ?? 0;
  const rejectedCount = rejectedQuery.pagination?.total ?? rejectedQuery.data?.length ?? 0;

  const openReview = (payment) => {
    setViewing(payment);
    setReviewAction(null);
    setReviewNote("");
  };

  const closeReview = () => {
    setViewing(null);
    setReviewAction(null);
    setReviewNote("");
  };

  const handleReview = async (status) => {
    if (!viewing) return;
    try {
      await patch(`/admin/payments/${ID(viewing)}/review`, {
        status,
        ...(status === "rejected" && reviewNote ? { reviewNote } : {}),
      });
      showToast(status === "approved" ? "Payment approved" : "Payment rejected", "success");
      closeReview();
      refetch();
      pendingQuery.refetch();
      approvedQuery.refetch();
      rejectedQuery.refetch();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    }
  };

  const userName = (payment) =>
    payment.userId?.name || payment.user?.name || payment.userName || "Unknown user";
  const businessName = (payment) =>
    payment.businessId?.name || payment.business?.name || payment.businessName || "—";

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader title="Payment Requests" description="Review and approve subscription payments" />

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Pending"
            value={pendingCount}
            icon={<Clock className="w-5 h-5" />}
            color="amber"
          />
          <StatCard
            title="Approved"
            value={approvedCount}
            icon={<CheckCircle2 className="w-5 h-5" />}
            color="green"
          />
          <StatCard
            title="Rejected"
            value={rejectedCount}
            icon={<XCircle className="w-5 h-5" />}
            color="red"
          />
        </div>

        {/* Status tabs */}
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((tab) => {
            const count =
              tab.value === "pending"
                ? pendingCount
                : tab.value === "approved"
                ? approvedCount
                : tab.value === "rejected"
                ? rejectedCount
                : pendingCount + approvedCount + rejectedCount;
            const active = statusFilter === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => {
                  setStatusFilter(tab.value);
                  setPage(1);
                }}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-primary-600 text-white shadow-sm"
                    : "bg-surface-soft border border-border text-ink hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                {tab.label}
                <span
                  className={`text-xs font-semibold ${
                    active ? "text-white/80" : "text-ink-muted"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Table */}
        <div className="bg-surface-soft border border-border rounded-2xl overflow-hidden">
          {loading ? (
            <LoadingSpinner label="Loading payments..." />
          ) : error ? (
            <ErrorState message={error} onRetry={refetch} />
          ) : !payments?.length ? (
            <EmptyState
              icon={<CreditCard className="w-7 h-7 text-ink-muted" />}
              title="No payment requests"
              description={
                statusFilter === "all"
                  ? "Payment requests from users will appear here."
                  : "No payments with this status yet."
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
                      <th className="px-4 py-3 font-medium text-right">Amount</th>
                      <th className="px-4 py-3 font-medium">Method</th>
                      <th className="px-4 py-3 font-medium">Transaction ID</th>
                      <th className="px-4 py-3 font-medium">Sender</th>
                      <th className="px-4 py-3 font-medium">Payment Date</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Reviewed At</th>
                      <th className="px-6 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {payments.map((payment) => (
                      <tr
                        key={ID(payment)}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                      >
                        <td className="px-6 py-3">
                          <p className="text-ink font-medium">{userName(payment)}</p>
                          {payment.userId?.email && (
                            <p className="text-xs text-ink-muted truncate max-w-[180px]">
                              {payment.userId.email}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-ink-soft truncate max-w-[160px]">
                          {businessName(payment)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge color={payment.plan === "pro" ? "blue" : "gray"}>
                            <span className="inline-flex items-center gap-1">
                              {payment.plan === "pro" && <Crown className="w-3.5 h-3.5" />}
                              {capitalize(payment.plan)}
                            </span>
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right text-ink font-medium">
                          {formatMoney(payment.amount)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge color="blue">
                            <span className="inline-flex items-center gap-1">
                              <Smartphone className="w-3.5 h-3.5" />
                              {capitalize(payment.paymentMethod)}
                            </span>
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-ink font-medium">
                          {payment.transactionId || "—"}
                        </td>
                        <td className="px-4 py-3 text-ink-soft">{payment.senderNumber || "—"}</td>
                        <td className="px-4 py-3 text-ink-soft whitespace-nowrap">
                          {formatDate(payment.paymentDate || payment.createdAt, true)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge color={statusColor(payment.status)}>
                            {capitalize(payment.status)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-ink-soft whitespace-nowrap">
                          {formatDate(payment.reviewedAt, true)}
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center justify-end">
                            <Button
                              size="sm"
                              variant="secondary"
                              icon={<Eye className="w-4 h-4" />}
                              onClick={() => openReview(payment)}
                            >
                              View
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
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

      {/* Review modal */}
      <Modal
        isOpen={!!viewing}
        onClose={closeReview}
        title="Review Payment"
        size="lg"
        footer={
          viewing && (
            <>
              {reviewAction === "rejected" ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReviewAction(null)}
                    disabled={mutating}
                  >
                    Back
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    loading={mutating}
                    onClick={() => handleReview("rejected")}
                  >
                    Confirm Reject
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" onClick={closeReview} disabled={mutating}>
                    Cancel
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={mutating}
                    onClick={() => setReviewAction("rejected")}
                  >
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    loading={mutating}
                    onClick={() => handleReview("approved")}
                  >
                    Approve
                  </Button>
                </>
              )}
            </>
          )
        }
      >
        {viewing && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-ink-muted">User</p>
                <p className="text-ink font-medium mt-0.5">{userName(viewing)}</p>
              </div>
              <div>
                <p className="text-xs text-ink-muted">Business</p>
                <p className="text-ink font-medium mt-0.5">{businessName(viewing)}</p>
              </div>
              <div>
                <p className="text-xs text-ink-muted">Plan</p>
                <p className="text-ink font-medium mt-0.5">{capitalize(viewing.plan)}</p>
              </div>
              <div>
                <p className="text-xs text-ink-muted">Amount</p>
                <p className="text-ink font-semibold mt-0.5">{formatMoney(viewing.amount)}</p>
              </div>
              <div>
                <p className="text-xs text-ink-muted">Payment Method</p>
                <p className="text-ink font-medium mt-0.5">
                  {capitalize(viewing.paymentMethod)}
                </p>
              </div>
              <div>
                <p className="text-xs text-ink-muted">Transaction ID</p>
                <p className="text-ink font-medium mt-0.5">{viewing.transactionId || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-ink-muted">Sender</p>
                <p className="text-ink font-medium mt-0.5">{viewing.senderNumber || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-ink-muted">Payment Date</p>
                <p className="text-ink font-medium mt-0.5">
                  {formatDate(viewing.paymentDate || viewing.createdAt, true)}
                </p>
              </div>
              <div>
                <p className="text-xs text-ink-muted">Status</p>
                <div className="mt-0.5">
                  <Badge color={statusColor(viewing.status)}>
                    {capitalize(viewing.status)}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-xs text-ink-muted">Reviewed At</p>
                <p className="text-ink font-medium mt-0.5">
                  {formatDate(viewing.reviewedAt, true)}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-ink-muted">Review Note</p>
                <p className="text-ink font-medium mt-0.5">{viewing.reviewNote || "—"}</p>
              </div>
            </div>

            {reviewAction === "rejected" && (
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">
                  Review Note (optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Reason for rejecting this payment..."
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface-soft px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition"
                />
              </div>
            )}
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}