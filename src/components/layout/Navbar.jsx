"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Menu, Bell, Sun, Moon, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { getInitials } from "@/constants";
import api from "@/lib/api";

export default function Navbar({ onMenuClick, title }) {
  const { user } = useAuth();
  const { resolvedTheme, setThemeMode } = useTheme();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const dropdownRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.isRead && !n.read).length;
  const initials = getInitials(user?.name || user?.email || "?");

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    }
    if (notificationsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [notificationsOpen]);

  const fetchNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const { data } = await api.get("/notifications");
      setNotifications(data.data?.notifications || data.data || []);
    } catch {
      // silent
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleBellClick = () => {
    const next = !notificationsOpen;
    setNotificationsOpen(next);
    if (next) fetchNotifications();
  };

  return (
    <header className="fixed top-0 left-0 right-0 lg:left-64 h-16 bg-surface-soft/80 backdrop-blur-md border-b border-border z-30">
      <div className="flex items-center justify-between h-full px-4 sm:px-6">
        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-ink-muted transition"
          >
            <Menu className="w-5 h-5" />
          </button>
          {title && (
            <h1 className="text-lg font-semibold text-ink">{title}</h1>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={() =>
              setThemeMode(resolvedTheme === "dark" ? "light" : "dark")
            }
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-ink-muted transition"
            title="Toggle theme"
          >
            {resolvedTheme === "dark" ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          {/* Notifications */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={handleBellClick}
              className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-ink-muted transition"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none min-w-[18px]">
                  {unreadCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-surface-soft border border-border rounded-xl shadow-lg z-50">
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-ink">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={async () => {
                        try {
                          await api.patch("/notifications/read-all");
                          setNotifications((prev) =>
                            prev.map((n) => ({ ...n, isRead: true, read: true }))
                          );
                        } catch {
                          // silent
                        }
                      }}
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {loadingNotifications ? (
                    <div className="px-4 py-8 text-center text-sm text-ink-muted">
                      Loading...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-ink-muted">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((n, i) => (
                      <div
                        key={n._id || i}
                        className={`px-4 py-3 border-b border-border last:border-b-0 ${
                          !n.isRead && !n.read ? "bg-primary-50/50 dark:bg-primary-500/5" : ""
                        }`}
                      >
                        <p className="text-sm text-ink">{n.message || n.title}</p>
                        {n.createdAt && (
                          <p className="text-xs text-ink-muted mt-1">
                            {new Date(n.createdAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User avatar */}
          <Link
            href="/dashboard/profile"
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center text-xs font-semibold text-primary-700 dark:text-primary-300">
              {initials}
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}
