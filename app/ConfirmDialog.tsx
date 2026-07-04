"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type ConfirmVariant = "danger" | "warning" | "info";

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

interface PendingConfirm {
  options: ConfirmOptions;
  resolve: (value: boolean) => void;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const confirm = (options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setPending({ options, resolve });
    });
  };

  const handleConfirm = () => {
    if (pending) {
      pending.resolve(true);
      setPending(null);
    }
  };

  const handleCancel = () => {
    if (pending) {
      pending.resolve(false);
      setPending(null);
    }
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {pending && (
        <ConfirmModal
          options={pending.options}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context.confirm;
}

function ConfirmModal({
  options,
  onConfirm,
  onCancel,
}: {
  options: ConfirmOptions;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const variant = options.variant || "danger";

  const variantStyles: Record<ConfirmVariant, { bg: string; text: string; btn: string }> = {
    danger: {
      bg: "bg-red-100 text-red-600",
      btn: "bg-red-500 hover:bg-red-600 text-white",
    },
    warning: {
      bg: "bg-amber-100 text-amber-600",
      btn: "bg-amber-500 hover:bg-amber-600 text-white",
    },
    info: {
      bg: "bg-blue-100 text-blue-600",
      btn: "bg-blue-500 hover:bg-blue-600 text-white",
    },
  };

  const styles = variantStyles[variant];

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4 animate-fade-in"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div
        className="card w-full max-w-md animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className={`mb-4 grid h-12 w-12 place-items-center rounded-xl ${styles.bg}`}>
            {variant === "danger" && (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-2 14a2 2 0 01-2 2H9a2 2 0 01-2-2L5 6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            )}
            {variant === "warning" && (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            )}
            {variant === "info" && (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            )}
          </div>

          <h2 id="confirm-title" className="text-lg font-bold text-[var(--brand-text)]">
            {options.title}
          </h2>
          {options.description && (
            <p className="mt-2 text-sm text-[var(--brand-muted)]">
              {options.description}
            </p>
          )}

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-[var(--brand-border)] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--brand-text)] transition hover:bg-stone-50"
            >
              {options.cancelText || "Cancel"}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition active:scale-[0.98] ${styles.btn}`}
            >
              {options.confirmText || "Confirm"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}