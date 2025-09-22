'use client';

import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { useEffect } from 'react';

type Variant = 'success' | 'error' | 'info' | 'warning';

type Props = {
  open: boolean;
  title?: string;
  message?: string;
  variant?: Variant;
  duration?: number | null; // milliseconds; null = persistent
  action?: {
    label: string;
    onClick: () => void;
  } | null;
  onClose: () => void;
};

const iconFor = (v: Variant) => {
  switch (v) {
    case 'success':
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    case 'error':
      return <AlertTriangle className="h-5 w-5 text-red-600" />;
    default:
      return <Info className="h-5 w-5 text-blue-600" />;
  }
};

type ExtraProps = {
  inline?: boolean; // render without fixed positioning so a parent can stack
  offset?: number; // px offset from top when not inline
};

export default function TopRightDialog({
  open,
  title,
  message,
  variant = 'info',
  duration = 4000,
  action = null,
  onClose,
  inline = false,
  offset = 0,
}: Props & ExtraProps) {
  useEffect(() => {
    if (!open) return;
    if (duration === null) return; // persistent
    const t = setTimeout(() => onClose(), duration);
    return () => clearTimeout(t);
  }, [open, duration, onClose]);

  if (!open) return null;
  const card = (
    <div className="pointer-events-auto w-96 max-w-full">
      <div className={`flex items-start gap-3 rounded-lg border bg-white p-3 shadow-lg`}>
        <div className="pt-1">{iconFor(variant)}</div>
        <div className="flex-1">
          {title ? <div className="font-semibold text-sm text-foreground">{title}</div> : null}
          {message ? <div className="text-xs text-muted-foreground mt-1">{message}</div> : null}
          {action ? (
            <div className="mt-3">
              <button
                onClick={action.onClick}
                className="inline-flex items-center gap-2 rounded-md bg-[#3396D3] px-3 py-1 text-xs font-medium text-white hover:opacity-95"
              >
                {action.label}
              </button>
            </div>
          ) : null}
        </div>

        <div className="flex items-start">
          <button
            onClick={onClose}
            aria-label="Dismiss"
            className="ml-2 rounded-md p-1 text-muted-foreground hover:bg-muted/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  if (inline) return card;

  // positioned variant
  return (
    <div
      className="pointer-events-none fixed right-4 z-[9999]"
      style={{ top: `${offset ?? 16}px` }}
    >
      {card}
    </div>
  );
}
