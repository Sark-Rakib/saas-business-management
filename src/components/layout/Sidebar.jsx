"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  TrendingUp,
  Package,
  ArrowLeftRight,
  Users,
  FileText,
  BarChart3,
  Settings,
  CreditCard,
  UserCircle,
  Home,
  LogOut,
  Sun,
  Moon,
  X,
  Truck,
  PackagePlus,
  ShieldCheck,
  Layers,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { NAVIGATION, getInitials } from "@/constants";

const ICON_MAP = {
  dashboard: LayoutDashboard,
  sales: ShoppingCart,
  purchases: PackagePlus,
  expenses: Receipt,
  investments: TrendingUp,
  products: Package,
  suppliers: Truck,
  transactions: ArrowLeftRight,
  customers: Users,
  reports: FileText,
  analytics: BarChart3,
  settings: Settings,
  subscription: CreditCard,
  profile: UserCircle,
};

const ADMIN_NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: Layers },
];

export default function Sidebar({ isMobile, onClose }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, business, logout } = useAuth();
  const { resolvedTheme, setThemeMode } = useTheme();

  const initials = getInitials(user?.name || user?.email || "?");

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center h-16 px-5 border-b border-border shrink-0">
        <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center ring-2 ring-primary-500/20 mr-3">
          <span>
            <img src="/business.png" alt="" />
          </span>
        </div>
        <div>
          <span className="text-lg font-bold text-ink">BusinessHub</span>
          <p className="text-xs uppercase text-gray-400">next level</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAVIGATION.map((item) => {
          const Icon = ICON_MAP[item.icon];
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={isMobile ? onClose : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                isActive
                  ? "bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-300"
                  : "text-ink-muted hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-ink"
              }`}
            >
              {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
              <span>{item.label}</span>
            </Link>
          );
        })}

        {user?.role === "admin" && (
          <>
            <div className="pt-4 pb-1 px-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary-500" />
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Admin
              </span>
            </div>
            {ADMIN_NAV.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : (pathname || "").startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={isMobile ? onClose : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                    isActive
                      ? "bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-300"
                      : "text-ink-muted hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-ink"
                  }`}
                >
                  {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Back to site */}
      {/* <div className="px-3 pb-2">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-ink-muted hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-ink transition"
        >
          <Home className="w-5 h-5" />
          <span>Back to site</span>
        </Link>
      </div> */}

      {/* User card */}
      <div className="border-t border-border px-4 py-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center text-sm font-semibold text-primary-700 dark:text-primary-300">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink truncate">
              {user?.name || "User"}
            </p>
            <p className="text-xs text-ink-muted truncate">
              {business?.name || "No business"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              setThemeMode(resolvedTheme === "dark" ? "light" : "dark")
            }
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-ink-muted transition"
            title="Toggle theme"
          >
            {resolvedTheme === "dark" ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={logout}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Log out</span>
          </button>
        </div>
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
