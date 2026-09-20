"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Banknote, Wallet, Coins, Eye, Trash2, X, ShoppingBag } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useFetch, useMutation, useDebounce, usePagination, useAutoOpenNew } from "@/hooks";
import { getErrorMessage } from "@/lib/api";
import { formatMoney, formatDate, capitalize, PAYMENT_METHODS, PAYMENT_STATUSES } from "@/constants";
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

const METHOD_OPTIONS = [
  { value: "all", label: "All methods" },
  ...PAYMENT_METHODS,
];

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  ...PAYMENT_STATUSES,
];

const EMPTY_ITEM = { productId: "", quantity: 1, sellingPrice: "" };

const EMPTY_SALE = {
  customer: "",
  customerName: "",
  items: [{ ...EMPTY_ITEM }],
  paymentMethod: "cash",
  paymentStatus: "paid",
  amountPaid: "",
  discount: "0",
  date: new Date().toISOString().slice(0, 10),
  note: "",
};

function statusColor(status) {
  switch (status) {
    case "paid":
      return "green";
    case "partial":
      return "amber";
    case "pending":
      return "red";
    case "refunded":
      return "gray";
    default:
      return "gray";
  }
}

function SalesTableSkeleton({ rows = 6 }) {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 rounded-xl" />
      ))}
    </div>
  );
}

function SaleItemsList({ items }) {
  if (!items?.length) return <p className="text-sm text-ink-muted">No items.</p>;
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-xs uppercase tracking-wide text-ink-muted border-b border-border">
          <th className="py-2 pr-2 font-medium">Product</th>
          <th className="py-2 px-2 font-medium text-right">Qty</th>
          <th className="py-2 px-2 font-medium text-right">Price</th>
          <th className="py-2 pl-2 font-medium text-right">Total</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {items.map((item, i) => {
          const qty = Number(item.quantity) || 0;
          const price = Number(item.sellingPrice ?? item.unitPrice) || 0;
          return (
            <tr key={i}>
              <td className="py-2 pr-2 text-ink">{item.productName || item.name || "—"}</td>
              <td className="py-2 px-2 text-right text-ink">{qty}</td>
              <td className="py-2 px-2 text-right text-ink">{formatMoney(price)}</td>
              <td className="py-2 pl-2 text-right text-ink font-medium">{formatMoney(qty * price)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default function SalesPage() {
  const { business } = useAuth();
  const { showToast } = useToast();
  const currency = business?.currency || "BDT";
  const { page, limit, setPage } = usePagination(1);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [paymentMethod, setPaymentMethod] = useState("all");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [summary, setSummary] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [form, setForm] = useState({ ...EMPTY_SALE, items: [{ ...EMPTY_ITEM }] });
  const [formError, setFormError] = useState(null);

  const { post, del, loading: submitting } = useMutation();

  const params = {
    page,
    limit,
    search: debouncedSearch || undefined,
    paymentMethod: paymentMethod === "all" ? undefined : paymentMethod,
    paymentStatus: paymentStatus === "all" ? undefined : paymentStatus,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  };

  const {
    data: sales,
    loading,
    error,
    pagination,
    refetch,
  } = useFetch("/sales", params, {
    onSuccess: (res) => setSummary(res.summary || null),
  });

  // Customers + products for the sale form
  const { data: customers } = useFetch("/customers", { limit: 100 });
  const { data: products } = useFetch("/products", { limit: 500 });

  const customerOptions = useMemo(() => {
    const options = (customers || []).map((c) => ({
      value: c._id || c.id,
      label: c.name + (c.phone ? ` · ${c.phone}` : ""),
    }));
    return [{ value: "", label: "Walk-in Customer" }, ...options];
  }, [customers]);

  const productOptions = useMemo(
    () =>
      (products || []).map((p) => ({
        value: p._id || p.id,
        label: p.name + (p.sku ? ` (${p.sku})` : ""),
      })),
    [products]
  );

  const productById = useMemo(() => {
    const map = new Map();
    (products || []).forEach((p) => map.set(p._id || p.id, p));
    return map;
  }, [products]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, paymentMethod, paymentStatus, startDate, endDate, setPage]);

  const handleOpenCreate = () => {
    setForm({ ...EMPTY_SALE, items: [{ ...EMPTY_ITEM }] });
    setFormError(null);
    setShowForm(true);
  };

  useAutoOpenNew(handleOpenCreate);

  const resetForm = () => {
    setForm({ ...EMPTY_SALE, items: [{ ...EMPTY_ITEM }] });
    setFormError(null);
    setShowForm(false);
  };

  const handleItemChange = (idx, field, value) => {
    setFormError(null);
    setForm((prev) => {
      const items = prev.items.map((item, i) => {
        if (i !== idx) return item;
        const next = { ...item, [field]: value };
        if (field === "productId" && value) {
          const prod = productById.get(value);
          if (prod && (item.sellingPrice === "" || item.sellingPrice == null)) {
            next.sellingPrice = prod.sellingPrice ?? "";
          }
        }
        return next;
      });
      return { ...prev, items };
    });
  };

  const addItem = () => {
    setForm((prev) => ({ ...prev, items: [...prev.items, { ...EMPTY_ITEM }] }));
  };

  const removeItem = (idx) => {
    setForm((prev) => {
      const items = prev.items.filter((_, i) => i !== idx);
      return { ...prev, items: items.length ? items : [{ ...EMPTY_ITEM }] };
    });
  };

  const handlePaymentStatusChange = (value) => {
    setForm((prev) => ({ ...prev, paymentStatus: value }));
  };

  const computed = useMemo(() => {
    const subtotal = form.items.reduce((sum, item) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.sellingPrice) || 0;
      return sum + qty * price;
    }, 0);
    const cost = form.items.reduce((sum, item) => {
      const prod = productById.get(item.productId);
      const qty = Number(item.quantity) || 0;
      const unitCost = Number(prod?.purchasePrice) || 0;
      return sum + qty * unitCost;
    }, 0);
    const discount = Number(form.discount) || 0;
    const total = Math.max(subtotal - discount, 0);
    return { subtotal, cost, discount, total, profit: total - cost };
  }, [form.items, form.discount, productById]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const invalid = form.items.find(
      (item) => !item.productId || Number(item.quantity) <= 0
    );
    if (invalid) {
      setFormError("Each line item needs a product and a quantity greater than 0.");
      return;
    }

    const payload = {
      items: form.items.map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity),
        sellingPrice: Number(item.sellingPrice) || 0,
      })),
      customer: form.customer || undefined,
      customerName: form.customerName.trim() || undefined,
      paymentMethod: form.paymentMethod,
      paymentStatus: form.paymentStatus,
      amountPaid:
        form.paymentStatus === "paid"
          ? computed.total
          : Number(form.amountPaid) || 0,
      discount: computed.discount,
      date: form.date,
      note: form.note,
    };

    try {
      await post("/sales", payload);
      showToast("Sale recorded", "success");
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
      await del(`/sales/${deleting._id || deleting.id}`);
      showToast("Sale deleted", "success");
      setDeleting(null);
      if (page > 1 && sales?.length === 1) setPage(page - 1);
      else refetch();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  const detail = useFetch(viewing ? `/sales/${viewing._id || viewing.id}` : null, {}, { enabled: !!viewing });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales"
        description="Record and track your sales"
        action={
          <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={handleOpenCreate}>
            Record Sale
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading && !summary ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
        ) : (
          <>
            <StatCard
              title="Total Revenue"
              value={formatMoney(summary?.totalRevenue ?? summary?.revenue ?? 0, currency)}
              icon={<Banknote className="w-5 h-5" />}
              color="primary"
            />
            <StatCard
              title="Total Profit"
              value={formatMoney(summary?.totalProfit ?? summary?.profit ?? 0, currency)}
              icon={<Wallet className="w-5 h-5" />}
              color="green"
            />
            <StatCard
              title="Total Cost"
              value={formatMoney(summary?.totalCost ?? summary?.cost ?? 0, currency)}
              icon={<Coins className="w-5 h-5" />}
              color="blue"
            />
            {summary?.totalCount != null && (
              <StatCard
                title="Sales Count"
                value={summary.totalCount}
                icon={<ShoppingBag className="w-5 h-5" />}
                color="purple"
              />
            )}
          </>
        )}
      </div>

      {/* Filters */}
      <FilterBar>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by customer or invoice..."
          className="w-full sm:w-64"
        />
        <Select
          label="Payment Method"
          className="w-full sm:w-40"
          options={METHOD_OPTIONS}
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
        />
        <Select
          label="Payment Status"
          className="w-full sm:w-40"
          options={STATUS_OPTIONS}
          value={paymentStatus}
          onChange={(e) => setPaymentStatus(e.target.value)}
        />
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartChange={setStartDate}
          onEndChange={setEndDate}
        />
      </FilterBar>

      {/* Sales Table */}
      <div className="bg-surface-soft border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <SalesTableSkeleton />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : !sales?.length ? (
          <EmptyState
            icon={<Banknote className="w-7 h-7 text-ink-muted" />}
            title="No sales found"
            description={
              debouncedSearch || paymentMethod !== "all" || paymentStatus !== "all" || startDate || endDate
                ? "Try adjusting your search or filters."
                : "Record your first sale to start tracking revenue."
            }
            action={
              <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={handleOpenCreate}>
                Record Sale
              </Button>
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-ink-muted border-b border-border">
                    <th className="px-6 py-3 font-medium">Invoice</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium text-center">Items</th>
                    <th className="px-4 py-3 font-medium text-right">Total</th>
                    <th className="px-4 py-3 font-medium">Payment</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium text-right">Profit</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sales.map((sale) => (
                    <tr
                      key={sale._id || sale.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="px-6 py-3">
                        <span
                          className="font-medium text-primary-600 dark:text-primary-400 cursor-pointer"
                          onClick={() => setViewing(sale)}
                        >
                          {(sale.invoiceNumber || sale.invoice).toUpperCase?.() ?? sale.invoiceNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-ink-soft whitespace-nowrap">{formatDate(sale.date)}</td>
                      <td className="px-4 py-3 text-ink">
                        {sale.customerName || sale.customer?.name || "Walk-in Customer"}
                      </td>
                      <td className="px-4 py-3 text-center text-ink">
                        {Array.isArray(sale.items) ? sale.items.length : sale.itemCount ?? 0}
                      </td>
                      <td className="px-4 py-3 text-right text-ink font-medium">
                        {formatMoney(sale.totalAmount ?? sale.total ?? sale.grandTotal ?? 0, currency)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge color="blue">{capitalize(sale.paymentMethod)}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge color={statusColor(sale.paymentStatus)}>
                          {capitalize(sale.paymentStatus)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right text-ink">
                        {formatMoney(sale.totalProfit ?? sale.profit ?? 0, currency)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewing(sale)}
                            className="p-2 rounded-lg text-ink-muted hover:text-ink hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                            aria-label="View sale"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleting(sale)}
                            className="p-2 rounded-lg text-ink-muted hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-500/15 transition"
                            aria-label="Delete sale"
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

      {/* Create / Record Sale Modal */}
      <Modal
        isOpen={showForm}
        onClose={resetForm}
        title="Record Sale"
        size="xl"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={resetForm}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              loading={submitting}
              disabled={submitting}
            >
              Save Sale
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {formError && (
            <div className="text-sm text-red-600 bg-red-100 dark:bg-red-500/15 rounded-xl px-4 py-3">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Customer"
              options={customerOptions}
              value={form.customer}
              onChange={(e) => setForm((p) => ({ ...p, customer: e.target.value }))}
            />
            <Input
              label="Customer Name (new / walk-in)"
              placeholder="e.g. Rahim Uddin"
              value={form.customerName}
              onChange={(e) => setForm((p) => ({ ...p, customerName: e.target.value }))}
            />
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-ink">Line Items</h3>
              <Button type="button" variant="outline" size="sm" onClick={addItem} icon={<Plus className="w-4 h-4" />}>
                Add Item
              </Button>
            </div>
            <div className="space-y-3">
              {form.items.map((item, idx) => {
                const qty = Number(item.quantity) || 0;
                const price = Number(item.sellingPrice) || 0;
                const prod = productById.get(item.productId);
                return (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-3 items-end border border-border rounded-xl p-3 bg-surface-soft"
                  >
                    <Select
                      className="col-span-12 sm:col-span-4"
                      options={productOptions}
                      value={item.productId}
                      onChange={(e) => handleItemChange(idx, "productId", e.target.value)}
                    />
                    <Input
                      className="col-span-4 sm:col-span-2"
                      label="Qty"
                      type="number"
                      min="0"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                    />
                    <Input
                      className="col-span-4 sm:col-span-3"
                      label="Price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.sellingPrice}
                      onChange={(e) => handleItemChange(idx, "sellingPrice", e.target.value)}
                    />
                    <div className="col-span-3 sm:col-span-2 text-right">
                      <p className="text-xs text-ink-muted mb-1.5">Line Total</p>
                      <p className="text-sm font-semibold text-ink truncate">
                        {formatMoney(qty * price, currency)}
                      </p>
                      {prod && (
                        <p className="text-[11px] text-ink-muted truncate">
                          cost {formatMoney(Number(prod.purchasePrice) || 0, currency)}
                        </p>
                      )}
                    </div>
                    <div className="col-span-1">
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="p-2 rounded-lg text-ink-muted hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-500/15 transition"
                        aria-label="Remove item"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Payment Method"
              options={PAYMENT_METHODS}
              value={form.paymentMethod}
              onChange={(e) => setForm((p) => ({ ...p, paymentMethod: e.target.value }))}
            />
            <Select
              label="Payment Status"
              options={PAYMENT_STATUSES}
              value={form.paymentStatus}
              onChange={(e) => handlePaymentStatusChange(e.target.value)}
            />
            {form.paymentStatus !== "paid" && (
              <Input
                label="Amount Paid"
                type="number"
                min="0"
                step="0.01"
                value={form.amountPaid}
                onChange={(e) => setForm((p) => ({ ...p, amountPaid: e.target.value }))}
              />
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Date"
              type="date"
              value={form.date}
              onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
            />
            <Input
              label="Discount"
              type="number"
              min="0"
              step="0.01"
              value={form.discount}
              onChange={(e) => setForm((p) => ({ ...p, discount: e.target.value }))}
            />
          </div>

          <Input
            label="Note"
            placeholder="Optional note for this sale"
            value={form.note}
            onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
          />

          {/* Summary */}
          <div className="bg-surface-soft border border-border rounded-xl p-4 grid grid-cols-2 sm:grid-cols-5 gap-4 text-sm">
            <div>
              <p className="text-xs text-ink-muted">Subtotal</p>
              <p className="font-semibold text-ink mt-0.5">{formatMoney(computed.subtotal, currency)}</p>
            </div>
            <div>
              <p className="text-xs text-ink-muted">Discount</p>
              <p className="font-semibold text-ink mt-0.5">-{formatMoney(computed.discount, currency)}</p>
            </div>
            <div>
              <p className="text-xs text-ink-muted">Total</p>
              <p className="font-bold text-ink mt-0.5">{formatMoney(computed.total, currency)}</p>
            </div>
            <div>
              <p className="text-xs text-ink-muted">Cost</p>
              <p className="font-semibold text-ink mt-0.5">{formatMoney(computed.cost, currency)}</p>
            </div>
            <div>
              <p className="text-xs text-ink-muted">Profit</p>
              <p className={`font-semibold mt-0.5 ${computed.profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                {formatMoney(computed.profit, currency)}
              </p>
            </div>
          </div>
        </form>
      </Modal>

      {/* View Sale Modal */}
      <Modal
        isOpen={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing ? `Sale ${String(viewing.invoiceNumber || viewing.invoice || "").toUpperCase() || ""}` : "Sale"}
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
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-ink-muted">Customer</p>
                  <p className="text-ink font-medium">
                    {detail.data.customerName || detail.data.customer?.name || "Walk-in Customer"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-ink-muted">Date</p>
                  <p className="text-ink font-medium">{formatDate(detail.data.date, true)}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-muted">Payment Method</p>
                  <Badge color="blue">{capitalize(detail.data.paymentMethod)}</Badge>
                </div>
                <div>
                  <p className="text-xs text-ink-muted">Status</p>
                  <Badge color={statusColor(detail.data.paymentStatus)}>
                    {capitalize(detail.data.paymentStatus)}
                  </Badge>
                </div>
              </div>

              <SaleItemsList items={detail.data.items} />

              <div className="border-t border-border pt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-xs text-ink-muted">Subtotal</p>
                  <p className="font-medium text-ink">{formatMoney(detail.data.subtotal, currency)}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-muted">Discount</p>
                  <p className="font-medium text-ink">{formatMoney(detail.data.totalDiscount ?? detail.data.discount ?? 0, currency)}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-muted">Total</p>
                  <p className="font-bold text-ink">{formatMoney(detail.data.totalAmount ?? detail.data.total ?? detail.data.grandTotal ?? 0, currency)}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-muted">Profit</p>
                  <p className="font-medium text-emerald-600">{formatMoney(detail.data.totalProfit ?? detail.data.profit ?? 0, currency)}</p>
                </div>
              </div>

              {detail.data.amountPaid != null && (
                <div className="text-sm">
                  <span className="text-ink-muted">Amount Paid: </span>
                  <span className="font-medium text-ink">{formatMoney(detail.data.amountPaid, currency)}</span>
                </div>
              )}
              {detail.data.note && (
                <div className="text-sm">
                  <span className="text-ink-muted">Note: </span>
                  <span className="text-ink">{detail.data.note}</span>
                </div>
              )}
            </div>
          )
        )}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Sale?"
        message={`Are you sure you want to delete sale ${
          deleting?.invoiceNumber || deleting?.invoice || ""
        }. This action cannot be undone.`}
        loading={deleteLoading}
      />
    </div>
  );
}