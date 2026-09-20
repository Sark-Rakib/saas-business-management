"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  Trash2,
  Eye,
  Receipt,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useFetch, useMutation, useDebounce, usePagination, useAutoOpenNew } from "@/hooks";
import { getErrorMessage } from "@/lib/api";
import {
  formatMoney,
  formatDate,
  capitalize,
  TRANSACTION_TYPES,
  PAYMENT_METHODS,
} from "@/constants";
import PageHeader from "@/components/common/PageHeader";
import StatCard from "@/components/common/StatCard";
import FilterBar from "@/components/common/FilterBar";
import SearchBar from "@/components/common/SearchBar";
import DateRangePicker from "@/components/common/DateRangePicker";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import Pagination from "@/components/common/Pagination";
import ConfirmModal from "@/components/common/ConfirmModal";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import Skeleton from "@/components/ui/Skeleton";

const TYPE_OPTIONS = [
  { value: "all", label: "All types" },
  ...TRANSACTION_TYPES,
];

const METHOD_OPTIONS = [
  { value: "all", label: "All methods" },
  ...PAYMENT_METHODS,
];

const SORT_OPTIONS = [
  { value: "desc", label: "Date (newest)" },
  { value: "asc", label: "Date (oldest)" },
];

const TYPE_COLORS = {
  sale: "green",
  expense: "red",
  investment: "blue",
  withdrawal: "amber",
  purchase: "purple",
  income: "green",
  refund: "amber",
  other: "gray",
};

const INFLOW_TYPES = new Set(["sale", "income", "investment"]);

const EMPTY_FORM = {
  type: "sale",
  amount: "",
  paymentMethod: "cash",
  date: new Date().toISOString().slice(0, 10),
  description: "",
  reference: "",
};

function typeColor(type) {
  return TYPE_COLORS[type] || "gray";
}

function isInflow(type) {
  return INFLOW_TYPES.has(type);
}

function TableSkeleton({ rows = 6 }) {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 rounded-xl" />
      ))}
    </div>
  );
}

export default function TransactionsPage() {
  const { business } = useAuth();
  const { showToast } = useToast();
  const currency = business?.currency || "BDT";
  const { page, limit, setPage } = usePagination(1);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [type, setType] = useState("all");
  const [paymentMethod, setPaymentMethod] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");
  const [summary, setSummary] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);

  const { post, del, loading: mutating } = useMutation();

  const params = {
    page,
    limit,
    search: debouncedSearch || undefined,
    type: type === "all" ? undefined : type,
    paymentMethod: paymentMethod === "all" ? undefined : paymentMethod,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    sortOrder: sortOrder === "desc" ? undefined : sortOrder,
  };

  const {
    data: transactions,
    loading,
    error,
    pagination,
    refetch,
  } = useFetch("/transactions", params, {
    onSuccess: (res) => setSummary(res.summary || null),
  });

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, type, paymentMethod, startDate, endDate, sortOrder, setPage]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowForm(false);
  };

  const handleOpenCreate = () => {
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowForm(true);
  };

  useAutoOpenNew(handleOpenCreate);

  const handleFieldChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) {
      setFormError("Amount must be greater than 0");
      return;
    }

    const payload = {
      type: form.type,
      amount: Number(form.amount),
      paymentMethod: form.paymentMethod,
      date: form.date,
      description: form.description,
      reference: form.reference,
    };

    try {
      await post("/transactions", payload);
      showToast("Transaction created", "success");
      resetForm();
      refetch();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await del(`/transactions/${deleting._id || deleting.id}`);
      showToast("Transaction deleted", "success");
      setDeleting(null);
      if (page > 1 && transactions?.length === 1) setPage(page - 1);
      else refetch();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  const transactionId = (t) => t._id || t.id;
  const inflow = Number(summary?.totalInflow ?? 0);
  const outflow = Number(summary?.totalOutflow ?? 0);
  const net = inflow - outflow;
  const hasActiveFilters =
    debouncedSearch || type !== "all" || paymentMethod !== "all" || startDate || endDate || sortOrder !== "desc";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions"
        description="View every money movement in your business"
        action={
          <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={handleOpenCreate}>
            New Transaction
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {loading && !summary ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
        ) : (
          <>
            <StatCard
              title="Total Inflow"
              value={formatMoney(inflow, currency)}
              icon={<ArrowDownToLine className="w-5 h-5" />}
              color="green"
            />
            <StatCard
              title="Total Outflow"
              value={formatMoney(outflow, currency)}
              icon={<ArrowUpFromLine className="w-5 h-5" />}
              color="red"
            />
            <StatCard
              title="Net"
              value={`${net >= 0 ? "+" : ""}${formatMoney(net, currency)}`}
              icon={<ArrowLeftRight className="w-5 h-5" />}
              color="blue"
              hint={net >= 0 ? "More money in than out" : "More money out than in"}
            />
          </>
        )}
      </div>

      {/* Filters */}
      <FilterBar>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search transactions..."
          className="w-full sm:w-60"
        />
        <Select
          label="Type"
          className="w-full sm:w-40"
          options={TYPE_OPTIONS}
          value={type}
          onChange={(e) => setType(e.target.value)}
        />
        <Select
          label="Payment Method"
          className="w-full sm:w-40"
          options={METHOD_OPTIONS}
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
        />
        <Select
          label="Sort"
          className="w-full sm:w-40"
          options={SORT_OPTIONS}
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
        />
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartChange={setStartDate}
          onEndChange={setEndDate}
        />
      </FilterBar>

      {/* Table */}
      <div className="bg-surface-soft border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <TableSkeleton />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : !transactions?.length ? (
          <EmptyState
            icon={<Receipt className="w-7 h-7 text-ink-muted" />}
            title="No transactions found"
            description={
              hasActiveFilters
                ? "Try adjusting your search or filters."
                : "Record your first transaction to start tracking money flow."
            }
            action={
              <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={handleOpenCreate}>
                New Transaction
              </Button>
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-ink-muted border-b border-border">
                    <th className="px-6 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Description</th>
                    <th className="px-4 py-3 font-medium">Payment Method</th>
                    <th className="px-4 py-3 font-medium text-right">Amount</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {transactions.map((transaction) => {
                    const inflowTx = isInflow(transaction.type);
                    const amount = Number(transaction.amount) || 0;
                    return (
                      <tr
                        key={transactionId(transaction)}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                      >
                        <td className="px-6 py-3 text-ink-soft whitespace-nowrap">{formatDate(transaction.date)}</td>
                        <td className="px-4 py-3">
                          <Badge color={typeColor(transaction.type)}>
                            {capitalize(transaction.type)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-ink truncate max-w-[220px]">{transaction.description || "—"}</p>
                          {transaction.reference && (
                            <p className="text-xs text-ink-muted truncate">Ref: {transaction.reference}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-ink-soft">{capitalize(transaction.paymentMethod)}</td>
                        <td
                          className={`px-4 py-3 text-right font-medium ${
                            inflowTx ? "text-emerald-600" : "text-red-600"
                          }`}
                        >
                          {inflowTx ? "+" : "-"}
                          {formatMoney(amount, currency)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setViewing(transaction)}
                              className="p-2 rounded-lg text-ink-muted hover:text-ink hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                              aria-label="View transaction"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleting(transaction)}
                              className="p-2 rounded-lg text-ink-muted hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-500/15 transition"
                              aria-label="Delete transaction"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
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

      {/* Create Modal */}
      <Modal
        isOpen={showForm}
        onClose={resetForm}
        title="New Transaction"
        size="lg"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={resetForm}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSubmit} loading={mutating}>
              Create Transaction
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Type"
            options={TRANSACTION_TYPES}
            value={form.type}
            onChange={handleFieldChange("type")}
          />
          <Input
            label="Amount"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={form.amount}
            onChange={handleFieldChange("amount")}
            error={formError}
          />
          <Select
            label="Payment Method"
            options={PAYMENT_METHODS}
            value={form.paymentMethod}
            onChange={handleFieldChange("paymentMethod")}
          />
          <Input
            label="Date"
            type="date"
            value={form.date}
            onChange={handleFieldChange("date")}
          />
          <Input
            label="Description"
            placeholder="What was this for?"
            value={form.description}
            onChange={handleFieldChange("description")}
            className="sm:col-span-2"
          />
          <Input
            label="Reference"
            placeholder="Optional reference / invoice no."
            value={form.reference}
            onChange={handleFieldChange("reference")}
            className="sm:col-span-2"
          />
        </form>
      </Modal>

      {/* View Transaction Modal */}
      <Modal
        isOpen={!!viewing}
        onClose={() => setViewing(null)}
        title="Transaction Details"
        size="md"
        footer={
          <Button variant="ghost" size="sm" onClick={() => setViewing(null)}>
            Close
          </Button>
        }
      >
        {viewing && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-ink-muted">Type</p>
              <div className="mt-0.5">
                <Badge color={typeColor(viewing.type)}>{capitalize(viewing.type)}</Badge>
              </div>
            </div>
            <div>
              <p className="text-xs text-ink-muted">Amount</p>
              <p
                className={`font-semibold mt-0.5 ${
                  isInflow(viewing.type) ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {isInflow(viewing.type) ? "+" : "-"}
                {formatMoney(viewing.amount, currency)}
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-muted">Date</p>
              <p className="text-ink font-medium mt-0.5">{formatDate(viewing.date, true)}</p>
            </div>
            <div>
              <p className="text-xs text-ink-muted">Payment Method</p>
              <p className="text-ink font-medium mt-0.5">{capitalize(viewing.paymentMethod)}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-ink-muted">Description</p>
              <p className="text-ink font-medium mt-0.5">{viewing.description || "—"}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-ink-muted">Reference</p>
              <p className="text-ink font-medium mt-0.5">{viewing.reference || "—"}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Transaction?"
        message={`Are you sure you want to delete this ${deleting?.type || "transaction"}? This action cannot be undone.`}
        loading={deleteLoading}
      />
    </div>
  );
}