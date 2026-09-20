"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  TrendingUp,
  Layers,
  PieChart,
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
  INVESTMENT_TYPES,
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
  ...INVESTMENT_TYPES,
];

const TYPE_COLORS = {
  owner: "purple",
  partner: "blue",
  external: "green",
  additional_capital: "amber",
};

const EMPTY_FORM = {
  title: "",
  amount: "",
  source: "",
  type: "owner",
  date: new Date().toISOString().slice(0, 10),
  note: "",
};

function typeColor(type) {
  return TYPE_COLORS[type] || "gray";
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

export default function InvestmentsPage() {
  const { business } = useAuth();
  const { showToast } = useToast();
  const currency = business?.currency || "BDT";
  const { page, limit, setPage } = usePagination(1);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [type, setType] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [summary, setSummary] = useState(null);

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
    type: type === "all" ? undefined : type,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  };

  const {
    data: investments,
    loading,
    error,
    pagination,
    refetch,
  } = useFetch("/investments", params, {
    onSuccess: (res) => setSummary(res.summary || null),
  });

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, type, startDate, endDate, setPage]);

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

  const handleOpenEdit = (investment) => {
    setEditing(investment);
    setForm({
      title: investment.title || "",
      amount: investment.amount ?? "",
      source: investment.source || "",
      type: investment.type || "owner",
      date: (investment.date || "").slice(0, 10) || new Date().toISOString().slice(0, 10),
      note: investment.note || "",
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
    if (!form.amount || Number(form.amount) <= 0) {
      setFormError("Amount must be greater than 0");
      return;
    }

    const payload = {
      title: form.title.trim(),
      amount: Number(form.amount),
      source: form.source.trim(),
      type: form.type,
      date: form.date,
      note: form.note,
    };

    try {
      if (editing) {
        await patch(`/investments/${editing._id || editing.id}`, payload);
        showToast("Investment updated", "success");
      } else {
        await post("/investments", payload);
        showToast("Investment recorded", "success");
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
      await del(`/investments/${deleting._id || deleting.id}`);
      showToast("Investment deleted", "success");
      setDeleting(null);
      if (page > 1 && investments?.length === 1) setPage(page - 1);
      else refetch();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  const investmentId = (i) => i._id || i.id;
  const total = Number(summary?.total ?? 0);
  const count = Number(summary?.count ?? 0);
  const average = count > 0 ? total / count : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Investments"
        description="Track capital invested in your business"
        action={
          <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={handleOpenCreate}>
            Record Investment
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && !summary ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
        ) : (
          <>
            <StatCard
              title="Total Investment"
              value={formatMoney(total, currency)}
              icon={<TrendingUp className="w-5 h-5" />}
              color="amber"
            />
            <StatCard
              title="Investment Count"
              value={count}
              icon={<Layers className="w-5 h-5" />}
              color="blue"
            />
            <StatCard
              title="Average Investment"
              value={formatMoney(average, currency)}
              icon={<PieChart className="w-5 h-5" />}
              color="purple"
              hint={count ? `Across ${count} record${count === 1 ? "" : "s"}` : "No investments yet"}
            />
          </>
        )}
      </div>

      {/* Filters */}
      <FilterBar>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search investments..."
          className="w-full sm:w-64"
        />
        <Select
          label="Type"
          className="w-full sm:w-44"
          options={TYPE_OPTIONS}
          value={type}
          onChange={(e) => setType(e.target.value)}
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
        ) : !investments?.length ? (
          <EmptyState
            icon={<TrendingUp className="w-7 h-7 text-ink-muted" />}
            title="No investments found"
            description={
              debouncedSearch || type !== "all" || startDate || endDate
                ? "Try adjusting your search or filters."
                : "Record your first investment to track your capital."
            }
            action={
              <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={handleOpenCreate}>
                Record Investment
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
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium text-right">Amount</th>
                    <th className="px-4 py-3 font-medium">Source</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Note</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {investments.map((investment) => (
                    <tr
                      key={investmentId(investment)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="px-6 py-3">
                        <p className="font-medium text-ink">{investment.title || "—"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge color={typeColor(investment.type)}>
                          {capitalize(investment.type)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right text-ink font-medium">
                        {formatMoney(investment.amount, currency)}
                      </td>
                      <td className="px-4 py-3 text-ink-soft">{investment.source || "—"}</td>
                      <td className="px-4 py-3 text-ink-soft whitespace-nowrap">{formatDate(investment.date)}</td>
                      <td className="px-4 py-3 text-ink-soft truncate max-w-[160px]">{investment.note || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(investment)}
                            className="p-2 rounded-lg text-ink-muted hover:text-ink hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                            aria-label="Edit investment"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleting(investment)}
                            className="p-2 rounded-lg text-ink-muted hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-500/15 transition"
                            aria-label="Delete investment"
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

      {/* Create / Edit Modal */}
      <Modal
        isOpen={showForm}
        onClose={resetForm}
        title={editing ? "Edit Investment" : "Record Investment"}
        size="lg"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={resetForm}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSubmit} loading={mutating}>
              {editing ? "Save Changes" : "Record Investment"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Title"
            placeholder="e.g. Startup capital"
            value={form.title}
            onChange={handleFieldChange("title")}
            error={formError}
            className="sm:col-span-2"
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
            label="Type"
            options={INVESTMENT_TYPES}
            value={form.type}
            onChange={handleFieldChange("type")}
          />
          <Input
            label="Source"
            placeholder="e.g. John Doe"
            value={form.source}
            onChange={handleFieldChange("source")}
          />
          <Input
            label="Date"
            type="date"
            value={form.date}
            onChange={handleFieldChange("date")}
          />
          <Input
            label="Note"
            placeholder="Optional note"
            value={form.note}
            onChange={handleFieldChange("note")}
            className="sm:col-span-2"
          />
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Investment?"
        message={`Are you sure you want to delete "${deleting?.title}"? This action cannot be undone.`}
        loading={deleteLoading}
      />
    </div>
  );
}