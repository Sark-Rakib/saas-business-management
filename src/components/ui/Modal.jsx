"use client";

import { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

const sizeMap = {
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
};

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "md",
  maxWidth,
}) {
  const handleEscape = useCallback(
    (e) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  return createPortal(
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4`}
        role="dialog"
      >
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div
          className={`relative bg-surface-soft rounded-2xl border border-border shadow-xl w-full flex flex-col max-h-[90vh] ${maxWidth || sizeMap[size]}`}
        >
          {title && (
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border flex-shrink-0">
              <h2 className="text-lg font-semibold text-ink">{title}</h2>
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-ink-muted transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
          <div className="px-4 sm:px-6 py-5 overflow-y-auto flex-1">{children}</div>
          {footer && (
            <div className="px-4 sm:px-6 py-4 border-t border-border flex items-center justify-end gap-3 flex-shrink-0">
              {footer}
            </div>
          )}
        </div>
      </div>,
    document.body
  );
}
