"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Truck,
  Banknote,
  Wallet,
  Clock,
  Pencil,
  Trash2,
  Eye,
  Building2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useFetch, useMutation, useDebounce, usePagination, useAutoOpenNew } from "@/hooks";
import { getErrorMessage } from "@/lib/api";
import { formatMoney, formatDate, capitalize } from "@/constants";
import PageHeader from "@/components/common/PageHeader";
import StatCard from "@/components/common/StatCard";
import FilterBar from "@/components/common/FilterBar";
import SearchBar from "@/components/common/SearchBar";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import Pagination from "@/components/common/Pagination";
import ConfirmModal from "@/components/common/ConfirmModal";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import Skeleton from "@/components/ui/Skeleton";

const EMPTY_FORM = {
  name: "",
  company: "",
  phone: "",
  email: "",
  address: "",
  notes: "",
};

function TableSkeleton({ rows = 6 }) {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 rounded-xl" />
      ))}
    </div>
  );
}

export default function SuppliersPage() {
  const { business } = useAuth();
  const { showToast } = useToast();
  const currency = business?.currency || "BDT";
  const { page, limit, setPage } = usePagination(1);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [summary, setSummary] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);
  const [submittingForm, setSubmittingForm] = useState(false);

  const { post, patch, del, loading: mutating } = useMutation();

  const params = {
    page,
    limit,
    search: debouncedSearch || undefined,
  };

  const {
    data: suppliers,
    loading,
    error,
    pagination,
    refetch,
  } = useFetch("/suppliers", params, {
    onSuccess: (res) => setSummary(res.summary || null),
  });

  const detail = useFetch(
    viewing ? `/suppliers/${viewing._id || viewing.id}` : null,
    {},
    { enabled: !!viewing }
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, setPage]);

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

  const handleOpenEdit = (supplier) => {
    setEditing(supplier);
    setForm({
      name: supplier.name || "",
      company: supplier.company || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      address: supplier.address || "",
      notes: supplier.notes || "",
    });
    setFormError(null);
    setShowForm(true);
  };

  const handleFieldChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError("Supplier name is required.");
      return;
    }
    setSubmittingForm(true);
    try {
      if (editing) {
        await patch(`/suppliers/${editing._id || editing.id}`, form);
        showToast("Supplier updated", "success");
      } else {
        await post("/suppliers", form);
        showToast("Supplier added", "success");
      }
      resetForm();
      refetch();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSubmittingForm(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await del(`/suppliers/${deleting._id || deleting.id}`);
      showToast("Supplier deleted", "success");
      setDeleting(null);
      if (page > 1 && suppliers?.length === 1) setPage(page - 1);
      else refetch();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Suppliers"
        description="Manage your suppliers & vendors"
        action={
          <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={handleOpenCreate}>
            Add Supplier
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading && !summary ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
        ) : (
          <>
            <StatCard
              title="Total Suppliers"
              value={summary?.totalSuppliers ?? 0}
              icon={<Truck className="w-5 h-5" />}
              color="primary"
            />
            <StatCard
              title="Total Purchases"
              value={formatMoney(summary?.totalPurchases ?? 0, currency)}
              icon={<Banknote className="w-5 h-5" />}
              color="blue"
            />
            <StatCard
              title="Total Paid"
              value={formatMoney(summary?.totalPaid ?? 0, currency)}
              icon={<Wallet className="w-5 h-5" />}
              color="green"
            />
            <StatCard
              title="Total Due"
              value={formatMoney(summary?.totalDue ?? 0, currency)}
              icon={<Clock className="w-5 h-5" />}
              color="amber"
            />
          </>
        )}
      </div>

      <FilterBar>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search suppliers..."
          className="w-full sm:w-64"
        />
      </FilterBar>

      <div className="bg-surface-soft border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <TableSkeleton />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : !suppliers?.length ? (
          <EmptyState
            icon={<Truck className="w-7 h-7 text-ink-muted" />}
            title="No suppliers found"
            description={
              debouncedSearch
                ? "Try adjusting your search."
                : "Add your first supplier to start tracking purchases."
            }
            action={
              <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={handleOpenCreate}>
                Add Supplier
              </Button>
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-ink-muted border-b border-border">
                    <th className="px-6 py-3 font-medium">Supplier</th>
                    <th className="px-4 py-3 font-medium">Phone</th>
                    <th className="px-4 py-3 font-medium text-right">Purchases</th>
                    <th className="px-4 py-3 font-medium text-right">Paid</th>
                    <th className="px-4 py-3 font-medium text-right">Due</th>
                    <th className="px-6 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {suppliers.map((supplier) => (
                    <tr
                      key={supplier._id || supplier.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-primary-100 dark:bg-primary-500/15 flex items-center justify-center shrink-0">
                            <Building2 className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-ink truncate">{supplier.name}</p>
                            {supplier.company && (
                              <p className="text-xs text-ink-muted truncate">{supplier.company}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-ink-soft">{supplier.phone || "—"}</td>
                      <td className="px-4 py-3 text-right text-ink font-medium">
                        {formatMoney(supplier.totalPurchases || 0, currency)}
                      </td>
                      <td className="px-4 py-3 text-right text-emerald-600 font-medium">
                        {formatMoney(supplier.totalPaid || 0, currency)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {supplier.dueAmount > 0 ? (
                          <span className="font-medium text-red-600">{formatMoney(supplier.dueAmount, currency)}</span>
                        ) : (
                          <span className="text-ink-muted">—</span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewing(supplier)}
                            className="p-2 rounded-lg text-ink-muted hover:text-ink hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                            aria-label="View supplier"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(supplier)}
                            className="p-2 rounded-lg text-ink-muted hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-500/10 transition"
                            aria-label="Edit supplier"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleting(supplier)}
                            className="p-2 rounded-lg text-ink-muted hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-500/15 transition"
                            aria-label="Delete supplier"
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

      <Modal
        isOpen={showForm}
        onClose={resetForm}
        title={editing ? "Edit Supplier" : "Add Supplier"}
        size="lg"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={resetForm}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSubmit} loading={submittingForm}>
              {editing ? "Save Changes" : "Add Supplier"}
            </Button>
          </>
        }
      >
        <form id="supplier-form" onSubmit={handleSubmit} className="space-y-4">
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="Supplier Name *"
                value={form.name}
                onChange={handleFieldChange("name")}
                placeholder="e.g. Karim Traders"
              />
            </div>
            <Input
              label="Company"
              value={form.company}
              onChange={handleFieldChange("company")}
              placeholder="Company name (optional)"
            />
            <Input
              label="Phone"
              value={form.phone}
              onChange={handleFieldChange("phone")}
              placeholder="01XXXXXXXXX"
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={handleFieldChange("email")}
              placeholder="supplier@example.com"
            />
            <Input
              label="Address"
              value={form.address}
              onChange={handleFieldChange("address")}
              placeholder="Address"
            />
          </div>
          <Input
            label="Notes"
            value={form.notes}
            onChange={handleFieldChange("notes")}
            placeholder="Any notes about this supplier"
          />
        </form>
      </Modal>

      <Modal
        isOpen={!!viewing}
        onClose={() => setViewing(null)}
        title="Supplier Details"
        size="lg"
      >
        {detail.loading ? (
          <div className="space-y-3 p-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
          </div>
        ) : detail.data ? (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-500/15 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-ink">{detail.data.name}</h3>
                {detail.data.company && (
                  <p className="text-sm text-ink-muted">{detail.data.company}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <StatCard
                title="Purchases"
                value={formatMoney(detail.data.totalPurchases || 0, currency)}
                icon={<Banknote className="w-4 h-4" />}
                color="blue"
              />
              <StatCard
                title="Paid"
                value={formatMoney(detail.data.totalPaid || 0, currency)}
                icon={<Wallet className="w-4 h-4" />}
                color="green"
              />
              <StatCard
                title="Due"
                value={formatMoney(detail.data.dueAmount || 0, currency)}
                icon={<Clock className="w-4 h-4" />}
                color="amber"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-ink-muted">Phone</p>
                <p className="text-ink font-medium mt-0.5">{detail.data.phone || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-ink-muted">Email</p>
                <p className="text-ink font-medium mt-0.5 break-all">{detail.data.email || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-ink-muted">Address</p>
                <p className="text-ink font-medium mt-0.5">{detail.data.address || "—"}</p>
              </div>
              {detail.data.notes && (
                <div>
                  <p className="text-xs text-ink-muted">Notes</p>
                  <p className="text-ink font-medium mt-0.5">{detail.data.notes}</p>
                </div>
              )}
            </div>

            <div>
              <h4 className="text-sm font-semibold text-ink mb-3">Purchase History</h4>
              {Array.isArray(detail.data.purchaseHistory) && detail.data.purchaseHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wide text-ink-muted border-b border-border">
                        <th className="py-2 pr-2 font-medium">Date</th>
                        <th className="py-2 px-2 font-medium">Invoice</th>
                        <th className="py-2 px-2 font-medium text-center">Items</th>
                        <th className="py-2 px-2 font-medium text-right">Total</th>
                        <th className="py-2 pl-2 font-medium text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {detail.data.purchaseHistory.map((row, i) => (
                        <tr key={row._id || i}>
                          <td className="py-2 pr-2 text-ink-soft whitespace-nowrap">{formatDate(row.date)}</td>
                          <td className="py-2 px-2 text-ink font-medium">
                            {String(row.invoiceNumber || "").toUpperCase() || "—"}
                          </td>
                          <td className="py-2 px-2 text-center text-ink">
                            {Array.isArray(row.items) ? row.items.length : 0}
                          </td>
                          <td className="py-2 px-2 text-right text-ink font-medium">
                            {formatMoney(row.totalAmount ?? row.total ?? 0, currency)}
                          </td>
                          <td className="py-2 pl-2 text-right">
                            <Badge color={row.paymentStatus === "paid" ? "green" : row.paymentStatus === "partial" ? "amber" : "gray"}>
                              {capitalize(row.paymentStatus)}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-ink-muted">No purchase history yet.</p>
              )}
            </div>
          </div>
        ) : null}
      </Modal>

      <ConfirmModal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Supplier?"
        message={`Are you sure you want to delete "${deleting?.name}"? This action cannot be undone.`}
        loading={deleteLoading}
      />
    </div>
  );
}