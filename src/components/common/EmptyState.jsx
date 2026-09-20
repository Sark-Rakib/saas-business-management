import { Inbox } from "lucide-react";

export default function EmptyState({
  icon,
  title = "No data found",
  description,
  action,
}) {
  return (
    <div className="py-16 flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
        {icon || <Inbox className="w-7 h-7 text-ink-muted" />}
      </div>
      <h3 className="text-sm font-medium text-ink">{title}</h3>
      {description && <p className="mt-1 text-sm text-ink-muted max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
