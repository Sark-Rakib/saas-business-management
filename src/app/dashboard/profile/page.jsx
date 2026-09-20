"use client";

import { useState } from "react";
import { Mail, Phone, KeyRound, BadgeCheck, ShieldCheck, Building2, Calendar, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import api, { getErrorMessage } from "@/lib/api";
import { getInitials, formatDate, capitalize } from "@/constants";
import PageHeader from "@/components/common/PageHeader";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

function InfoForm({ user, updateUser }) {
  const { showToast } = useToast();
  const [form, setForm] = useState(() => ({
    name: user.name || "",
    phone: user.phone || "",
    avatar: user.avatar || "",
  }));
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.patch("/profile", {
        name: form.name,
        phone: form.phone,
        avatar: form.avatar,
      });
      updateUser(data.data);
      showToast("Profile updated", "success");
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title="Personal Information" subtitle="Update your name, phone and avatar" className="lg:col-span-2">
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            icon={<ShieldCheck className="w-4 h-4" />}
          />
          <Input
            label="Phone"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            icon={<Phone className="w-4 h-4" />}
          />
          <Input
            label="Email"
            value={user.email}
            readOnly
            disabled
            icon={<Mail className="w-4 h-4" />}
          />
          <Input
            label="Avatar URL"
            type="url"
            value={form.avatar}
            onChange={(e) => setForm((p) => ({ ...p, avatar: e.target.value }))}
            placeholder="https://example.com/avatar.png"
          />
        </div>
        <div className="flex justify-end">
          <Button size="sm" type="submit" loading={saving} disabled={saving}>
            Save Changes
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default function ProfilePage() {
  const { user, business, updateUser, logout, loading } = useAuth();
  const { showToast } = useToast();

  const [pw, setPw] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState(null);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwError(null);
    if (pw.currentPassword && pw.newPassword.length < 6) {
      setPwError("New password must be at least 6 characters.");
      return;
    }
    if (pw.newPassword !== pw.confirmPassword) {
      setPwError("Passwords do not match.");
      return;
    }
    setPwSaving(true);
    try {
      await api.post("/profile/change-password", {
        currentPassword: pw.currentPassword,
        newPassword: pw.newPassword,
      });
      showToast("Password changed. Please login again.", "success");
      await logout();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setPwSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="">
        <PageHeader title="Profile" description="Manage your personal information" />
        <LoadingSpinner label="Loading profile..." />
      </div>
    );
  }

  if (!user) return null;

  const isAdmin = user.role === "admin";

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" description="Manage your personal information and account security" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Identity card */}
        <Card className="lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-2 border-border"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary-600 text-white flex items-center justify-center text-3xl font-semibold">
                {getInitials(user.name)}
              </div>
            )}
            <h3 className="mt-4 text-lg font-bold text-ink">{user.name}</h3>
            <p className="text-sm text-ink-muted">{user.email}</p>
            <div className="mt-3">
              <Badge color={isAdmin ? "purple" : "blue"}>{isAdmin ? "Admin" : "User"}</Badge>
            </div>
            <div className="mt-4 w-full space-y-2 text-sm text-ink-soft">
              <div className="flex items-center justify-center gap-2">
                <Calendar className="w-4 h-4 text-ink-muted" />
                Member since {formatDate(user.createdAt)}
              </div>
              {user.phone && (
                <div className="flex items-center justify-center gap-2">
                  <Phone className="w-4 h-4 text-ink-muted" />
                  {user.phone}
                </div>
              )}
            </div>
          </div>
        </Card>

        <InfoForm user={user} updateUser={updateUser} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Change password */}
        <Card title="Change Password" subtitle="Use at least 6 characters for your new password">
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {pwError && (
              <div className="text-sm text-red-600 bg-red-100 dark:bg-red-500/15 rounded-xl px-4 py-3">
                {pwError}
              </div>
            )}
            <Input
              label="Current Password"
              type="password"
              value={pw.currentPassword}
              onChange={(e) => setPw((p) => ({ ...p, currentPassword: e.target.value }))}
              icon={<KeyRound className="w-4 h-4" />}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="New Password"
                type="password"
                value={pw.newPassword}
                onChange={(e) => setPw((p) => ({ ...p, newPassword: e.target.value }))}
                icon={<Lock className="w-4 h-4" />}
              />
              <Input
                label="Confirm Password"
                type="password"
                value={pw.confirmPassword}
                onChange={(e) => setPw((p) => ({ ...p, confirmPassword: e.target.value }))}
                icon={<Lock className="w-4 h-4" />}
              />
            </div>
            <div className="flex justify-end">
              <Button size="sm" type="submit" loading={pwSaving} disabled={pwSaving}>
                Update Password
              </Button>
            </div>
          </form>
        </Card>

        {/* Account information */}
        <Card title="Account Information" subtitle="Details about your account">
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-ink-muted">Email status</span>
              <span>
                {user.isVerified ? (
                  <Badge color="green">
                    <span className="inline-flex items-center gap-1">
                      <BadgeCheck className="w-3.5 h-3.5" /> Verified
                    </span>
                  </Badge>
                ) : (
                  <Badge color="amber">Not verified</Badge>
                )}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-muted">Role</span>
              <Badge color={isAdmin ? "purple" : "blue"}>{capitalize(user.role)}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-muted">Business</span>
              <span className="inline-flex items-center gap-1.5 text-ink font-medium">
                <Building2 className="w-4 h-4 text-ink-muted" />
                {business?.name || "—"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-muted">Account created</span>
              <span className="text-ink font-medium">{formatDate(user.createdAt)}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}