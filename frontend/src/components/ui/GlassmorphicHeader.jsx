import React from 'react';

/**
 * GlassmorphicHeader - Vercel-Style Sticky Translucent Header
 * Elevation: shadow-[0_1px_3px_rgba(15,23,42,0.04),0_1px_2px_rgba(15,23,42,0.02)]
 * Background: bg-white/90 backdrop-blur-md border-b border-slate-200/80
 */
export default function GlassmorphicHeader({
  title,
  subtitle = null,
  badge = null,
  icon = null,
  onBack = null,
  actions = null,
  children = null,
  className = '',
  zIndex = 'z-20',
}) {
  return (
    <div
      className={`sticky top-0 ${zIndex} bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs px-4 py-3 transition-all duration-200 ${className}`}
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left Side: Back Button + Title + Subtitle + Badge */}
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors active:scale-95 shrink-0"
              title="Go back"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {icon && (
            <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200/60 text-teal-700 flex items-center justify-center shrink-0">
              {icon}
            </div>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight truncate">
                {title}
              </h1>
              {badge && <div className="shrink-0">{badge}</div>}
            </div>
            {subtitle && (
              <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right Side: Actions Ribbon */}
        {actions && (
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {actions}
          </div>
        )}
      </div>

      {/* Sub-header Content (Tabs / Search / Filters) */}
      {children && <div className="mt-3 max-w-7xl mx-auto">{children}</div>}
    </div>
  );
}
