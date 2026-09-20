"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Layers,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/common/LoadingSpinner";

const ADMIN_NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: Layers },
];

function AdminSidebar({ isMobile, onClose }) {
  const pathname = usePathname();

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
          <span className="text-white text-xs font-bold">A</span>
        </div>
        <span className="text-lg font-bold text-ink">Admin Panel</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {ADMIN_NAV.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={isMobile ? onClose : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                isActive
                  ? "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300"
                  : "text-ink-muted hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-ink"
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-ink-muted hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-ink transition"
        >
          <span>← Back to Dashboard</span>
        </Link>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <div
          className="fixed inset-0 bg-black/50 z-50 transition-opacity"
          onClick={onClose}
        />
        <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-surface-soft border-r border-border transform transition-transform duration-200 ease-in-out">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-ink-muted"
          >
            <X className="w-5 h-5" />
          </button>
          {sidebarContent}
        </aside>
      </>
    );
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 fixed inset-y-0 left-0 bg-surface-soft border-r border-border z-40">
      {sidebarContent}
    </aside>
  );
}

export default function AdminLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isMobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && user && user.role !== "admin") {
      console.warn("Access denied: admin role required");
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    router.push("/auth/login");
    return null;
  }

  if (user.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-surface">
      <AdminSidebar isMobile={false} />

      {isMobileOpen && (
        <AdminSidebar
          isMobile
          onClose={() => setMobileOpen(false)}
        />
      )}

      <div className="lg:pl-64">
        <header className="fixed top-0 left-0 right-0 lg:left-64 h-16 bg-surface-soft/80 backdrop-blur-md border-b border-border z-30">
          <div className="flex items-center h-full px-4 sm:px-6">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-ink-muted transition"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </header>

        <main className="pt-16">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
