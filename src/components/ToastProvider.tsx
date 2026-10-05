// src/components/ToastProvider.tsx
import { createContext, useCallback, useContext, useState, ReactNode } from "react";
import { Toast } from "./Toast";

type ToastType = "success" | "error" | "info";
type ToastItem = { id: string; message: string; type: ToastType; duration?: number };

type ToastContextValue = {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

let idCounter = 0;
const nextId = () => `toast-${Date.now()}-${++idCounter}`;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback(
    (message: string, type: ToastType = "info", duration?: number) => {
      const id = nextId();
      setToasts((prev) => [...prev, { id, message, type, duration }]);
    },
    []
  );

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.length > 0 && (
        <div className="toast-container" aria-live="polite">
          {toasts.map((t) => (
            <Toast
              key={t.id}
              message={t.message}
              type={t.type}
              duration={t.duration}
              onClose={() => hideToast(t.id)}
            />
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fallback silencioso: si no hay Provider, solo logueamos en dev
    return {
      showToast: (msg: string) => {
        if (import.meta.env.DEV) console.warn("[toast sin provider]", msg);
      },
    };
  }
  return ctx;
}