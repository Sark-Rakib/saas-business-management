"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, Shield, BarChart3, Zap, TrendingUp } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Spinner from "@/components/ui/Spinner";
import { getErrorMessage } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

const features = [
  { icon: Shield, title: "Bank-grade data isolation", description: "Your data stays encrypted and isolated across tenants." },
  { icon: BarChart3, title: "Real-time business analytics", description: "Track revenue, customers, and KPIs as they happen." },
  { icon: Zap, title: "Lightning fast dashboard", description: "Everything you need, milliseconds away." },
];

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading, login } = useAuth();
  const { showToast } = useToast();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/dashboard");
    }
  }, [authLoading, user, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-primary-600">
        <Spinner size="lg" />
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!identifier.trim() || !password) {
      setError("Please enter both your email/phone and password.");
      return;
    }

    setSubmitting(true);
    try {
      await login(identifier.trim(), password, remember);
      showToast("Welcome back!");
      router.push("/dashboard");
    } catch (err) {
      showToast(getErrorMessage(err, "Invalid credentials. Please try again."), "error");
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
              Run your entire business from one place.
            </h1>
            <p className="mt-4 text-lg text-white/70 max-w-md">
              Manage customers, inventory, accounting, and teams — simplified for modern entrepreneurs.
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
            <h2 className="text-2xl font-bold text-ink tracking-tight">Welcome back</h2>
            <p className="mt-1 text-sm text-ink-muted">Sign in to continue to your dashboard.</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
              <Input
                label="Email or Phone"
                type="text"
                placeholder="you@company.com or +1 234 567 8900"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                icon={<Mail className="w-4 h-4" />}
                autoComplete="username"
              />

              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="w-4 h-4" />}
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
                autoComplete="current-password"
              />

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-ink-muted cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-primary-600 focus:ring-primary-500"
                  />
                  Remember me
                </label>
                <Link href="/auth/forgot-password" className="text-sm font-medium text-primary-600 hover:text-primary-700 transition">
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" fullWidth size="lg" loading={submitting}>
                {submitting ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-ink-muted">
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" className="font-medium text-primary-600 hover:text-primary-700 transition">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}