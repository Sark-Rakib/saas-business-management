"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, ArrowLeft, TrendingUp } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import api, { getErrorMessage } from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/auth/forgot-password", { email: email.trim() });
      showToast("Reset link sent!");
      router.push("/auth/login");
    } catch (err) {
      setError("");
      showToast(getErrorMessage(err, "Could not send reset link. Please try again."), "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-6 py-12">
      <div className="w-full max-w-md mx-auto">
        <div className="mb-8 flex items-center gap-2 justify-center">
          <span className="w-9 h-9 rounded-xl bg-primary-600 text-white flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </span>
          <span className="text-xl font-bold tracking-tight text-ink">BizSuite</span>
        </div>

        <div className="bg-surface-card rounded-2xl border border-border shadow-sm p-8 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-500/10 text-primary-600 flex items-center justify-center">
            <Mail className="w-7 h-7" />
          </div>

          <h1 className="mt-5 text-2xl font-bold text-ink tracking-tight">Forgot your password?</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Enter your account email and we&apos;ll send you a link to reset your password.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5 text-left" noValidate>
            <Input
              label="Email Address"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              icon={<Mail className="w-4 h-4" />}
              error={error}
              autoComplete="email"
            />

            <Button type="submit" fullWidth size="lg" loading={submitting}>
              {submitting ? "Sending link..." : "Send reset link"}
            </Button>
          </form>

          <div className="mt-5 rounded-xl bg-surface-soft border border-border px-4 py-3 text-sm text-ink-muted">
            If an account with that email exists, a reset link has been sent.
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-ink-muted">
          <Link href="/auth/login" className="inline-flex items-center gap-1.5 font-medium text-primary-600 hover:text-primary-700 transition">
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}