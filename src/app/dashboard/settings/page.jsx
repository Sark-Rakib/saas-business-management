"use client";

import { useState, useEffect } from "react";
import { Building2, Info } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import api, { getErrorMessage } from "@/lib/api";
import { useFetch, useMutation } from "@/hooks";
import { CURRENCIES, BUSINESS_TYPES } from "@/constants";
import PageHeader from "@/components/common/PageHeader";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ErrorState from "@/components/common/ErrorState";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";

const CURRENCY_OPTIONS = Object.entries(CURRENCIES).map(([code, info]) => ({
  value: code,
  label: `${info.name} (${info.symbol})`,
}));

function GeneralSettingsForm({ business, updateBusiness }) {
  const { showToast } = useToast();
  const mutation = useMutation();
  const [form, setForm] = useState(() => ({
    name: business.name || "",
    phone: business.phone || "",
    email: business.email || "",
    website: business.website || "",
    address: business.address || "",
    description: business.description || "",
    logo: business.logo || "",
  }));

  const refreshBusiness = async () => {
    try {
      const { data } = await api.get("/auth/me");
      if (data?.data?.business) updateBusiness(data.data.business);
    } catch {
      // ignore refresh errors
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await mutation.patch("/settings", form);
      showToast("General information updated", "success");
      await refreshBusiness();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    }
  };

  return (
    <Card
      title="General Information"
      subtitle="Basic details shown to your customers and staff"
      action={
        <Button size="sm" onClick={handleSave} loading={mutation.loading} disabled={mutation.loading}>
          Save
        </Button>
      }
    >
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Business Name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            icon={<Building2 className="w-4 h-4" />}
          />
          <Input
            label="Phone"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          />
          <Input
            label="Website"
            type="url"
            value={form.website}
            onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))}
          />
          <Input
            label="Address"
            value={form.address}
            onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
          />
          <Input
            label="Logo URL"
            type="url"
            value={form.logo}
            onChange={(e) => setForm((p) => ({ ...p, logo: e.target.value }))}
            placeholder="https://example.com/logo.png"
          />
        </div>
        <Input
          label="Description"
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          placeholder="Tell us a bit about your business"
        />
      </form>
    </Card>
  );
}

function BusinessProfileForm({ business, updateBusiness }) {
  const { showToast } = useToast();
  const mutation = useMutation();
  const [form, setForm] = useState(() => ({
    type: business.type || "other",
    currency: business.currency || "BDT",
    startingCapital: String(business.startingCapital ?? 0),
  }));

  const refreshBusiness = async () => {
    try {
      const { data } = await api.get("/auth/me");
      if (data?.data?.business) updateBusiness(data.data.business);
    } catch {
      // ignore refresh errors
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await mutation.patch("/settings", {
        type: form.type,
        currency: form.currency,
        startingCapital: Number(form.startingCapital) || 0,
      });
      showToast("Business profile updated", "success");
      await refreshBusiness();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    }
  };

  return (
    <Card
      title="Business Profile"
      subtitle="Type, currency and starting capital"
      action={
        <Button size="sm" onClick={handleSave} loading={mutation.loading} disabled={mutation.loading}>
          Save
        </Button>
      }
    >
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select
            label="Business Type"
            options={BUSINESS_TYPES}
            value={form.type}
            onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
          />
          <Select
            label="Currency"
            options={CURRENCY_OPTIONS}
            value={form.currency}
            onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))}
          />
          <Input
            label="Starting Capital"
            type="number"
            min="0"
            step="0.01"
            value={form.startingCapital}
            onChange={(e) => setForm((p) => ({ ...p, startingCapital: e.target.value }))}
          />
        </div>
      </form>
    </Card>
  );
}

export default function SettingsPage() {
  const { updateBusiness } = useAuth();
  const { data: business, loading, error, refetch } = useFetch("/settings");
  const [paymentInfo, setPaymentInfo] = useState(null);

  useEffect(() => {
    api
      .get("/subscription/payment-instructions")
      .then((res) => setPaymentInfo(res.data.data))
      .catch(() => setPaymentInfo(null));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Business Settings"
        description="Configure how your business appears and operates"
      />

      {loading ? (
        <LoadingSpinner label="Loading settings..." />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <div className="space-y-6">
          <GeneralSettingsForm business={business} updateBusiness={updateBusiness} />
          <BusinessProfileForm business={business} updateBusiness={updateBusiness} />

          {/* Payment preferences */}
          <Card title="Payment Preferences" subtitle="Numbers your customers use to pay you">
            {paymentInfo ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-surface-soft border border-border rounded-xl p-4">
                  <p className="text-sm font-semibold text-ink">bKash</p>
                  <p className="text-lg font-bold text-ink mt-1">{paymentInfo.bkash}</p>
                </div>
                <div className="bg-surface-soft border border-border rounded-xl p-4">
                  <p className="text-sm font-semibold text-ink">Nagad</p>
                  <p className="text-lg font-bold text-ink mt-1">{paymentInfo.nagad}</p>
                </div>
                <div className="sm:col-span-2 flex items-start gap-3 bg-blue-100 dark:bg-blue-500/15 text-blue-800 dark:text-blue-300 rounded-xl px-4 py-3 text-sm">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>
                    These are the payment numbers your customers pay to when they buy from you.
                    For subscription payments, use the numbers shown on the Subscription page.
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-ink-muted">Payment instructions could not be loaded.</p>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}