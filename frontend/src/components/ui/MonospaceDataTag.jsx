import React from 'react';

/**
 * MonospaceDataTag - TasteSkill High-Density Monospace Clinical Metric Chip
 * Formats clinical metrics (BP, Blood Sugar, Token, UHID, Dosage) with absolute numerical clarity.
 */
export default function MonospaceDataTag({
  label = null,
  value,
  unit = null,
  variant = 'default', // 'default' | 'teal' | 'critical' | 'warning' | 'dark'
  size = 'md', // 'sm' | 'md'
  icon = null,
  className = '',
  ...props
}) {
  const variantStyles = {
    default: 'bg-slate-100 text-slate-900 border-slate-200/80',
    teal: 'bg-teal-50 text-teal-900 border-teal-200/80',
    critical: 'bg-rose-50 text-rose-800 border-rose-200/80 animate-pulse',
    warning: 'bg-amber-50 text-amber-900 border-amber-200/80',
    dark: 'bg-slate-900 text-white border-slate-800',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 gap-1 rounded-md',
    md: 'text-xs px-2.5 py-1 gap-1.5 rounded-lg',
  };

  const selectedVariant = variantStyles[variant] || variantStyles.default;
  const selectedSize = sizeStyles[size] || sizeStyles.md;

  return (
    <div
      className={`inline-flex items-center border font-mono select-none font-medium shadow-2xs ${selectedVariant} ${selectedSize} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0 flex items-center">{icon}</span>}
      {label && (
        <span className="text-[10px] uppercase font-sans font-extrabold tracking-wider text-slate-500 mr-0.5">
          {label}:
        </span>
      )}
      <span className="font-bold tracking-tight">{value}</span>
      {unit && (
        <span className="text-[10px] font-medium text-slate-500 font-sans ml-0.5">
          {unit}
        </span>
      )}
    </div>
  );
}
