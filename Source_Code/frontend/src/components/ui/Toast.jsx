import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  XCircle,
} from "lucide-react";
import "./Toast.css";

const ToastContext = createContext(null);

const TOAST_META = {
  success: {
    icon: CheckCircle2,
    title: "Berhasil",
  },
  error: {
    icon: XCircle,
    title: "Gagal",
  },
  warning: {
    icon: AlertTriangle,
    title: "Perhatian",
  },
  info: {
    icon: Info,
    title: "Info",
  },
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type = "info", title, message, duration = 4200 }) => {
      const id = crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
      const toast = {
        id,
        type,
        title: title || TOAST_META[type]?.title || "Info",
        message,
      };

      setToasts((current) => [toast, ...current].slice(0, 4));

      if (duration > 0) {
        window.setTimeout(() => dismiss(id), duration);
      }

      return id;
    },
    [dismiss],
  );

  const value = useMemo(
    () => ({
      showToast,
      success: (message, options = {}) =>
        showToast({ type: "success", message, ...options }),
      error: (message, options = {}) =>
        showToast({ type: "error", message, ...options }),
      warning: (message, options = {}) =>
        showToast({ type: "warning", message, ...options }),
      info: (message, options = {}) =>
        showToast({ type: "info", message, ...options }),
      dismiss,
    }),
    [dismiss, showToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-viewport" aria-live="polite" aria-relevant="additions">
        {toasts.map((toast) => {
          const meta = TOAST_META[toast.type] || TOAST_META.info;
          const Icon = meta.icon;

          return (
            <div key={toast.id} className={`toast-card ${toast.type}`}>
              <div className="toast-icon" aria-hidden="true">
                <Icon size={18} strokeWidth={2.4} />
              </div>
              <div className="toast-copy">
                <strong>{toast.title}</strong>
                {toast.message && <span>{toast.message}</span>}
              </div>
              <button
                type="button"
                className="toast-close"
                aria-label="Tutup notifikasi"
                onClick={() => dismiss(toast.id)}
              >
                <X size={16} strokeWidth={2.4} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider.");
  }

  return context;
};
