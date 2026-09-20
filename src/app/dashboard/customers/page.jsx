"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Users,
  Banknote,
  Wallet,
  Clock,
  Pencil,
  Trash2,
  Eye,
  UserRound,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import {
  useFetch,
  useMutation,
  useDebounce,
  usePagination,
  useAutoOpenNew,
} from "@/hooks";
import { getErrorMessage } from "@/lib/api";
import { formatMoney, formatDate } from "@/constants";
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
  phone: "",
  email: "",
  address: "",
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

export default function CustomersPage() {
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

  const { post, patch, del, loading: mutating } = useMutation();

  const params = {
    page,
    limit,
    search: debouncedSearch || undefined,
  };

  const {
    data: customers,
    loading,
    error,
    pagination,
    refetch,
  } = useFetch("/customers", params, {
    onSuccess: (res) => setSummary(res.summary || null),
  });

  const detail = useFetch(
    viewing ? `/customers/${viewing._id || viewing.id}` : null,
    {},
    { enabled: !!viewing },
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

  const handleOpenEdit = (customer) => {
    setEditing(customer);
    setForm({
      name: customer.name || "",
      phone: customer.phone || "",
      email: customer.email || "",
      address: customer.address || "",
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
      setFormError("Name is required");
      return;
    }

    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || undefined,
      address: form.address.trim(),
    };

    try {
      if (editing) {
        await patch(`/customers/${editing._id || editing.id}`, payload);
        showToast("Customer updated", "success");
      } else {
        await post("/customers", payload);
        showToast("Customer added", "success");
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
      await del(`/customers/${deleting._id || deleting.id}`);
      showToast("Customer deleted", "success");
      setDeleting(null);
      if (page > 1 && customers?.length === 1) setPage(page - 1);
      else refetch();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  const customerId = (c) => c._id || c.id;
  const hasActiveFilters = debouncedSearch;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Manage your customers and their balances"
        action={
          <Button
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={handleOpenCreate}
          >
            Add Customer
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading && !summary ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))
        ) : (
          <>
            <StatCard
              title="Total Customers"
              value={summary?.totalCustomers ?? 0}
              icon={<Users className="w-5 h-5" />}
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
              color="red"
            />
          </>
        )}
      </div>

      {/* Filters */}
      <FilterBar>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by name, email or phone..."
          className="w-full sm:w-72"
        />
      </FilterBar>

      {/* Table */}
      <div className="bg-surface-soft border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <TableSkeleton />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : !customers?.length ? (
          <EmptyState
            icon={<Users className="w-7 h-7 text-ink-muted" />}
            title="No customers found"
            description={
              hasActiveFilters
                ? "Try adjusting your search."
                : "Add your first customer to start tracking them."
            }
            action={
              <Button
                size="sm"
                icon={<Plus className="w-4 h-4" />}
                onClick={handleOpenCreate}
              >
                Add Customer
              </Button>
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-ink-muted border-b border-border">
                    <th className="px-6 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Phone</th>
                    <th className="px-4 py-3 font-medium text-right">
                      Purchases
                    </th>
                    <th className="px-4 py-3 font-medium text-right">Paid</th>
                    <th className="px-4 py-3 font-medium text-right">Due</th>
                    <th className="px-4 py-3 font-medium text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {customers.map((customer) => {
                    const due = Number(
                      customer.totalDue ??
                        customer.due ??
                        (customer.totalPurchases ?? 0) -
                          (customer.totalPaid ?? 0),
                    );
                    return (
                      <tr
                        key={customerId(customer)}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                      >
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-primary-100 dark:bg-primary-500/15 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
                              <UserRound className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-ink truncate">
                                {customer.name}
                              </p>
                              {customer.email && (
                                <p className="text-xs text-ink-muted truncate">
                                  {customer.email}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-ink-soft whitespace-nowrap">
                          {customer.phone || "—"}
                        </td>
                        <td className="px-4 py-3 text-right text-ink">
                          {formatMoney(customer.totalPurchases ?? 0, currency)}
                        </td>
                        <td className="px-4 py-3 text-right text-ink">
                          {formatMoney(customer.totalPaid ?? 0, currency)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {due > 0 ? (
                            <Badge color="red">
                              {formatMoney(due, currency)}
                            </Badge>
                          ) : (
                            <span className="text-ink-soft">
                              {formatMoney(due, currency)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setViewing(customer)}
                              className="p-2 rounded-lg text-ink-muted hover:text-ink hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                              aria-label="View customer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(customer)}
                              className="p-2 rounded-lg text-ink-muted hover:text-ink hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                              aria-label="Edit customer"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleting(customer)}
                              className="p-2 rounded-lg text-ink-muted hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-500/15 transition"
                              aria-label="Delete customer"
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

      {/* Create / Edit Modal */}
      <Modal
        isOpen={showForm}
        onClose={resetForm}
        title={editing ? "Edit Customer" : "Add Customer"}
        size="lg"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={resetForm}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSubmit} loading={mutating}>
              {editing ? "Save Changes" : "Add Customer"}
            </Button>
          </>
        }
      >
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <Input
            label="Name"
            placeholder="e.g. Rahim Ahmed"
            value={form.name}
            onChange={handleFieldChange("name")}
            error={formError}
          />
          <Input
            label="Phone"
            type="tel"
            placeholder="e.g. 01712345678"
            value={form.phone}
            onChange={handleFieldChange("phone")}
          />
          <Input
            label="Email"
            type="email"
            placeholder="e.g. rahim@example.com"
            value={form.email}
            onChange={handleFieldChange("email")}
          />
          <Input
            label="Address"
            placeholder="e.g. Dhaka, Bangladesh"
            value={form.address}
            onChange={handleFieldChange("address")}
            className="sm:col-span-2"
          />
        </form>
      </Modal>

      {/* View Customer Modal */}
      <Modal
        isOpen={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing ? viewing.name : "Customer"}
        size="lg"
        footer={
          <Button variant="ghost" size="sm" onClick={() => setViewing(null)}>
            Close
          </Button>
        }
      >
        {detail.loading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-4 w-56" />
          </div>
        ) : detail.error ? (
          <ErrorState message={detail.error} onRetry={detail.refetch} />
        ) : (
          detail.data && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-ink-muted">Name</p>
                  <p className="text-ink font-medium mt-0.5">
                    {detail.data.name || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-ink-muted">Phone</p>
                  <p className="text-ink font-medium mt-0.5">
                    {detail.data.phone || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-ink-muted">Email</p>
                  <p className="text-ink font-medium mt-0.5 break-all">
                    {detail.data.email || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-ink-muted">Address</p>
                  <p className="text-ink font-medium mt-0.5">
                    {detail.data.address || "—"}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-ink mb-3">
                  Purchase History
                </h4>
                {Array.isArray(detail.data.purchaseHistory) &&
                detail.data.purchaseHistory.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs uppercase tracking-wide text-ink-muted border-b border-border">
                          <th className="py-2 pr-2 font-medium">Date</th>
                          <th className="py-2 px-2 font-medium">Invoice</th>
                          <th className="py-2 px-2 font-medium text-center">
                            Items
                          </th>
                          <th className="py-2 px-2 font-medium text-right">
                            Total
                          </th>
                          <th className="py-2 pl-2 font-medium text-right">
                            Paid
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {detail.data.purchaseHistory.map((row, i) => (
                          <tr key={row._id || row.id || i}>
                            <td className="py-2 pr-2 text-ink-soft whitespace-nowrap">
                              {formatDate(row.date)}
                            </td>
                            <td className="py-2 px-2 text-ink font-medium">
                              {String(
                                row.invoiceNumber || row.invoice || "",
                              ).toUpperCase() || "—"}
                            </td>
                            <td className="py-2 px-2 text-center text-ink">
                              {Array.isArray(row.items)
                                ? row.items.length
                                : (row.itemCount ?? 0)}
                            </td>
                            <td className="py-2 px-2 text-right text-ink font-medium">
                              {formatMoney(
                                row.totalAmount ??
                                  row.total ??
                                  row.grandTotal ??
                                  0,
                                currency,
                              )}
                            </td>
                            <td className="py-2 pl-2 text-right text-ink">
                              {formatMoney(
                                row.paid ?? row.amountPaid ?? 0,
                                currency,
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-ink-muted">
                    No purchase history yet.
                  </p>
                )}
              </div>
            </div>
          )
        )}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Customer?"
        message={`Are you sure you want to delete "${deleting?.name}"? This action cannot be undone.`}
        loading={deleteLoading}
      />
    </div>
  );
}
