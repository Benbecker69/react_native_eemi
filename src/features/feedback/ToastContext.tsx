import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

export type ToastTone = "success" | "error";
export type Toast = { id: number; tone: ToastTone; message: string };

type ToastContextValue = {
  toast: Toast | null;
  /** Shows a toast (replaces one already showing); auto-dismisses after a few seconds. */
  show: (message: string, tone?: ToastTone) => void;
  dismiss: () => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);
const AUTO_DISMISS_MS = 3000;

// One toast at a time, app-wide — see `ToastHost` (mounted once in the root
// layout, so it survives the `router.replace()` most success toasts here are
// followed by) and the `useToast()` hook every mutation calls into.
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const idRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast(null);
  }, []);

  const show = useCallback((message: string, tone: ToastTone = "success") => {
    if (timerRef.current) clearTimeout(timerRef.current);
    idRef.current += 1;
    setToast({ id: idRef.current, tone, message });
    timerRef.current = setTimeout(() => setToast(null), AUTO_DISMISS_MS);
  }, []);

  const value = useMemo(() => ({ toast, show, dismiss }), [toast, show, dismiss]);

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider.");
  return context;
}
