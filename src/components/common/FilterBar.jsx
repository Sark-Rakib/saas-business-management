export default function FilterBar({ children }) {
  return (
    <div className="bg-surface-soft border border-border rounded-xl p-3 flex flex-wrap gap-3 items-center">
      {children}
    </div>
  );
}
