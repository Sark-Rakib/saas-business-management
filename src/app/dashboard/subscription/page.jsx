"use client";

import { useState, useEffect } from "react";
import {
  Check,
  X,
  AlertTriangle,
  Crown,
  Smartphone,
  CreditCard,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import api, { getErrorMessage } from "@/lib/api";
import { useFetch, useMutation } from "@/hooks";
import { formatMoney, formatDate, capitalize } from "@/constants";
import PageHeader from "@/components/common/PageHeader";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";

const LIMIT_FEATURES = [
  { key: "products", label: "Products" },
  { key: "transactions", label: "Transactions" },
  { key: "customers", label: "Customers" },
  { key: "advancedReports", label: "Advanced Reports" },
  { key: "pdfExport", label: "PDF Export" },
  { key: "advancedAnalytics", label: "Advanced Analytics" },
];

const DEFAULT_PLAN_LIMITS = {
  free: { products: 25, transactions: 100, customers: 15, advancedReports: false, pdfExport: false, advancedAnalytics: false },
  pro: { products: -1, transactions: -1, customers: -1, advancedReports: true, pdfExport: true, advancedAnalytics: true },
};

const PAYMENT_METHOD_OPTIONS = [
  { value: "bkash", label: "bKash" },
  { value: "nagad", label: "Nagad" },
];

function paymentStatusColor(status) {
  if (status === "approved") return "green";
  if (status === "rejected") return "red";
  return "amber";
}

function PlanLimitValue({ value }) {
  if (value === true) return <Check className="w-4 h-4 text-emerald-500" />;
  if (value === false) return <X className="w-4 h-4 text-red-400" />;
  if (value === -1) return <span className="font-medium text-ink">Unlimited</span>;
  return <span className="font-medium text-ink">{value}</span>;
}

export default function SubscriptionPage() {
  const { business } = useAuth();
  const currency = business?.currency || "BDT";
  const { showToast } = useToast();
  const { post, loading: submitting } = useMutation();

  const {
    data: subscription,
    loading: subLoading,
    error: subError,
    refetch: subscriptionRefetch,
  } = useFetch("/subscription");
  const { data: plans } = useFetch("/subscription/plans");
  const {
    data: payments,
    loading: paymentsLoading,
    error: paymentsError,
    refetch: paymentsRefetch,
  } = useFetch("/payments");

  const [paymentInfo, setPaymentInfo] = useState(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    paymentMethod: "bkash",
    transactionId: "",
    senderNumber: "",
    amount: "499",
    paymentDate: new Date().toISOString().slice(0, 10),
  });
  const [paymentError, setPaymentError] = useState(null);

  useEffect(() => {
    api
      .get("/subscription/payment-instructions")
      .then((res) => setPaymentInfo(res.data.data))
      .catch(() => setPaymentInfo(null));
  }, []);

  const proPrice = plans?.find((p) => p.id === "pro")?.price ?? 499;

  const openPaymentModal = () => {
    setPaymentForm({
      paymentMethod: "bkash",
      transactionId: "",
      senderNumber: "",
      amount: String(proPrice),
      paymentDate: new Date().toISOString().slice(0, 10),
    });
    setPaymentError(null);
    setPaymentOpen(true);
  };

  const resetPaymentForm = () => {
    setPaymentForm({
      paymentMethod: "bkash",
      transactionId: "",
      senderNumber: "",
      amount: String(proPrice),
      paymentDate: new Date().toISOString().slice(0, 10),
    });
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    setPaymentError(null);
    if (paymentForm.amount <= 0) {
      setPaymentError("Amount must be greater than 0.");
      return;
    }
    try {
      await post("/payments", {
        plan: "pro",
        paymentMethod: paymentForm.paymentMethod,
        transactionId: paymentForm.transactionId,
        senderNumber: paymentForm.senderNumber,
        amount: Number(paymentForm.amount),
        paymentDate: paymentForm.paymentDate,
      });
      showToast("Payment request submitted", "success");
      setPaymentOpen(false);
      resetPaymentForm();
      subscriptionRefetch();
      paymentsRefetch();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    }
  };

  const freeLimits = plans?.find((p) => p.id === "free")?.limits || DEFAULT_PLAN_LIMITS.free;
  const proLimits = plans?.find((p) => p.id === "pro")?.limits || DEFAULT_PLAN_LIMITS.pro;
  const isFree = subscription?.plan === "free";

  if (subLoading) {
    return (
      <div className="">
        <PageHeader title="Subscription & Billing" description="Manage your plan and payment history" />
        <LoadingSpinner label="Loading subscription..." />
      </div>
    );
  }

  if (subError) {
    return (
      <div className="">
        <PageHeader title="Subscription & Billing" description="Manage your plan and payment history" />
        <ErrorState message={subError} onRetry={subscriptionRefetch} />
      </div>
    );
  }

  const planDetails = subscription?.planDetails || {};
  const isExpired = subscription?.isExpired;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscription & Billing"
        description="Manage your plan, payments and billing history"
        action={
          <Button size="sm" icon={<Crown className="w-4 h-4" />} onClick={openPaymentModal}>
            {isFree ? "Upgrade to Pro" : "Renew Pro"}
          </Button>
        }
      />

      {isExpired && (
        <div className="flex items-start gap-3 bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 rounded-xl px-4 py-3 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p>Your subscription has expired. Your data is safe. Upgrade to continue using premium features.</p>
        </div>
      )}

      {/* Current plan */}
      <Card title="Current Plan">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-500/15 flex items-center justify-center">
              <Crown className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-ink">{planDetails.name || capitalize(subscription?.plan)}</h3>
                <Badge color={isExpired ? "red" : "green"}>{isExpired ? "Expired" : "Active"}</Badge>
              </div>
              <p className="text-sm text-ink-muted mt-0.5">
                {planDetails.price > 0 ? `${formatMoney(planDetails.price, currency)} / month` : "Free plan"}
              </p>
            </div>
          </div>
          <div className="text-sm text-ink-soft text-right">
            {subscription?.startDate && (
              <p>
                Started: <span className="text-ink font-medium">{formatDate(subscription.startDate)}</span>
              </p>
            )}
            {subscription?.expiryDate && (
              <p>
                Expires: <span className="text-ink font-medium">{formatDate(subscription.expiryDate)}</span>
              </p>
            )}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {LIMIT_FEATURES.map((feature) => (
            <div key={feature.key} className="bg-surface-soft border border-border rounded-xl p-3">
              <p className="text-xs text-ink-muted">{feature.label}</p>
              <div className="mt-1">
                <PlanLimitValue value={planDetails.limits?.[feature.key]} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Plan comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface-soft border border-border rounded-2xl p-6 flex flex-col">
          <h3 className="text-lg font-bold text-ink">Free</h3>
          <p className="mt-1 text-2xl font-bold text-ink">Free</p>
          <ul className="mt-5 space-y-3 flex-1">
            {LIMIT_FEATURES.map((feature) => (
              <li key={feature.key} className="flex items-center justify-between text-sm">
                <span className="text-ink-soft">{feature.label}</span>
                <PlanLimitValue value={freeLimits?.[feature.key]} />
              </li>
            ))}
          </ul>
        </div>

        <div className="relative bg-surface-soft border-2 border-primary-500 rounded-2xl p-6 flex flex-col shadow-lg">
          <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
            Popular
          </span>
          <h3 className="text-lg font-bold text-ink">Pro</h3>
          <p className="mt-1 text-2xl font-bold text-ink">{formatMoney(proPrice, currency)} / month</p>
          <ul className="mt-5 space-y-3 flex-1">
            {LIMIT_FEATURES.map((feature) => (
              <li key={feature.key} className="flex items-center justify-between text-sm">
                <span className="text-ink-soft">{feature.label}</span>
                <PlanLimitValue value={proLimits?.[feature.key]} />
              </li>
            ))}
          </ul>
          <div className="mt-6">
            <Button size="sm" fullWidth icon={<Crown className="w-4 h-4" />} onClick={openPaymentModal}>
              {isFree ? "Upgrade" : "Renew"}
            </Button>
          </div>
        </div>
      </div>

      {/* Payment history */}
      <div className="bg-surface-soft border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-base font-semibold text-ink">Payment History</h3>
        </div>
        {paymentsLoading ? (
          <LoadingSpinner label="Loading payments..." />
        ) : paymentsError ? (
          <ErrorState message={paymentsError} onRetry={paymentsRefetch} />
        ) : !payments?.length ? (
          <EmptyState
            icon={<CreditCard className="w-7 h-7 text-ink-muted" />}
            title="No payment requests yet"
            description="Payment requests you submit will appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-ink-muted border-b border-border">
                  <th className="px-6 py-3 font-medium">Method</th>
                  <th className="px-4 py-3 font-medium">Transaction ID</th>
                  <th className="px-4 py-3 font-medium">Sender</th>
                  <th className="px-4 py-3 font-medium text-right">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="px-6 py-3">
                      <Badge color="blue">
                        <span className="inline-flex items-center gap-1">
                          <Smartphone className="w-3.5 h-3.5" />
                          {capitalize(payment.paymentMethod)}
                        </span>
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-ink font-medium">{payment.transactionId}</td>
                    <td className="px-4 py-3 text-ink-soft">{payment.senderNumber}</td>
                    <td className="px-4 py-3 text-right text-ink font-medium">{formatMoney(payment.amount, currency)}</td>
                    <td className="px-4 py-3">
                      <Badge color={paymentStatusColor(payment.status)}>{capitalize(payment.status)}</Badge>
                    </td>
                    <td className="px-6 py-3 text-ink-soft whitespace-nowrap">{formatDate(payment.createdAt, true)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment flow modal */}
      <Modal
        isOpen={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        title="Upgrade to Pro"
        size="lg"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setPaymentOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSubmitPayment} loading={submitting} disabled={submitting}>
              Submit Payment Request
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmitPayment} className="space-y-5">
          {paymentError && (
            <div className="text-sm text-red-600 bg-red-100 dark:bg-red-500/15 rounded-xl px-4 py-3">
              {paymentError}
            </div>
          )}

          <div className="bg-blue-100 dark:bg-blue-500/15 text-blue-800 dark:text-blue-300 rounded-xl px-4 py-3 text-sm space-y-1">
            <p className="font-semibold">Step 1: Send payment</p>
            <p>
              Send <span className="font-semibold">{formatMoney(Number(paymentForm.amount) || proPrice, currency)}</span> (Pro,{" "}
              {formatMoney(proPrice, currency)}/month) to one of these numbers:
            </p>
            <p>bKash: {paymentInfo?.bkash || "01XXXXXXXXX"}</p>
            <p>Nagad: {paymentInfo?.nagad || "01XXXXXXXXX"}</p>
          </div>

          <div className="space-y-4">
            <p className="text-sm font-semibold text-ink">Step 2: Submit payment details</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Payment Method"
                options={PAYMENT_METHOD_OPTIONS}
                value={paymentForm.paymentMethod}
                onChange={(e) => setPaymentForm((p) => ({ ...p, paymentMethod: e.target.value }))}
              />
              <Input
                label="Transaction ID"
                value={paymentForm.transactionId}
                onChange={(e) => setPaymentForm((p) => ({ ...p, transactionId: e.target.value }))}
                placeholder="e.g. 9HX4K7L2M1"
              />
              <Input
                label="Sender Number"
                type="tel"
                value={paymentForm.senderNumber}
                onChange={(e) => setPaymentForm((p) => ({ ...p, senderNumber: e.target.value }))}
                placeholder="e.g. 01XXXXXXXXX"
              />
              <Input
                label="Amount"
                type="number"
                min="0"
                step="0.01"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm((p) => ({ ...p, amount: e.target.value }))}
              />
              <Input
                label="Payment Date"
                type="date"
                value={paymentForm.paymentDate}
                onChange={(e) => setPaymentForm((p) => ({ ...p, paymentDate: e.target.value }))}
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}