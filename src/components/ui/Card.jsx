export default function Card({ children, className = "", title, subtitle, action }) {
  return (
    <div className={`bg-surface-soft border border-border rounded-2xl shadow-sm ${className}`}>
      {(title || action) && (
        <div className="px-6 pt-5 pb-0 flex items-start justify-between">
          <div>
            {title && <h3 className="text-base font-semibold text-ink">{title}</h3>}
            {subtitle && <p className="text-sm text-ink-muted mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}
