const colorMap = {
  primary: "bg-primary-100 text-primary-600 dark:bg-primary-500/15 dark:text-primary-400",
  green: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
  red: "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400",
  amber: "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
  blue: "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
  purple: "bg-purple-100 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400",
};

export default function StatCard({ title, value, icon, color = "primary", trend, hint }) {
  const isPositive = trend && trend.startsWith("+");
  const isNegative = trend && trend.startsWith("-");

  return (
    <div className="bg-surface-soft border border-border rounded-2xl shadow-sm p-5 flex items-start gap-4">
      {icon && (
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorMap[color] || colorMap.primary}`}>
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm text-ink-muted truncate">{title}</p>
        <div className="flex items-baseline gap-2 mt-0.5">
          <p className="text-sm sm:text-base font-semibold text-ink break-words">{value}</p>
          {trend && (
            <span
              className={`text-xs font-medium ${
                isPositive ? "text-emerald-600 dark:text-emerald-400" : isNegative ? "text-red-600 dark:text-red-400" : "text-ink-muted"
              }`}
            >
              {trend}
            </span>
          )}
        </div>
        {hint && <p className="text-xs text-ink-muted mt-1">{hint}</p>}
      </div>
    </div>
  );
}
