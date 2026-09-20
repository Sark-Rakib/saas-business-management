"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Banknote,
  Wallet,
  Clock,
  Pencil,
  Trash2,
  Eye,
  Truck,
  PackagePlus,
  Coins,
} from "lucide-react";
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

const EMPTY_ITEM = { productId: "", quantity: "", purchasePrice: "" };
const EMPTY_PURCHASE = {
  supplier: "",
  items: [{ ...EMPTY_ITEM }],
  paymentMethod: "cash",
  paymentStatus: "paid",
  amountPaid: "",
  discount: "",
  note: "",
  date: "",
};

const METHOD_OPTIONS = [{ value: "all", label: "All Methods" }, ...PAYMENT_METHODS];
const STATUS_OPTIONS = [{ value: "all", label: "All Statuses" }, ...PAYMENT_STATUSES.map((s) => ({ ...s }))];

const statusColor = (status) => {
  if (status === "paid") return "green";
  if (status === "partial") return "amber";
  return "gray";
};

function PurchasesTableSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-12 rounded-xl" />
      ))}
    </div>
  );
}

export default function PurchasesPage() {
  const { business } = useAuth();
  const { showToast } = useToast();
  const currency = business?.currency || "BDT";
  const { page, limit, setPage } = usePagination(1);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [summary, setSummary] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [form, setForm] = useState({ ...EMPTY_PURCHASE, items: [{ ...EMPTY_ITEM }] });
  const [formError, setFormError] = useState(null);

  const { post, del, loading: submitting } = useMutation();

  const params = {
    page,
    limit,
    search: debouncedSearch || undefined,
    paymentStatus: paymentStatus === "all" ? undefined : paymentStatus,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  };

  const {
    data: purchases,
    loading,
    error,
    pagination,
    refetch,
  } = useFetch("/purchases", params, {
    onSuccess: (res) => setSummary(res.summary || null),
  });

  const { data: suppliers } = useFetch("/suppliers", { limit: 200 });
  const { data: products } = useFetch("/products", { limit: 500 });

  const supplierOptions = useMemo(
    () => (suppliers || []).map((s) => ({ value: s._id || s.id, label: s.name + (s.company ? ` · ${s.company}` : "") })),
    [suppliers]
  );

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
  }, [debouncedSearch, paymentStatus, startDate, endDate, setPage]);

  const resetForm = () => {
    setForm({ ...EMPTY_PURCHASE, items: [{ ...EMPTY_ITEM }] });
    setFormError(null);
    setShowForm(false);
  };

  const handleOpenCreate = () => {
    setForm({ ...EMPTY_PURCHASE, items: [{ ...EMPTY_ITEM }] });
    setFormError(null);
    setShowForm(true);
  };

  useAutoOpenNew(handleOpenCreate);

  const handleItemChange = (idx, field, value) => {
    setFormError(null);
    setForm((prev) => {
      const items = prev.items.map((item, i) => {
        if (i !== idx) return item;
        const next = { ...item, [field]: value };
        if (field === "productId" && value) {
          const prod = productById.get(value);
          if (prod && (next.purchasePrice === "" || next.purchasePrice == null)) {
            next.purchasePrice = prod.purchasePrice ?? "";
          }
        }
        return next;
      });
      return { ...prev, items };
    });
  };

  const addItem = () => {
    setFormError(null);
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
      const price = Number(item.purchasePrice) || 0;
      return sum + qty * price;
    }, 0);
    const discount = Number(form.discount) || 0;
    const total = Math.max(subtotal - discount, 0);
    return { subtotal, discount, total };
  }, [form.items, form.discount]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.supplier) {
      setFormError("Select a supplier.");
      return;
    }
    const invalid = form.items.find((item) => !item.productId || Number(item.quantity) <= 0);
    if (invalid) {
      setFormError("Each line item needs a product and a quantity greater than 0.");
      return;
    }

    const payload = {
      items: form.items.map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity),
        purchasePrice: Number(item.purchasePrice) || 0,
      })),
      supplier: form.supplier,
      paymentMethod: form.paymentMethod,
      paymentStatus: form.paymentStatus,
      amountPaid: Number(form.amountPaid) || undefined,
      discount: Number(form.discount) || undefined,
      note: form.note.trim(),
      date: form.date || undefined,
    };

    try {
      await post("/purchases", payload);
      showToast("Purchase recorded", "success");
      resetForm();
      refetch();
    } catch (err) {
      setFormError(getErrorMessage(err));
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await del(`/purchases/${deleting._id || deleting.id}`);
      showToast("Purchase deleted", "success");
      setDeleting(null);
      if (page > 1 && purchases?.length === 1) setPage(page - 1);
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
        title="Purchases"
        description="Record stock purchases from suppliers"
        action={
          <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={handleOpenCreate}>
            Record Purchase
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading && !summary ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
        ) : (
          <>
            <StatCard
              title="Total Purchases"
              value={formatMoney(summary?.totalPurchase ?? summary?.total ?? 0, currency)}
              icon={<Coins className="w-5 h-5" />}
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
            <StatCard
              title="Purchase Count"
              value={summary?.count ?? pagination?.total ?? 0}
              icon={<PackagePlus className="w-5 h-5" />}
              color="primary"
            />
          </>
        )}
      </div>

      <FilterBar>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by supplier or invoice..."
          className="w-full sm:w-64"
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

      <div className="bg-surface-soft border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <PurchasesTableSkeleton />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : !purchases?.length ? (
          <EmptyState
            icon={<Truck className="w-7 h-7 text-ink-muted" />}
            title="No purchases found"
            description={
              debouncedSearch || paymentStatus !== "all" || startDate || endDate
                ? "Try adjusting your search or filters."
                : "Record your first purchase from a supplier."
            }
            action={
              <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={handleOpenCreate}>
                Record Purchase
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
                    <th className="px-4 py-3 font-medium">Supplier</th>
                    <th className="px-4 py-3 font-medium text-center">Items</th>
                    <th className="px-4 py-3 font-medium text-right">Total</th>
                    <th className="px-4 py-3 font-medium text-right">Paid</th>
                    <th className="px-4 py-3 font-medium text-right">Due</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {purchases.map((pur) => (
                    <tr key={pur._id || pur.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="px-6 py-3">
                        <span
                          className="font-medium text-primary-600 dark:text-primary-400 cursor-pointer"
                          onClick={() => setViewing(pur)}
                        >
                          {(pur.invoiceNumber || pur.invoice || "PUR").toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-ink-soft whitespace-nowrap">{formatDate(pur.date)}</td>
                      <td className="px-4 py-3 text-ink">
                        {pur.supplierName || pur.supplier?.name || "—"}
                      </td>
                      <td className="px-4 py-3 text-center text-ink">
                        {Array.isArray(pur.items) ? pur.items.length : pur.itemCount ?? 0}
                      </td>
                      <td className="px-4 py-3 text-right text-ink font-medium">
                        {formatMoney(pur.totalAmount ?? pur.total ?? 0, currency)}
                      </td>
                      <td className="px-4 py-3 text-right text-emerald-600">
                        {formatMoney(pur.amountPaid ?? 0, currency)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {pur.dueAmount > 0 ? (
                          <span className="font-medium text-red-600">{formatMoney(pur.dueAmount, currency)}</span>
                        ) : (
                          <span className="text-ink-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge color={statusColor(pur.paymentStatus)}>{capitalize(pur.paymentStatus)}</Badge>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewing(pur)}
                            className="p-2 rounded-lg text-ink-muted hover:text-ink hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                            aria-label="View purchase"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleting(pur)}
                            className="p-2 rounded-lg text-ink-muted hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-500/15 transition"
                            aria-label="Delete purchase"
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
        title="Record Purchase"
        size="xl"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={resetForm}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSubmit} loading={submitting} disabled={submitting}>
              Save Purchase
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
              label="Supplier *"
              options={[{ value: "", label: "Select supplier..." }, ...supplierOptions]}
              value={form.supplier}
              onChange={(e) => setForm((p) => ({ ...p, supplier: e.target.value }))}
            />
            <Input
              label="Date"
              type="date"
              value={form.date}
              onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
            />
          </div>

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
                const price = Number(item.purchasePrice) || 0;
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
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                    />
                    <Input
                      className="col-span-5 sm:col-span-3"
                      label="Purchase Price"
                      type="number"
                      min="0"
                      placeholder="0.00"
                      value={item.purchasePrice}
                      onChange={(e) => handleItemChange(idx, "purchasePrice", e.target.value)}
                    />
                    <div className="col-span-3 sm:col-span-2 hidden sm:flex flex-col justify-center">
                      <p className="text-xs text-ink-muted">Total</p>
                      <p className="font-semibold text-ink">{formatMoney(qty * price, currency)}</p>
                    </div>
                    <div className="col-span-12 sm:col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="p-2 rounded-lg text-ink-muted hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-500/15 transition"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Input
              label="Discount"
              type="number"
              min="0"
              value={form.discount}
              onChange={(e) => setForm((p) => ({ ...p, discount: e.target.value }))}
            />
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
                value={form.amountPaid}
                onChange={(e) => setForm((p) => ({ ...p, amountPaid: e.target.value }))}
              />
            )}
          </div>

          <Input
            label="Note"
            value={form.note}
            onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
          />

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 text-sm">
            <div className="flex gap-4 text-ink-muted">
              <span>Subtotal: <span className="font-semibold text-ink">{formatMoney(computed.subtotal, currency)}</span></span>
              <span>Discount: <span className="font-semibold text-ink">-{formatMoney(computed.discount, currency)}</span></span>
            </div>
            <div>
              <span className="text-ink-muted">Total: </span>
              <span className="text-lg font-bold text-ink">{formatMoney(computed.total, currency)}</span>
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!viewing}
        onClose={() => setViewing(null)}
        title="Purchase Details"
        size="lg"
      >
        {viewing && viewing.items ? (
          <PurchaseDetail data={viewing} currency={currency} />
        ) : (
          <div className="space-y-3 p-2">
            <Skeleton className="h-40 rounded-xl" />
          </div>
        )}
      </Modal>

      <ConfirmModal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Purchase?"
        message={`Are you sure you want to delete purchase ${deleting?.invoiceNumber || ""}? Stock will be reduced back. This cannot be undone.`}
        loading={deleteLoading}
      />
    </div>
  );
}

function PurchaseDetail({ data, currency }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-xs text-ink-muted">Supplier</p>
          <p className="text-ink font-medium mt-0.5">{data.supplierName || data.supplier?.name || "—"}</p>
        </div>
        <div>
          <p className="text-xs text-ink-muted">Date</p>
          <p className="text-ink font-medium mt-0.5">{formatDate(data.date, true)}</p>
        </div>
        <div>
          <p className="text-xs text-ink-muted">Payment Method</p>
          <Badge color="blue">{capitalize(data.paymentMethod)}</Badge>
        </div>
        <div>
          <p className="text-xs text-ink-muted">Status</p>
          <Badge color={statusColor(data.paymentStatus)}>{capitalize(data.paymentStatus)}</Badge>
        </div>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-ink-muted border-b border-border">
            <th className="py-2 pr-2 font-medium">Product</th>
            <th className="py-2 px-2 font-medium text-center">Qty</th>
            <th className="py-2 px-2 font-medium text-right">Unit Price</th>
            <th className="py-2 pl-2 font-medium text-right">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {(data.items || []).map((item, i) => (
            <tr key={i}>
              <td className="py-2 pr-2 text-ink">{item.productName || item.product?.name || "—"}</td>
              <td className="py-2 px-2 text-center text-ink">{item.quantity}</td>
              <td className="py-2 px-2 text-right text-ink-soft">{formatMoney(item.purchasePrice, currency)}</td>
              <td className="py-2 pl-2 text-right text-ink font-medium">{formatMoney(item.total, currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t border-border pt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-xs text-ink-muted">Subtotal</p>
          <p className="font-medium text-ink">{formatMoney(data.subtotal, currency)}</p>
        </div>
        <div>
          <p className="text-xs text-ink-muted">Discount</p>
          <p className="font-medium text-ink">{formatMoney(data.totalDiscount ?? data.discount ?? 0, currency)}</p>
        </div>
        <div>
          <p className="text-xs text-ink-muted">Total</p>
          <p className="font-bold text-ink">{formatMoney(data.totalAmount ?? data.total ?? 0, currency)}</p>
        </div>
        <div>
          <p className="text-xs text-ink-muted">Paid</p>
          <p className="font-medium text-emerald-600">{formatMoney(data.amountPaid ?? 0, currency)}</p>
        </div>
      </div>

      {data.note && (
        <div className="text-sm">
          <span className="text-ink-muted">Note: </span>
          <span className="text-ink">{data.note}</span>
        </div>
      )}
    </div>
  );
}