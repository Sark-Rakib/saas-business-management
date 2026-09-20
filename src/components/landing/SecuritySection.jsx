import { Shield, Lock, Key, Cookie, Clock, CheckCircle } from "lucide-react";

const points = [
  {
    icon: Shield,
    title: "Complete Data Isolation",
    description:
      "Every tenant's data is fully separated at the database level. No business can ever access another's information.",
  },
  {
    icon: Lock,
    title: "Encrypted at Rest & in Transit",
    description:
      "All sensitive data is encrypted using industry-standard AES-256 at rest and TLS 1.3 in transit.",
  },
  {
    icon: Key,
    title: "JWT Authentication",
    description:
      "Secure JSON Web Tokens ensure only authenticated users can access your business data.",
  },
  {
    icon: Cookie,
    title: "HTTP-only Cookies",
    description:
      "Session tokens are stored in HTTP-only cookies, inaccessible to JavaScript and protected from XSS attacks.",
  },
  {
    icon: Clock,
    title: "Rate Limiting",
    description:
      "API endpoints are protected against abuse and brute-force attacks with intelligent rate limiting.",
  },
  {
    icon: CheckCircle,
    title: "Input Validation",
    description:
      "Every input is rigorously validated and sanitized to prevent injection attacks and data corruption.",
  },
];

export default function SecuritySection() {
  return (
    <section
      id="security"
      className="bg-slate-900 dark:bg-slate-950 py-20"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Bank-grade data isolation and security
          </h2>
          <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
            Your business data is protected by multiple layers of enterprise security.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {points.map((point) => (
            <div
              key={point.title}
              className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
                <point.icon className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {point.title}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {point.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
