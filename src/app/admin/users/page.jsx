"use client";

import { useState, useEffect } from "react";
import {
  Users,
  UserCheck,
  Ban,
  Shield,
  User as UserIcon,
} from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { useFetch, useMutation, useDebounce, usePagination } from "@/hooks";
import { getErrorMessage } from "@/lib/api";
import { formatDate, capitalize } from "@/constants";
import AdminLayout from "@/components/layout/AdminLayout";
import PageHeader from "@/components/common/PageHeader";
import StatCard from "@/components/common/StatCard";
import FilterBar from "@/components/common/FilterBar";
import SearchBar from "@/components/common/SearchBar";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import Pagination from "@/components/common/Pagination";
import ConfirmModal from "@/components/common/ConfirmModal";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Badge from "@/components/ui/Badge";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";

const ID = (item) => item._id || item.id;

export default function AdminUsersPage() {
  const { showToast } = useToast();
  const { page, limit, setPage } = usePagination(1);
  const { patch, loading: mutating } = useMutation();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [isActive, setIsActive] = useState("all");
  const [suspendTarget, setSuspendTarget] = useState(null);

  const params = {
    page,
    limit,
    search: debouncedSearch || undefined,
    isActive: isActive === "all" ? undefined : isActive,
  };

  const {
    data: users,
    loading,
    error,
    pagination,
    refetch,
  } = useFetch("/admin/users", params);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, isActive, setPage]);

  const activeCount = users?.filter((u) => u.isActive !== false).length || 0;
  const suspendedCount = users?.filter((u) => u.isActive === false).length || 0;

  const handleToggleStatus = async (user) => {
    const willSuspend = user.isActive !== false;
    if (willSuspend) {
      setSuspendTarget(user);
      return;
    }
    try {
      await patch(`/admin/users/${ID(user)}`, { isActive: true });
      showToast(`${user.name || "User"} activated`, "success");
      refetch();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    }
  };

  const handleConfirmSuspend = async () => {
    if (!suspendTarget) return;
    try {
      await patch(`/admin/users/${ID(suspendTarget)}`, { isActive: false });
      showToast(`${suspendTarget.name || "User"} suspended`, "success");
      setSuspendTarget(null);
      refetch();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          title="User Management"
          description="Manage all registered users across businesses"
          action={
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search users..."
              className="w-full sm:w-64"
            />
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Total Users"
            value={loading ? "—" : (pagination?.total ?? users?.length ?? 0)}
            icon={<Users className="w-5 h-5" />}
            color="blue"
          />
          <StatCard
            title="Active"
            value={loading ? "—" : activeCount}
            icon={<UserCheck className="w-5 h-5" />}
            color="green"
          />
          <StatCard
            title="Suspended"
            value={loading ? "—" : suspendedCount}
            icon={<Ban className="w-5 h-5" />}
            color="red"
          />
        </div>

        {/* Filters */}
        <FilterBar>
          <Select
            label="Status"
            className="w-full sm:w-40"
            options={[
              { value: "all", label: "All statuses" },
              { value: "true", label: "Active" },
              { value: "false", label: "Suspended" },
            ]}
            value={isActive}
            onChange={(e) => setIsActive(e.target.value)}
          />
        </FilterBar>

        {/* Table */}
        <div className="bg-surface-soft border border-border rounded-2xl overflow-hidden">
          {loading ? (
            <LoadingSpinner label="Loading users..." />
          ) : error ? (
            <ErrorState message={error} onRetry={refetch} />
          ) : !users?.length ? (
            <EmptyState
              icon={<Users className="w-7 h-7 text-ink-muted" />}
              title="No users found"
              description={
                debouncedSearch || isActive !== "all"
                  ? "Try adjusting your search or filters."
                  : "No users have registered yet."
              }
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-ink-muted border-b border-border">
                      <th className="px-6 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium">Phone</th>
                      <th className="px-4 py-3 font-medium">Role</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Business</th>
                      <th className="px-4 py-3 font-medium">Plan</th>
                      <th className="px-4 py-3 font-medium">Created</th>
                      <th className="px-6 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {users.map((user) => {
                      const suspended = user.isActive === false;
                      return (
                        <tr
                          key={ID(user)}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                        >
                          <td className="px-6 py-3">
                            <p className="text-ink font-medium">{user.name || "—"}</p>
                            {user.email && (
                              <p className="text-xs text-ink-muted truncate max-w-[220px]">
                                {user.email}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-ink-soft whitespace-nowrap">
                            {user.phone || "—"}
                          </td>
                          <td className="px-4 py-3">
                            {user.role === "admin" ? (
                              <Badge color="purple">
                                <span className="inline-flex items-center gap-1">
                                  <Shield className="w-3.5 h-3.5" />
                                  Admin
                                </span>
                              </Badge>
                            ) : (
                              <Badge color="gray">
                                <span className="inline-flex items-center gap-1">
                                  <UserIcon className="w-3.5 h-3.5" />
                                  User
                                </span>
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Badge color={suspended ? "red" : "green"}>
                              {suspended ? "Suspended" : "Active"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-ink-soft truncate max-w-[180px]">
                            {user.subscription?.business?.name ||
                              user.business?.name ||
                              "—"}
                          </td>
                          <td className="px-4 py-3">
                            <Badge color={user.subscription?.plan === "pro" ? "blue" : "gray"}>
                              {capitalize(user.subscription?.plan || "free")}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-ink-soft whitespace-nowrap">
                            {formatDate(user.createdAt)}
                          </td>
                          <td className="px-6 py-3">
                            <div className="flex items-center justify-end">
                              <Button
                                size="sm"
                                variant={suspended ? "primary" : "danger"}
                                loading={mutating}
                                onClick={() => handleToggleStatus(user)}
                              >
                                {suspended ? "Activate" : "Suspend"}
                              </Button>
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
      </div>

      {/* Suspend confirmation */}
      <ConfirmModal
        isOpen={!!suspendTarget}
        onClose={() => setSuspendTarget(null)}
        onConfirm={handleConfirmSuspend}
        title="Suspend User?"
        message={`Are you sure you want to suspend ${suspendTarget?.name || "this user"}? They will lose access to their account.`}
        loading={mutating}
      />
    </AdminLayout>
  );
}