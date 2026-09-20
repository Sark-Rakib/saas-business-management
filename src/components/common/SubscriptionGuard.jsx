"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Button from "@/components/ui/Button";

const FEATURE_DESCRIPTIONS = {
  advancedReports: "Unlock advanced reporting and analytics features.",
  pdfExport: "Export your data as professional PDF reports.",
  advancedAnalytics: "Access in-depth analytics and data visualizations.",
};

function isSubscriptionActive(subscription) {
  if (!subscription) return false;
  const plan = subscription.plan || subscription.name;
  if (plan !== "pro") return false;
  if (subscription.expiryDate) {
    return new Date(subscription.expiryDate) > new Date();
  }
  return true;
}

export default function SubscriptionGuard({
  children,
  feature = "advancedReports",
  fallback = false,
}) {
  const { subscription } = useAuth();
  const allowed = isSubscriptionActive(subscription);

  if (allowed) {
    return children;
  }

  if (fallback) {
    return (
      <div className="relative">
        <div className="pointer-events-none opacity-50">{children}</div>
        <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-[2px] rounded-2xl">
          <div className="flex flex-col items-center gap-3 text-center px-4">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Lock className="w-5 h-5 text-ink-muted" />
            </div>
            <p className="text-sm font-medium text-ink-muted">
              Upgrade to Pro to unlock
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
        <Lock className="w-8 h-8 text-ink-muted" />
      </div>
      <h3 className="text-lg font-semibold text-ink mb-1">
        Upgrade to unlock this feature
      </h3>
      <p className="text-sm text-ink-muted text-center max-w-sm mb-6">
        {FEATURE_DESCRIPTIONS[feature] ||
          "This feature requires a Pro subscription."}
      </p>
      <Link href="/dashboard/subscription">
        <Button>View Plans</Button>
      </Link>
    </div>
  );
}
