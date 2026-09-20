"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Package,
  Boxes,
  AlertTriangle,
  PackageX,
  Pencil,
  Trash2,
  Tag,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useFetch, useMutation, useDebounce, usePagination, useAutoOpenNew } from "@/hooks";
import { formatMoney } from "@/constants";
import { getErrorMessage } from "@/lib/api";
import PageHeader from "@/components/common/PageHeader";
import StatCard from "@/components/common/StatCard";
import FilterBar from "@/components/common/FilterBar";
import SearchBar from "@/components/common/SearchBar";
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

const CATEGORIES = ["Apparel", "Electronics", "Accessories", "Footwear", "Furniture", "General"];

const CATEGORY_OPTIONS = [
  { value: "all", label: "All categories" },
  ...CATEGORIES.map((c) => ({ value: c, label: c })),
];

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const EMPTY_FORM = {
  name: "",
  sku: "",
  category: "",
  purchasePrice: "",
  sellingPrice: "",
  stock: "",
  lowStockWarning: "",
  status: "active",
  description: "",
};

function ProductTableSkeleton({ rows = 6 }) {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 rounded-xl" />
      ))}
    </div>
  );
}

export default function ProductsPage() {
  const { business } = useAuth();
  const { showToast } = useToast();
  const currency = business?.currency || "BDT";
  const { page, limit, setPage } = usePagination(1);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
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
    category: category === "all" ? undefined : category,
    status: status === "all" ? undefined : status,
  };

  const {
    data: products,
    loading,
    error,
    pagination,
    refetch,
  } = useFetch("/products", params, {
    onSuccess: (res) => setSummary(res.summary || null),
  });

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, category, status, setPage]);

  const handleOpenCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowForm(true);
  };

  useAutoOpenNew(handleOpenCreate);

  const handleOpenEdit = (product) => {
    setEditing(product);
    setForm({
      name: product.name || "",
      sku: product.sku || "",
      category: product.category || "",
      purchasePrice: product.purchasePrice ?? "",
      sellingPrice: product.sellingPrice ?? "",
      stock: product.stock ?? "",
      lowStockWarning: product.lowStockWarning ?? "",
      status: product.status || "active",
      description: product.description || "",
    });
    setFormError(null);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
  };

  const handleFieldChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError("Product name is required");
      return;
    }

    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim(),
      category: form.category.trim(),
      purchasePrice: Number(form.purchasePrice) || 0,
      sellingPrice: Number(form.sellingPrice) || 0,
      stock: Number(form.stock) || 0,
      lowStockWarning: Number(form.lowStockWarning) || 0,
      status: form.status,
      description: form.description,
    };

    try {
      if (editing) {
        await patch(`/products/${editing._id || editing.id}`, payload);
        showToast("Product updated", "success");
      } else {
        await post("/products", payload);
        showToast("Product created", "success");
      }
      handleCloseForm();
      refetch();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await del(`/products/${deleting._id || deleting.id}`);
      showToast("Product deleted", "success");
      setDeleting(null);
      if (page > 1 && products?.length === 1) setPage(page - 1);
      else refetch();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  const productId = (p) => p._id || p.id;
  const summaryTotal = summary?.totalProducts ?? summary?.total ?? summary?.productCount;
  const summaryStock = summary?.totalStock ?? summary?.stock;
  const summaryLow = summary?.lowStock ?? summary?.lowStockCount ?? 0;
  const summaryOut = summary?.outOfStock ?? summary?.outOfStockCount ?? 0;

  const getStockBadge = (product) => {
    const stock = Number(product.stock) || 0;
    const lowWarning = Number(product.lowStockWarning) || 5;
    if (stock === 0) return { color: "red", label: "Out of stock" };
    if (stock <= lowWarning) return { color: "amber", label: `Low: ${stock}` };
    return { color: "green", label: String(stock) };
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Manage your products & inventory"
        action={
          <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={handleOpenCreate}>
            Add Product
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
              title="Total Products"
              value={summaryTotal ?? 0}
              icon={<Package className="w-5 h-5" />}
              color="primary"
            />
            <StatCard
              title="Total Stock"
              value={summaryStock ?? 0}
              icon={<Boxes className="w-5 h-5" />}
              color="blue"
            />
            <StatCard
              title="Low Stock"
              value={summaryLow ?? 0}
              icon={<AlertTriangle className="w-5 h-5" />}
              color="amber"
            />
            <StatCard
              title="Out of Stock"
              value={summaryOut ?? 0}
              icon={<PackageX className="w-5 h-5" />}
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
          placeholder="Search by name or SKU..."
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
          label="Status"
          className="w-full sm:w-32"
          options={STATUS_OPTIONS}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        />
      </FilterBar>

      {/* Table */}
      <div className="bg-surface-soft border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <ProductTableSkeleton />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : !products?.length ? (
          <EmptyState
            icon={<Package className="w-7 h-7 text-ink-muted" />}
            title="No products found"
            description={
              category !== "all" || status !== "all" || debouncedSearch
                ? "Try adjusting your search or filters."
                : "Add your first product to start tracking inventory."
            }
            action={
              <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={handleOpenCreate}>
                Add Product
              </Button>
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-ink-muted border-b border-border">
                    <th className="px-6 py-3 font-medium">Product</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium text-right">Purchase Price</th>
                    <th className="px-4 py-3 font-medium text-right">Selling Price</th>
                    <th className="px-4 py-3 font-medium text-center">Stock</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {products.map((product) => {
                    const stockBadge = getStockBadge(product);
                    return (
                      <tr key={productId(product)} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-primary-100 dark:bg-primary-500/15 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
                              <Tag className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-ink truncate">{product.name}</p>
                              {product.sku && (
                                <p className="text-xs text-ink-muted truncate">SKU: {product.sku}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-ink-soft">{product.category || "—"}</td>
                        <td className="px-4 py-3 text-right text-ink">{formatMoney(product.purchasePrice, currency)}</td>
                        <td className="px-4 py-3 text-right text-ink font-medium">{formatMoney(product.sellingPrice, currency)}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge color={stockBadge.color}>{stockBadge.label}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge color={product.status === "active" ? "green" : "gray"}>
                            {product.status === "active" ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEdit(product)}
                              className="p-2 rounded-lg text-ink-muted hover:text-ink hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                              aria-label="Edit product"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleting(product)}
                              className="p-2 rounded-lg text-ink-muted hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-500/15 transition"
                              aria-label="Delete product"
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
        onClose={handleCloseForm}
        title={editing ? "Edit Product" : "Add Product"}
        size="lg"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={handleCloseForm}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSubmit} loading={mutating}>
              {editing ? "Save Changes" : "Create Product"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Product Name"
            placeholder="e.g. Cotton T-Shirt"
            value={form.name}
            onChange={handleFieldChange("name")}
            error={formError}
            className="sm:col-span-2"
          />
          <Input
            label="SKU"
            placeholder="e.g. TSR-BLK-M"
            value={form.sku}
            onChange={handleFieldChange("sku")}
          />
          <Input
            label="Category"
            placeholder="e.g. Apparel"
            value={form.category}
            onChange={handleFieldChange("category")}
          />
          <Input
            label="Purchase Price"
            type="number"
            min="0"
            step="0.01"
            value={form.purchasePrice}
            onChange={handleFieldChange("purchasePrice")}
          />
          <Input
            label="Selling Price"
            type="number"
            min="0"
            step="0.01"
            value={form.sellingPrice}
            onChange={handleFieldChange("sellingPrice")}
          />
          <Input
            label="Stock"
            type="number"
            min="0"
            value={form.stock}
            onChange={handleFieldChange("stock")}
          />
          <Input
            label="Low Stock Warning"
            type="number"
            min="0"
            placeholder="e.g. 5"
            value={form.lowStockWarning}
            onChange={handleFieldChange("lowStockWarning")}
          />
          <Select
            label="Status"
            options={[
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
            value={form.status}
            onChange={handleFieldChange("status")}
          />
          <Input
            label="Description"
            placeholder="Optional notes about the product"
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
        title="Delete Product?"
        message={`Are you sure you want to delete "${deleting?.name}"? This action cannot be undone.`}
        loading={deleteLoading}
      />
    </div>
  );
}