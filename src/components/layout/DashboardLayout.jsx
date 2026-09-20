"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function DashboardLayout({ children }) {
  const { user, business, loading } = useAuth();
  const router = useRouter();
  const [isMobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar isMobile={false} />

      {isMobileOpen && (
        <Sidebar isMobile onClose={() => setMobileOpen(false)} />
      )}

      <div className="lg:pl-64">
        <Navbar onMenuClick={() => setMobileOpen(true)} />

        <main className="pt-16">
          {business && !business.isOnboarded && (
            <div className="bg-primary-600 text-white px-4 py-2 flex items-center justify-center gap-2">
              <span className="text-sm font-medium">
                Complete your business setup to get the most out of BusinessHub
              </span>
              <Link
                href="/onboarding"
                className="inline-flex items-center gap-1 text-sm font-semibold underline underline-offset-2 hover:text-white/80 transition"
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          <div className="px-4 sm:px-5 md:px-6 py-3 sm:py-4 lg:py-5">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
