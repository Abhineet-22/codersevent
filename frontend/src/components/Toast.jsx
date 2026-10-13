import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error', 6000),
    warning: (msg) => addToast(msg, 'warning', 5000),
    info: (msg) => addToast(msg, 'info'),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          maxWidth: '420px',
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.875rem 1.125rem',
              background: 'var(--bg-secondary)',
              border: `1px solid ${
                t.type === 'success'
                  ? 'var(--emerald-border)'
                  : t.type === 'error'
                  ? 'var(--rose-border)'
                  : t.type === 'warning'
                  ? 'var(--amber-border)'
                  : 'var(--border-subtle)'
              }`,
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              animation: 'scaleIn 0.18s ease-out',
            }}
          >
            {t.type === 'success' && <CheckCircle2 size={18} color="var(--emerald)" />}
            {t.type === 'error' && <AlertCircle size={18} color="var(--rose)" />}
            {t.type === 'warning' && <AlertTriangle size={18} color="var(--amber)" />}
            {t.type === 'info' && <Info size={18} color="var(--primary)" />}
            <span style={{ flex: 1 }}>{t.message}</span>
            <button
              onClick={() => removeToast(t.id)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
              }}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
