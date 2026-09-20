export default function DashboardPreview() {
  return (
    <section className="relative -mt-16 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-surface-soft rounded-2xl shadow-2xl border border-ink/5 overflow-hidden p-6">
          {/* Fake top bar */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 h-6 bg-ink/5 rounded-lg ml-4" />
          </div>

          {/* Fake stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {[
              { label: "Total Revenue", value: "৳1,24,500", color: "from-indigo-500 to-indigo-600" },
              { label: "Expenses", value: "৳87,300", color: "from-rose-500 to-rose-600" },
              { label: "Net Profit", value: "৳37,200", color: "from-emerald-500 to-emerald-600" },
            ].map((card) => (
              <div
                key={card.label}
                className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-ink/5"
              >
                <div className={`h-1 w-16 rounded-full bg-gradient-to-r ${card.color} mb-3`} />
                <p className="text-xs text-ink-muted">{card.label}</p>
                <p className="text-xl font-bold text-ink mt-1">{card.value}</p>
              </div>
            ))}
          </div>

          {/* Fake chart area */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-ink/5 p-4">
            <div className="h-48 relative overflow-hidden rounded-lg">
              {/* Gradient chart visualization */}
              <div className="absolute inset-0 flex items-end gap-1 px-2 pb-2">
                {[40, 55, 35, 70, 60, 80, 45, 75, 90, 65, 85, 50].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-sm bg-gradient-to-t from-indigo-500/80 to-indigo-400/40 transition-all"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
              {/* Trend line overlay */}
              <div className="absolute inset-0">
                <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="rgb(99,102,241)" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="rgb(99,102,241)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0,140 Q30,120 60,100 T120,80 T180,60 T240,90 T300,40 T360,70 T400,50 V200 H0 Z"
                    fill="url(#chartGradient)"
                  />
                  <path
                    d="M0,140 Q30,120 60,100 T120,80 T180,60 T240,90 T300,40 T360,70 T400,50"
                    fill="none"
                    stroke="rgb(99,102,241)"
                    strokeWidth="2.5"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-ink-muted mt-6 text-sm">
          Your complete business intelligence — at a glance
        </p>
      </div>
    </section>
  );
}
