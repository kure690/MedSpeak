import {
  AlertCircle,
  Circle,
  Mic,
  RefreshCw,
  Volume2,
} from 'lucide-react';

import type { StatusIndicatorProps } from '@/types';

const statusStyles: Record<
  StatusIndicatorProps['status'],
  {
    bgColor: string;
    borderColor: string;
    icon: typeof Circle;
    iconColor: string;
    label: string;
    textColor: string;
  }
> = {
  error: {
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: AlertCircle,
    iconColor: 'text-red-600',
    label: 'Error occurred',
    textColor: 'text-red-700',
  },
  idle: {
    bgColor: 'bg-slate-100',
    borderColor: 'border-slate-200',
    icon: Circle,
    iconColor: 'text-slate-400',
    label: 'Ready',
    textColor: 'text-slate-600',
  },
  listening: {
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: Mic,
    iconColor: 'text-blue-600',
    label: 'Listening...',
    textColor: 'text-blue-700',
  },
  speaking: {
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    icon: Volume2,
    iconColor: 'text-indigo-600',
    label: 'Speaking...',
    textColor: 'text-indigo-700',
  },
  translating: {
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
    icon: RefreshCw,
    iconColor: 'text-teal-600',
    label: 'Translating...',
    textColor: 'text-teal-700',
  },
};

export function StatusIndicator({
  message,
  status,
}: StatusIndicatorProps) {
  const style = statusStyles[status];
  const Icon = style.icon;
  const showErrorSnackbar = status === 'error' && Boolean(message);

  return (
    <>
      <section
        aria-live="polite"
        className="mx-auto max-w-4xl px-4 py-4"
        role="status"
      >
        <div className="flex flex-col gap-2">
          <div
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 ${style.bgColor} ${style.borderColor}`}
          >
            <Icon
              aria-hidden="true"
              className={`h-5 w-5 ${style.iconColor} ${
                status === 'listening' || status === 'translating'
                  ? 'animate-pulse'
                  : ''
              }`}
            />
            <span className={`text-sm font-medium ${style.textColor}`}>
              {style.label}
            </span>
          </div>
          {message && status !== 'error' ? (
            <p className="max-w-2xl text-sm text-slate-600">{message}</p>
          ) : null}
        </div>
      </section>

      {showErrorSnackbar ? (
        <div
          aria-live="assertive"
          className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex justify-center"
          role="alert"
        >
          <div className="pointer-events-auto w-full max-w-xl animate-[medspeak-snackbar_220ms_ease-out] rounded-2xl border border-red-300 bg-red-600 px-4 py-4 text-white shadow-[0_22px_60px_-20px_rgba(185,28,28,0.75)]">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-50">
                  Translation Error
                </p>
                <p className="mt-1 text-sm leading-6 text-red-50">{message}</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
