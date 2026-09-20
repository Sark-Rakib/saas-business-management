"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Store, Mail, Phone, Lock, Eye, EyeOff, Shield, BarChart3, Zap, TrendingUp } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

const features = [
  { icon: Shield, title: "Bank-grade data isolation", description: "Your data stays encrypted and isolated across tenants." },
  { icon: BarChart3, title: "Real-time business analytics", description: "Track revenue, customers, and KPIs as they happen." },
  { icon: Zap, title: "Lightning fast dashboard", description: "Everything you need, milliseconds away." },
];

const EMPTY_FORM = {
  fullName: "",
  businessName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

const EMPTY_ERRORS = {
  fullName: "",
  businessName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

export default function RegisterPage() {
  const router = useRouter();
  const { user, loading: authLoading, register } = useAuth();
  const { showToast } = useToast();

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState(EMPTY_ERRORS);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/dashboard");
    }
  }, [authLoading, user, router]);

  const setField = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: "" }));
  };

  const validate = () => {
    const nextErrors = { ...EMPTY_ERRORS };
    let valid = true;

    if (!form.fullName.trim()) {
      nextErrors.fullName = "Full name is required.";
      valid = false;
    }
    if (!form.businessName.trim()) {
      nextErrors.businessName = "Business name is required.";
      valid = false;
    }
    if (!form.email.trim()) {
      nextErrors.email = "Email is required.";
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = "Enter a valid email address.";
      valid = false;
    }
    if (!form.phone.trim()) {
      nextErrors.phone = "Phone number is required.";
      valid = false;
    }
    if (!form.password) {
      nextErrors.password = "Password is required.";
      valid = false;
    } else if (form.password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters.";
      valid = false;
    }
    if (form.confirmPassword !== form.password) {
      nextErrors.confirmPassword = "Passwords do not match.";
      valid = false;
    }

    setErrors(nextErrors);
    return valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await register({
        name: form.fullName.trim(),
        businessName: form.businessName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
      });
      showToast("Account created!");
      router.push("/onboarding");
    } catch (err) {
      showToast(err?.response?.data?.message || err?.message || "Registration failed. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-surface">
      {/* Left brand panel */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-900 text-white flex-col justify-between p-12 xl:p-16">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </span>
          <span className="text-2xl font-bold tracking-tight">BizSuite</span>
        </div>

        <div className="space-y-10">
          <div>
            <h1 className="text-4xl xl:text-5xl font-bold leading-tight tracking-tight">
              Start your business on the right foot.
            </h1>
            <p className="mt-4 text-lg text-white/70 max-w-md">
              Create your account and set up your workspace in minutes.
            </p>
          </div>

          <div className="space-y-6">
            {features.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex items-start gap-4">
                <span className="shrink-0 w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </span>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="text-sm text-white/60 mt-0.5">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-sm text-white/50">© {new Date().getFullYear()} BizSuite. All rights reserved.</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md mx-auto">
          <div className="mb-8 lg:hidden flex items-center gap-2 justify-center">
            <span className="w-9 h-9 rounded-xl bg-primary-600 text-white flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </span>
            <span className="text-xl font-bold tracking-tight text-ink">BizSuite</span>
          </div>

          <div className="bg-surface-card rounded-2xl border border-border shadow-sm p-8">
            <h2 className="text-2xl font-bold text-ink tracking-tight">Create your account</h2>
            <p className="mt-1 text-sm text-ink-muted">Get started with your 14-day free trial.</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
              <Input
                label="Full Name"
                type="text"
                placeholder="Jane Cooper"
                value={form.fullName}
                onChange={setField("fullName")}
                icon={<User className="w-4 h-4" />}
                error={errors.fullName}
                autoComplete="name"
              />

              <Input
                label="Business Name"
                type="text"
                placeholder="Acme Inc."
                value={form.businessName}
                onChange={setField("businessName")}
                icon={<Store className="w-4 h-4" />}
                error={errors.businessName}
                autoComplete="organization"
              />

              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={setField("email")}
                  icon={<Mail className="w-4 h-4" />}
                  error={errors.email}
                  autoComplete="email"
                />
                <Input
                  label="Phone"
                  type="tel"
                  placeholder="+1 234 567 8900"
                  value={form.phone}
                  onChange={setField("phone")}
                  icon={<Phone className="w-4 h-4" />}
                  error={errors.phone}
                  autoComplete="tel"
                />
              </div>

              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 6 characters"
                value={form.password}
                onChange={setField("password")}
                icon={<Lock className="w-4 h-4" />}
                error={errors.password}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="text-ink-muted hover:text-ink transition p-1"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                autoComplete="new-password"
              />

              <Input
                label="Confirm Password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter your password"
                value={form.confirmPassword}
                onChange={setField("confirmPassword")}
                icon={<Lock className="w-4 h-4" />}
                error={errors.confirmPassword}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((s) => !s)}
                    className="text-ink-muted hover:text-ink transition p-1"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                autoComplete="new-password"
              />

              <Button type="submit" fullWidth size="lg" loading={submitting} className="mt-2">
                {submitting ? "Creating account..." : "Create account"}
              </Button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-ink-muted">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-medium text-primary-600 hover:text-primary-700 transition">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}