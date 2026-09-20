"use client";

import Link from "next/link";

const stats = [
  { label: "Revenue Tracked", value: "৳50M+" },
  { label: "Active Businesses", value: "500+" },
  { label: "Uptime", value: "99.9%" },
];

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 pt-24 pb-16 sm:pt-32 sm:pb-24">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 25px 25px, white 2%, transparent 0%), radial-gradient(circle at 75px 75px, white 2%, transparent 0%)",
            backgroundSize: "100px 100px",
          }}
        />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
          Manage your entire business
          <br />
          from one dashboard
        </h1>
        <p className="mt-6 text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
          Track sales, expenses, investments, profit &amp; loss, inventory, and
          more — all with strict data isolation and enterprise-grade security.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/auth/register"
            className="px-8 py-3.5 text-base font-semibold text-indigo-700 bg-white hover:bg-slate-50 rounded-xl transition-colors shadow-lg"
          >
            Start Free →
          </Link>
          <Link
            href="#features"
            className="px-8 py-3.5 text-base font-semibold text-white border-2 border-white/40 hover:border-white/70 rounded-xl transition-colors"
          >
            View Features
          </Link>
        </div>

        {/* Social proof */}
        <p className="mt-10 text-sm text-white/60">
          Join 500+ businesses managing their finances with BusinessHub
        </p>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="px-5 py-3 rounded-xl bg-white/10 backdrop-blur-sm"
            >
              <p className="text-lg font-bold text-white">{stat.value}</p>
              <p className="text-xs text-white/60">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
