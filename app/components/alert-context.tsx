'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import TopRightDialog from './top-right-dialog';

type Variant = 'success' | 'error' | 'info' | 'warning';

type AlertOptions = {
  title?: string;
  message?: string;
  variant?: Variant;
  duration?: number | null;
  action?: { label: string; onClick: () => void } | null;
};

type AlertContextValue = {
  showAlert: (opts: AlertOptions) => void;
  closeAlert: () => void;
};

const AlertContext = createContext<AlertContextValue | null>(null);

export const AlertProvider = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState<AlertOptions>({});

  const showAlert = useCallback((o: AlertOptions) => {
    setOpts(o);
    setOpen(true);
  }, []);

  const closeAlert = useCallback(() => setOpen(false), []);

  const value = useMemo(() => ({ showAlert, closeAlert }), [showAlert, closeAlert]);

  return (
    <AlertContext.Provider value={value}>
      {children}
      <TopRightDialog
        open={open}
        title={opts.title}
        message={opts.message}
        variant={opts.variant ?? 'info'}
        duration={opts.duration ?? 4000}
        action={opts.action ?? null}
        onClose={closeAlert}
      />
    </AlertContext.Provider>
  );
};

export function useAlert() {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error('useAlert must be used within AlertProvider');
  return ctx;
}
