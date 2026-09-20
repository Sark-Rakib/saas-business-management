"use client";

export default function Input({
  label,
  error,
  icon,
  rightElement,
  className = "",
  ...props
}) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-ink mb-1.5">{label}</label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none">
            {icon}
          </span>
        )}
        <input
          className={`w-full rounded-xl border bg-surface-soft px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition ${
            error ? "border-red-500" : "border-border"
          } ${icon ? "pl-10" : ""} ${rightElement ? "pr-10" : ""}`}
          {...props}
        />
        {rightElement && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2">{rightElement}</span>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
