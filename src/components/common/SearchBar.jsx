"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";

export default function SearchBar({
  value: externalValue,
  onChange,
  placeholder = "Search...",
  className = "",
  debounceMs = 300,
}) {
  const [local, setLocal] = useState(externalValue || "");
  const timer = useRef(null);
  const prevExternal = useRef(externalValue);

  useEffect(() => {
    if (prevExternal.current !== externalValue) {
      prevExternal.current = externalValue;
      const id = setTimeout(() => setLocal(externalValue || ""), 0);
      return () => clearTimeout(id);
    }
  }, [externalValue]);

  const handleChange = (e) => {
    const val = e.target.value;
    setLocal(val);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => onChange(val), debounceMs);
  };

  const handleClear = () => {
    setLocal("");
    onChange("");
  };

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted pointer-events-none" />
      <input
        type="text"
        value={local}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-surface-soft pl-9 pr-8 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition"
      />
      {local && (
        <button
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600 text-ink-muted transition"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
