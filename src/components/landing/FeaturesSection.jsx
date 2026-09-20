"use client";

import {
  BarChart3,
  ShoppingCart,
  Receipt,
  TrendingUp,
  Package,
  Users,
  Shield,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: BarChart3,
    title: "Financial Dashboard",
    description:
      "Real-time overview of revenue, expenses, profit & loss with interactive charts.",
  },
  {
    icon: ShoppingCart,
    title: "Sales Management",
    description:
      "Track every sale with detailed records, customer links, and payment status.",
  },
  {
    icon: Receipt,
    title: "Expense Tracking",
    description:
      "Log and categorize expenses to maintain clear visibility over your spending.",
  },
  {
    icon: TrendingUp,
    title: "Profit & Loss Reports",
    description:
      "Generate detailed P&L statements to understand your business health.",
  },
  {
    icon: Package,
    title: "Inventory Control",
    description:
      "Manage stock levels, track items, and get alerts before you run out.",
  },
  {
    icon: Users,
    title: "Customer Management",
    description:
      "Maintain a complete customer database with purchase history and contacts.",
  },
  {
    icon: Shield,
    title: "Data Isolation",
    description:
      "Every business account is completely isolated — your data is yours alone.",
  },
  {
    icon: Zap,
    title: "Fast & Modern",
    description:
      "Built with cutting-edge technology for instant page loads and smooth UX.",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center mb-14">
        <h2 className="text-3xl sm:text-4xl font-bold text-ink">
          Everything you need to manage your business
        </h2>
        <p className="mt-4 text-lg text-ink-muted max-w-2xl mx-auto">
          A complete financial management toolkit built for modern businesses.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="bg-surface-soft border border-ink/5 rounded-2xl p-6 hover:shadow-lg transition-shadow"
          >
            <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center mb-4">
              <feature.icon className="w-5 h-5 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold text-ink mb-2">
              {feature.title}
            </h3>
            <p className="text-sm text-ink-muted leading-relaxed">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
