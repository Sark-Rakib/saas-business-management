"use client";

import { useState, Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, ArrowLeft, TrendingUp, Eye, EyeOff } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Spinner from "@/components/ui/Spinner";
import api, { getErrorMessage } from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({ newPassword: "", confirmPassword: "" });
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      showToast("Invalid or missing reset token.", "error");
      router.replace("/auth/forgot-password");
    }
  }, [token, router, showToast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = { newPassword: "", confirmPassword: "" };
    let valid = true;

    if (!newPassword) {
      nextErrors.newPassword = "Password is required.";
      valid = false;
    } else if (newPassword.length < 6) {
      nextErrors.newPassword = "Password must be at least 6 characters.";
      valid = false;
    }
    if (confirmPassword !== newPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
      valid = false;
    }

    setErrors(nextErrors);
    if (!valid) return;

    setSubmitting(true);
    try {
      await api.post("/auth/reset-password", { token, newPassword });
      showToast("Password reset successfully!");
      router.push("/auth/login");
    } catch (err) {
      showToast(getErrorMessage(err, "Could not reset password. Please try again."), "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-8 flex items-center gap-2 justify-center">
        <span className="w-9 h-9 rounded-xl bg-primary-600 text-white flex items-center justify-center">
          <TrendingUp className="w-5 h-5" />
        </span>
        <span className="text-xl font-bold tracking-tight text-ink">BizSuite</span>
      </div>

      <div className="bg-surface-card rounded-2xl border border-border shadow-sm p-8">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-500/10 text-primary-600 flex items-center justify-center">
          <Lock className="w-7 h-7" />
        </div>

        <h1 className="mt-5 text-2xl font-bold text-ink tracking-tight text-center">Set a new password</h1>
        <p className="mt-2 text-sm text-ink-muted text-center">
          Choose a strong password you haven&apos;t used before.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
          <Input
            label="New Password"
            type={showNew ? "text" : "password"}
            placeholder="At least 6 characters"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              setErrors((er) => ({ ...er, newPassword: "" }));
            }}
            icon={<Lock className="w-4 h-4" />}
            error={errors.newPassword}
            rightElement={
              <button
                type="button"
                onClick={() => setShowNew((s) => !s)}
                className="text-ink-muted hover:text-ink transition p-1"
                aria-label={showNew ? "Hide password" : "Show password"}
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            autoComplete="new-password"
          />

          <Input
            label="Confirm Password"
            type={showConfirm ? "text" : "password"}
            placeholder="Re-enter your new password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setErrors((er) => ({ ...er, confirmPassword: "" }));
            }}
            icon={<Lock className="w-4 h-4" />}
            error={errors.confirmPassword}
            rightElement={
              <button
                type="button"
                onClick={() => setShowConfirm((s) => !s)}
                className="text-ink-muted hover:text-ink transition p-1"
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            autoComplete="new-password"
          />

          <Button type="submit" fullWidth size="lg" loading={submitting} className="mt-2">
            {submitting ? "Resetting password..." : "Reset password"}
          </Button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-ink-muted">
        <Link href="/auth/login" className="inline-flex items-center gap-1.5 font-medium text-primary-600 hover:text-primary-700 transition">
          <ArrowLeft className="w-4 h-4" />
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-6 py-12">
      <Suspense
        fallback={
          <div className="flex items-center justify-center text-primary-600">
            <Spinner size="lg" />
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}