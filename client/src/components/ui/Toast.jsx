import { createContext, useContext, useState } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const showToast = (message, type = "info") => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3200);
  };
  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 rounded-lg px-4 py-3 text-sm font-semibold shadow-soft ${toast.type === "error" ? "bg-red-600 text-white" : "bg-slate-900 text-white"}`}>
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
