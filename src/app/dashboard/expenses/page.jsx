"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Receipt,
  CalendarDays,
  Layers,
  TrendingUp,
  Pencil,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useFetch, useMutation, useDebounce, usePagination, useAutoOpenNew } from "@/hooks";
import { getErrorMessage } from "@/lib/api";
import {
  formatMoney,
  formatDate,
  capitalize,
  EXPENSE_CATEGORIES,
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
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import Skeleton from "@/components/ui/Skeleton";

const CATEGORY_OPTIONS = [
  { value: "all", label: "All categories" },
  ...EXPENSE_CATEGORIES,
];

const METHOD_OPTIONS = [
  { value: "all", label: "All methods" },
  ...PAYMENT_METHODS,
];

const CATEGORY_COLORS = {
  rent: "blue",
  salary: "purple",
  electricity: "amber",
  internet: "blue",
  transport: "gray",
  marketing: "purple",
  product_purchase: "green",
  maintenance: "amber",
  software: "purple",
  other: "gray",
};

const EMPTY_FORM = {
  title: "",
  category: "",
  amount: "",
  paymentMethod: "cash",
  date: new Date().toISOString().slice(0, 10),
  description: "",
};

function categoryColor(category) {
  return CATEGORY_COLORS[category] || "gray";
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

export default function ExpensesPage() {
  const { business } = useAuth();
  const { showToast } = useToast();
  const currency = business?.currency || "BDT";
  const { page, limit, setPage } = usePagination(1);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [category, setCategory] = useState("all");
  const [paymentMethod, setPaymentMethod] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [summary, setSummary] = useState(null);
  const [categorySummary, setCategorySummary] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);

  const { post, patch, del, loading: mutating } = useMutation();

  const params = {
    page,
    limit,
    search: debouncedSearch || undefined,
    category: category === "all" ? undefined : category,
    paymentMethod: paymentMethod === "all" ? undefined : paymentMethod,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  };

  const {
    data: expenses,
    loading,
    error,
    pagination,
    refetch,
  } = useFetch("/expenses", params, {
    onSuccess: (res) => {
      setSummary(res.summary || null);
      setCategorySummary(res.categorySummary || res.categories || []);
    },
  });

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, category, paymentMethod, startDate, endDate, setPage]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowForm(false);
    setEditing(null);
  };

  const handleOpenCreate = () => {
    setForm(EMPTY_FORM);
    setFormError(null);
    setEditing(null);
    setShowForm(true);
  };

  useAutoOpenNew(handleOpenCreate);

  const handleOpenEdit = (expense) => {
    setEditing(expense);
    setForm({
      title: expense.title || "",
      category: expense.category || "",
      amount: expense.amount ?? "",
      paymentMethod: expense.paymentMethod || "cash",
      date: (expense.date || "").slice(0, 10) || new Date().toISOString().slice(0, 10),
      description: expense.description || "",
    });
    setFormError(null);
    setShowForm(true);
  };

  const handleFieldChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setFormError("Title is required");
      return;
    }
    if (!form.category) {
      setFormError("Category is required");
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      setFormError("Amount must be greater than 0");
      return;
    }

    const payload = {
      title: form.title.trim(),
      category: form.category,
      amount: Number(form.amount),
      paymentMethod: form.paymentMethod,
      date: form.date,
      description: form.description,
    };

    try {
      if (editing) {
        await patch(`/expenses/${editing._id || editing.id}`, payload);
        showToast("Expense updated", "success");
      } else {
        await post("/expenses", payload);
        showToast("Expense added", "success");
      }
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
      await del(`/expenses/${deleting._id || deleting.id}`);
      showToast("Expense deleted", "success");
      setDeleting(null);
      if (page > 1 && expenses?.length === 1) setPage(page - 1);
      else refetch();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  const expenseId = (e) => e._id || e.id;
  const topCategory = Array.isArray(categorySummary) ? categorySummary[0] : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        description="Track and manage your business expenses"
        action={
          <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={handleOpenCreate}>
            Add Expense
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading && !summary ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
        ) : (
          <>
            <StatCard
              title="Total Expenses"
              value={formatMoney(summary?.total ?? 0, currency)}
              icon={<Receipt className="w-5 h-5" />}
              color="red"
            />
            <StatCard
              title="This Month"
              value={formatMoney(summary?.monthly ?? 0, currency)}
              icon={<CalendarDays className="w-5 h-5" />}
              color="blue"
            />
            <StatCard
              title="Categories Used"
              value={summary?.categoryCount ?? categorySummary?.length ?? 0}
              icon={<Layers className="w-5 h-5" />}
              color="purple"
            />
            <StatCard
              title="Top Category"
              value={topCategory ? capitalize(topCategory.name || topCategory.category) : "—"}
              icon={<TrendingUp className="w-5 h-5" />}
              color="amber"
              hint={topCategory ? formatMoney(topCategory.total ?? topCategory.amount ?? 0, currency) : "No expenses yet"}
            />
          </>
        )}
      </div>

      {/* Filters */}
      <FilterBar>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search expenses..."
          className="w-full sm:w-64"
        />
        <Select
          label="Category"
          className="w-full sm:w-44"
          options={CATEGORY_OPTIONS}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <Select
          label="Payment Method"
          className="w-full sm:w-40"
          options={METHOD_OPTIONS}
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
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
        ) : !expenses?.length ? (
          <EmptyState
            icon={<Receipt className="w-7 h-7 text-ink-muted" />}
            title="No expenses found"
            description={
              debouncedSearch || category !== "all" || paymentMethod !== "all" || startDate || endDate
                ? "Try adjusting your search or filters."
                : "Add your first expense to start tracking spending."
            }
            action={
              <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={handleOpenCreate}>
                Add Expense
              </Button>
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-ink-muted border-b border-border">
                    <th className="px-6 py-3 font-medium">Title</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium text-right">Amount</th>
                    <th className="px-4 py-3 font-medium">Payment Method</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {expenses.map((expense) => (
                    <tr
                      key={expenseId(expense)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="px-6 py-3">
                        <p className="font-medium text-ink">{expense.title || "—"}</p>
                        {expense.description && (
                          <p className="text-xs text-ink-muted truncate max-w-[200px]">{expense.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge color={categoryColor(expense.category)}>
                          {capitalize(expense.category)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right text-ink font-medium">
                        {formatMoney(expense.amount, currency)}
                      </td>
                      <td className="px-4 py-3 text-ink-soft">{capitalize(expense.paymentMethod)}</td>
                      <td className="px-4 py-3 text-ink-soft whitespace-nowrap">{formatDate(expense.date)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(expense)}
                            className="p-2 rounded-lg text-ink-muted hover:text-ink hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                            aria-label="Edit expense"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleting(expense)}
                            className="p-2 rounded-lg text-ink-muted hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-500/15 transition"
                            aria-label="Delete expense"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* Category breakdown */}
      {Array.isArray(categorySummary) && categorySummary.length > 0 && (
        <Card title="Category Breakdown" subtitle="Top spending categories">
          <div className="space-y-3">
            {categorySummary.slice(0, 8).map((cat) => {
              const name = cat._id ?? cat.name ?? cat.category ?? "—";
              const total = cat.total ?? cat.amount ?? 0;
              const count = cat.count ?? 0;
              return (
                <div key={name} className="flex items-center gap-3">
                  <Badge color={categoryColor(name)}>{capitalize(name)}</Badge>
                  <span className="text-xs text-ink-muted">{count} expense{count === 1 ? "" : "s"}</span>
                  <span className="ml-auto text-sm font-medium text-ink">{formatMoney(total, currency)}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={showForm}
        onClose={resetForm}
        title={editing ? "Edit Expense" : "Add Expense"}
        size="lg"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={resetForm}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSubmit} loading={mutating}>
              {editing ? "Save Changes" : "Add Expense"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Title"
            placeholder="e.g. Office rent"
            value={form.title}
            onChange={handleFieldChange("title")}
            error={formError}
            className="sm:col-span-2"
          />
          <Select
            label="Category"
            options={EXPENSE_CATEGORIES}
            value={form.category}
            onChange={handleFieldChange("category")}
          />
          <Input
            label="Amount"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={form.amount}
            onChange={handleFieldChange("amount")}
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
            placeholder="Optional notes"
            value={form.description}
            onChange={handleFieldChange("description")}
            className="sm:col-span-2"
          />
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Expense?"
        message={`Are you sure you want to delete "${deleting?.title}"? This action cannot be undone.`}
        loading={deleteLoading}
      />
    </div>
  );
}