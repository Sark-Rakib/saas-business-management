"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Store, MapPin, Phone, DollarSign, FileText, Link2, TrendingUp, ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Spinner from "@/components/ui/Spinner";
import api, { getErrorMessage } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { BUSINESS_TYPES as BUSINESS_TYPE_OPTIONS, CURRENCIES as CURRENCY_OPTIONS } from "@/constants";

const BUSINESS_TYPES = [
  { value: "", label: "Select a type..." },
  ...BUSINESS_TYPE_OPTIONS,
];

const CURRENCIES = Object.entries(CURRENCY_OPTIONS).map(([code, info]) => ({
  value: code,
  label: `${code} — ${info.name}`,
}));

const EMPTY_FORM = {
  name: "",
  type: "",
  currency: "BDT",
  address: "",
  phone: "",
  startingCapital: "",
  description: "",
  logoUrl: "",
};

export default function OnboardingPage() {
  const router = useRouter();
  const { user, business, loading, fetchMe } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    if (!loading && business?.isOnboarded) {
      router.replace("/dashboard");
    }
  }, [loading, business, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-primary-600">
        <Spinner size="lg" />
      </div>
    );
  }

  return <OnboardingForm user={user} business={business} fetchMe={fetchMe} showToast={showToast} />;
}

function OnboardingForm({ user, business, fetchMe, showToast }) {
  const router = useRouter();
  const [form, setForm] = useState(() => ({ ...EMPTY_FORM, name: business?.name || "" }));
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [skipping, setSkipping] = useState(false);

  const setField = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: "" }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = "Business name is required.";
    if (!form.type) nextErrors.type = "Select a business type.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await api.post("/business/onboarding", {
        name: form.name.trim(),
        type: form.type,
        currency: form.currency,
        address: form.address.trim(),
        phone: form.phone.trim(),
        startingCapital: form.startingCapital ? Number(form.startingCapital) : undefined,
        description: form.description.trim(),
        logo: form.logoUrl.trim(),
      });
      showToast("Welcome aboard!");
      await fetchMe();
      router.push("/dashboard");
    } catch (err) {
      showToast(getErrorMessage(err, "Could not complete setup. Please try again."), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setSkipping(true);
    try {
      await api.post("/business/onboarding", {});
      await fetchMe();
      router.push("/dashboard");
    } catch (err) {
      showToast(getErrorMessage(err, "Could not skip setup. Please try again."), "error");
      setSkipping(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface px-6 py-12">
      <div className="w-full max-w-2xl mx-auto">
        <div className="mb-8 flex items-center gap-2 justify-center">
          <span className="w-9 h-9 rounded-xl bg-primary-600 text-white flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </span>
          <span className="text-xl font-bold tracking-tight text-ink">BizSuite</span>
        </div>

        <div className="bg-surface-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-primary-600 via-primary-500 to-indigo-500" />

          <div className="p-8 sm:p-10">
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight">Complete your business setup</h1>
              <p className="mt-2 text-sm text-ink-muted">
                Hi {user?.name?.split(" ")[0] || "there"}! Tell us a bit about {business?.name || "your business"} so we can tailor your workspace.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="Business Name"
                  type="text"
                  placeholder="Acme Inc."
                  value={form.name}
                  onChange={setField("name")}
                  icon={<Store className="w-4 h-4" />}
                  error={errors.name}
                />
                <Select
                  label="Business Type"
                  value={form.type}
                  onChange={setField("type")}
                  options={BUSINESS_TYPES}
                  error={errors.type}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Select
                  label="Currency"
                  value={form.currency}
                  onChange={setField("currency")}
                  options={CURRENCIES}
                  className="sm:col-span-1"
                />
                <Input
                  label="Starting Capital"
                  type="number"
                  placeholder="0.00"
                  value={form.startingCapital}
                  onChange={setField("startingCapital")}
                  icon={<DollarSign className="w-4 h-4" />}
                />
              </div>

              <Input
                label="Business Address"
                type="text"
                placeholder="123 Main Street, City"
                value={form.address}
                onChange={setField("address")}
                icon={<MapPin className="w-4 h-4" />}
              />

              <Input
                label="Business Phone"
                type="tel"
                placeholder="+1 234 567 8900"
                value={form.phone}
                onChange={setField("phone")}
                icon={<Phone className="w-4 h-4" />}
              />

              <Input
                label="Business Description"
                type="text"
                placeholder="What does your business do?"
                value={form.description}
                onChange={setField("description")}
                icon={<FileText className="w-4 h-4" />}
              />

              <Input
                label="Logo URL (optional)"
                type="url"
                placeholder="https://..."
                value={form.logoUrl}
                onChange={setField("logoUrl")}
                icon={<Link2 className="w-4 h-4" />}
              />

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Button type="submit" fullWidth size="lg" loading={submitting} icon={<ArrowRight className="w-4 h-4" />}>
                  {submitting ? "Setting up..." : "Finish setup"}
                </Button>
              </div>

              <p className="text-center">
                <button
                  type="button"
                  onClick={handleSkip}
                  className="text-sm font-medium text-ink-muted hover:text-primary-600 transition"
                  disabled={submitting}
                >
                  {skipping ? "Skipping..." : "Skip for now"}
                </button>
              </p>
            </form>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-ink-muted">
          Questions?{" "}
          <Link href="/dashboard" className="font-medium text-primary-600 hover:text-primary-700 transition">
            Visit the dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}