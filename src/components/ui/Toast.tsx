'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface ToastItem {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastItem['type']) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  let nextId = 0;

  const showToast = useCallback((message: string, type: ToastItem['type'] = 'success') => {
    const id = ++nextId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const typeStyles = {
    success: 'bg-zinc-800 border border-emerald-500/30 text-emerald-400',
    error:   'bg-zinc-800 border border-red-500/30 text-red-400',
    info:    'bg-zinc-800 border border-indigo-500/30 text-indigo-400',
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 inset-x-4 flex flex-col gap-2 items-center z-50 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`${typeStyles[t.type]} text-sm font-medium px-5 py-3 rounded-xl shadow-2xl shadow-black/40 max-w-sm w-full text-center animate-fade-in backdrop-blur-sm`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
