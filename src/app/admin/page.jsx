"use client";

import Link from "next/link";
import {
  Users,
  UserCheck,
  Clock,
  CreditCard,
  Banknote,
  Building2,
  Ban,
  UserMinus,
  ArrowRight,
} from "lucide-react";
import { useFetch } from "@/hooks";
import { formatMoney } from "@/constants";
import AdminLayout from "@/components/layout/AdminLayout";
import PageHeader from "@/components/common/PageHeader";
import StatCard from "@/components/common/StatCard";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ErrorState from "@/components/common/ErrorState";

export default function AdminDashboardPage() {
  const { data, loading, error, refetch } = useFetch("/admin/dashboard");

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader title="Admin Dashboard" description="System overview" />

        {loading ? (
          <LoadingSpinner label="Loading dashboard..." />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Users"
                value={data?.totalUsers ?? 0}
                icon={<Users className="w-5 h-5" />}
                color="blue"
              />
              <StatCard
                title="Active Users"
                value={data?.activeUsers ?? 0}
                icon={<UserCheck className="w-5 h-5" />}
                color="green"
              />
              <StatCard
                title="Pending Payments"
                value={data?.pendingPayments ?? 0}
                icon={<Clock className="w-5 h-5" />}
                color="amber"
              />
              <StatCard
                title="Paid Subscriptions"
                value={data?.paidSubscriptions ?? 0}
                icon={<CreditCard className="w-5 h-5" />}
                color="purple"
              />
              <StatCard
                title="Total Revenue"
                value={formatMoney(data?.totalRevenue)}
                icon={<Banknote className="w-5 h-5" />}
                color="primary"
              />
              <StatCard
                title="Total Businesses"
                value={data?.totalBusinesses ?? 0}
                icon={<Building2 className="w-5 h-5" />}
                color="blue"
              />
              <StatCard
                title="Suspended"
                value={data?.suspendedUsers ?? 0}
                icon={<Ban className="w-5 h-5" />}
                color="red"
              />
              <StatCard
                title="Free Users"
                value={data?.freeUsers ?? 0}
                icon={<UserMinus className="w-5 h-5" />}
                color="gray"
              />
            </div>

            <Card
              title="Recent Pending"
              subtitle="Payments waiting for your review"
              action={
                <Link href="/admin/payments">
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<ArrowRight className="w-4 h-4" />}
                  >
                    View All
                  </Button>
                </Link>
              }
            >
              <p className="text-sm text-ink-soft">
                {data?.pendingPayments
                  ? `${data.pendingPayments} pending payment${data.pendingPayments === 1 ? "" : "s"} require review.`
                  : "No pending payments. Everything is up to date."}
              </p>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
}