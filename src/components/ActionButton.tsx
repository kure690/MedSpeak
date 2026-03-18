import { LoaderCircle } from 'lucide-react';

import type { ActionButtonProps } from '@/types';

const variantClasses: Record<NonNullable<ActionButtonProps['variant']>, string> = {
  danger:
    'bg-white text-red-600 border-2 border-red-300 hover:border-red-400 hover:bg-red-50 active:bg-red-100 focus:ring-red-400 disabled:hover:bg-white disabled:hover:border-red-300',
  primary:
    'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 focus:ring-blue-500 shadow-sm hover:shadow-md disabled:hover:bg-blue-600 disabled:hover:shadow-sm',
  secondary:
    'bg-white text-slate-700 border-2 border-slate-300 hover:border-slate-400 hover:bg-slate-50 active:bg-slate-100 focus:ring-slate-400 disabled:hover:bg-white disabled:hover:border-slate-300',
};

export function ActionButton({
  children,
  className = '',
  disabled = false,
  fullWidth = false,
  icon: Icon,
  loading = false,
  type = 'button',
  variant = 'secondary',
  ...props
}: ActionButtonProps) {
  const widthStyles = fullWidth ? 'w-full' : '';

  return (
    <button
      aria-busy={loading}
      className={[
        'flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        variantClasses[variant],
        widthStyles,
        className,
      ].join(' ')}
      disabled={disabled || loading}
      type={type}
      {...props}
    >
      {loading ? <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" /> : null}
      {!loading && Icon ? <Icon className="h-5 w-5" aria-hidden="true" /> : null}
      <span>{children}</span>
    </button>
  );
}
