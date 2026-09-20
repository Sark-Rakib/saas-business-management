import { UserPlus, Building2, Rocket } from "lucide-react";

const steps = [
  {
    number: "1",
    icon: UserPlus,
    title: "Sign up",
    description:
      "Create your free account in under a minute. No credit card required.",
  },
  {
    number: "2",
    icon: Building2,
    title: "Set up your business",
    description:
      "Add your business details, products, customers, and payment methods.",
  },
  {
    number: "3",
    icon: Rocket,
    title: "Start managing",
    description:
      "Log sales, track expenses, and watch your business grow in real time.",
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center mb-14">
        <h2 className="text-3xl sm:text-4xl font-bold text-ink">
          Get started in three simple steps
        </h2>
      </div>

      <div className="relative">
        {/* Connector line (desktop) */}
        <div className="hidden sm:block absolute top-10 left-[calc(16.67%+20px)] right-[calc(16.67%+20px)] h-px bg-ink/10" />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
          {steps.map((step) => (
            <div key={step.number} className="flex flex-col items-center text-center">
              <div className="relative mb-5">
                <div className="w-14 h-14 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary-600/25">
                  {step.number}
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-lg bg-surface-soft border border-ink/10 flex items-center justify-center">
                  <step.icon className="w-4 h-4 text-primary-600" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-ink mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-ink-muted leading-relaxed max-w-[220px]">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
