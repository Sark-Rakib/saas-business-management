import Link from "next/link";

export default function CTASection() {
  return (
    <section id="about" className="bg-gradient-to-br from-primary-600 to-purple-600 py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
          Ready to take control of your business finances?
        </h2>
        <p className="mt-4 text-lg text-white/80">
          Start free today. No credit card required.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/auth/register"
            className="px-8 py-3.5 text-base font-semibold text-primary-700 bg-white hover:bg-slate-50 rounded-xl transition-colors shadow-lg"
          >
            Get Started Free
          </Link>
          <Link
            href="/auth/login"
            className="px-8 py-3.5 text-base font-semibold text-white border-2 border-white/40 hover:border-white/70 rounded-xl transition-colors"
          >
            or Login
          </Link>
        </div>
      </div>
    </section>
  );
}
