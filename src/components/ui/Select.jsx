"use client";

export default function Select({
  label,
  options = [],
  error,
  className = "",
  ...props
}) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-ink mb-1.5">{label}</label>
      )}
      <select
        className={`w-full rounded-xl border bg-surface-soft px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition ${
          error ? "border-red-500" : "border-border"
        }`}
        {...props}
      >
        {options.length === 0 && <option value="">No options available</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
