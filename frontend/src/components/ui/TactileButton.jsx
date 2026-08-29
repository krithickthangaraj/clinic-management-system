import React from 'react';

/**
 * TactileButton - 21st.dev Tactile Micro-Press Button Primitive
 * Features active:scale-[0.98] spring feedback, 44px compliant touch boundaries,
 * and high-contrast keyboard shortcut badges.
 */
export default function TactileButton({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success'
  size = 'md', // 'sm' | 'md' | 'lg'
  icon = null,
  iconRight = null,
  shortcut = null, // e.g. 'Cmd+K' | 'Ctrl+Enter' | 'Alt+N' | 'Esc'
  loading = false,
  disabled = false,
  type = 'button',
  onClick = () => {},
  className = '',
  ...props
}) {
  const variantStyles = {
    primary:
      'bg-gradient-to-r from-teal-700 via-teal-600 to-teal-700 hover:from-teal-800 hover:to-teal-800 text-white shadow-xs hover:shadow-teal-700/25 border border-teal-600/40',
    secondary:
      'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/80 shadow-2xs',
    outline:
      'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 hover:border-slate-400 shadow-2xs',
    ghost:
      'bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 border-transparent',
    danger:
      'bg-rose-600 hover:bg-rose-700 text-white shadow-xs hover:shadow-rose-600/25 border border-rose-500/40',
    success:
      'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs hover:shadow-emerald-600/25 border border-emerald-500/40',
  };

  const sizeStyles = {
    sm: 'min-h-[34px] px-3 py-1.5 text-xs font-semibold rounded-lg gap-1.5',
    md: 'min-h-[42px] sm:min-h-[44px] px-4 py-2 text-xs sm:text-sm font-bold rounded-xl gap-2',
    lg: 'min-h-[48px] px-6 py-2.5 text-base font-bold rounded-xl gap-2.5',
  };

  const selectedVariant = variantStyles[variant] || variantStyles.primary;
  const selectedSize = sizeStyles[size] || sizeStyles.md;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center select-none font-sans cursor-pointer transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 ${selectedVariant} ${selectedSize} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      ) : (
        icon && <span className="shrink-0 flex items-center">{icon}</span>
      )}

      <span>{children}</span>

      {iconRight && !loading && (
        <span className="shrink-0 flex items-center">{iconRight}</span>
      )}

      {shortcut && (
        <kbd className="ml-1 px-1.5 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider rounded bg-black/10 dark:bg-white/15 border border-black/10 dark:border-white/20 text-current opacity-80 shrink-0">
          {shortcut}
        </kbd>
      )}
    </button>
  );
}
