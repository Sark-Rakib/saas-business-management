"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const faqs = [
  {
    question: "Is my business data private and isolated from other users?",
    answer:
      "Yes. Every business account is completely isolated at the database level. Your data is never mixed with, visible to, or accessible by any other user. This is enforced through tenant-level security on every database query.",
  },
  {
    question: "How does the bKash/Nagad payment system work?",
    answer:
      "BusinessHub supports recording payments received via bKash, Nagad, bank transfer, and cash. You can log the payment method and reference number for each transaction. Full payment gateway integration is on our roadmap.",
  },
  {
    question: "Can I export my data?",
    answer:
      "Pro plan users can export their data in CSV format at any time. This includes transactions, customer lists, product catalogs, and financial reports. You own your data and can leave whenever you want.",
  },
  {
    question: "What happens when my subscription expires?",
    answer:
      "Your data is safely retained for 30 days after expiration. You can still access a read-only view. To regain full access, simply renew your subscription — all your data will be exactly as you left it.",
  },
  {
    question: "Is there a mobile app?",
    answer:
      "BusinessHub is fully responsive and works beautifully on mobile browsers. A dedicated mobile app is on our product roadmap and will be available soon.",
  },
  {
    question: "How do I invite team members?",
    answer:
      "Team member support is a planned feature. Currently, each business account is managed by a single user. We're working on role-based access control that will allow you to invite team members with different permission levels.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section id="faq" className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center mb-14">
        <h2 className="text-3xl sm:text-4xl font-bold text-ink">
          Frequently Asked Questions
        </h2>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, i) => (
          <div
            key={i}
            className="bg-surface-soft border border-ink/5 rounded-2xl overflow-hidden"
          >
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full flex items-center justify-between p-5 text-left"
            >
              <span className="text-sm font-medium text-ink pr-4">
                {faq.question}
              </span>
              {openIndex === i ? (
                <ChevronUp className="w-5 h-5 text-ink-muted shrink-0" />
              ) : (
                <ChevronDown className="w-5 h-5 text-ink-muted shrink-0" />
              )}
            </button>
            {openIndex === i && (
              <div className="px-5 pb-5">
                <p className="text-sm text-ink-muted leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
