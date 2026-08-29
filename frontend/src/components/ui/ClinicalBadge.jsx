import React from 'react';

/**
 * ClinicalBadge - Vercel-Style Inset-Ring Clinical Status Badge
 * Features high-contrast typography, mathematical ring borders, and live pulsing indicators.
 */
export default function ClinicalBadge({
  children,
  variant = 'slate', // 'emerald' | 'amber' | 'rose' | 'teal' | 'slate' | 'sky' | 'purple'
  size = 'md', // 'sm' | 'md' | 'lg'
  isLive = false,
  pulse = false,
  mono = false,
  icon = null,
  className = '',
  ...props
}) {
  const variantStyles = {
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    amber: 'bg-amber-50 text-amber-700 ring-amber-600/30',
    rose: 'bg-rose-50 text-rose-700 ring-rose-600/30',
    teal: 'bg-teal-50 text-teal-800 ring-teal-600/20',
    slate: 'bg-slate-50 text-slate-700 ring-slate-500/20',
    sky: 'bg-sky-50 text-sky-700 ring-sky-600/20',
    purple: 'bg-purple-50 text-purple-700 ring-purple-600/20',
    dark: 'bg-slate-900 text-white ring-slate-800',
  };

  const sizeStyles = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-0.5 gap-1.5',
    lg: 'text-sm px-3 py-1 gap-2',
  };

  const selectedVariant = variantStyles[variant] || variantStyles.slate;
  const selectedSize = sizeStyles[size] || sizeStyles.md;

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold ring-1 ring-inset select-none transition-all duration-150 ${
        mono ? 'font-mono tracking-tight' : 'font-sans'
      } ${pulse ? 'animate-pulse' : ''} ${selectedVariant} ${selectedSize} ${className}`}
      {...props}
    >
      {isLive && (
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
        </span>
      )}
      {icon && <span className="shrink-0 flex items-center">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}
