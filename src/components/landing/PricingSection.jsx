import { Check } from "lucide-react";
import Link from "next/link";

const freeFeatures = [
  "25 Products",
  "100 Transactions/month",
  "15 Customers",
  "Basic Dashboard",
  "Basic Reports",
  "Community Support",
];

const proFeatures = [
  "Unlimited Products",
  "Unlimited Transactions",
  "Unlimited Customers",
  "Advanced Reports & PDF Export",
  "Advanced Analytics",
  "Priority Support",
  "Data Export",
];

export default function PricingSection() {
  return (
    <section id="pricing" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center mb-14">
        <h2 className="text-3xl sm:text-4xl font-bold text-ink">
          Simple, transparent pricing
        </h2>
        <p className="mt-4 text-lg text-ink-muted">
          Start free, upgrade when you need more.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Free */}
        <div className="bg-surface-soft border border-ink/5 rounded-2xl p-8">
          <h3 className="text-lg font-semibold text-ink">Free</h3>
          <div className="mt-4 mb-6">
            <span className="text-4xl font-bold text-ink">৳0</span>
            <span className="text-ink-muted">/month</span>
          </div>
          <Link
            href="/auth/register"
            className="block w-full py-3 text-center font-medium text-ink bg-ink/5 hover:bg-ink/10 rounded-xl transition-colors"
          >
            Get Started
          </Link>
          <ul className="mt-8 space-y-3">
            {freeFeatures.map((feat) => (
              <li key={feat} className="flex items-center gap-3 text-sm text-ink-muted">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                {feat}
              </li>
            ))}
          </ul>
        </div>

        {/* Pro */}
        <div className="relative bg-surface-soft border-2 border-primary-600 rounded-2xl p-8 shadow-lg shadow-primary-600/10">
          <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-semibold text-white bg-primary-600 rounded-full">
            Popular
          </span>
          <h3 className="text-lg font-semibold text-ink">Pro</h3>
          <div className="mt-4 mb-6">
            <span className="text-4xl font-bold text-ink">৳499</span>
            <span className="text-ink-muted">/month</span>
          </div>
          <Link
            href="/auth/register"
            className="block w-full py-3 text-center font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors"
          >
            Upgrade Now
          </Link>
          <ul className="mt-8 space-y-3">
            {proFeatures.map((feat) => (
              <li key={feat} className="flex items-center gap-3 text-sm text-ink-muted">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                {feat}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="text-center text-sm text-ink-muted mt-8">
        All plans include strict data isolation and full security.
      </p>
    </section>
  );
}
