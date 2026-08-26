import React from 'react';

/**
 * Helper to generate simple SVG sparkline path
 */
function createSvgPath(points, width = 100, height = 28) {
  if (!points || points.length < 2) return '';
  const validVals = points.filter((p) => typeof p === 'number' && !isNaN(p));
  if (validVals.length < 2) return '';

  const min = Math.min(...validVals);
  const max = Math.max(...validVals);
  const range = max - min || 1;

  const coords = validVals.map((val, idx) => {
    const x = (idx / (validVals.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 6) - 3;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return `M ${coords.join(' L ')}`;
}

/**
 * VitalsSparklineStrip - 3-Card Longitudinal Metric Sparklines
 * Renders BP trajectory, Blood Glucose trend, and Weight/BMI delta.
 */
export default function VitalsSparklineStrip({ trajectory = {} }) {
  const bpTrend = Array.isArray(trajectory.bp_trend) ? trajectory.bp_trend : [];
  const sugarTrend = Array.isArray(trajectory.sugar_trend) ? trajectory.sugar_trend : [];
  const weightTrend = Array.isArray(trajectory.weight_trend) ? trajectory.weight_trend : [];

  // Latest values
  const latestBp = bpTrend[bpTrend.length - 1] || bpTrend[0];
  const latestSugar = sugarTrend[sugarTrend.length - 1] || sugarTrend[0];
  const latestWeight = weightTrend[weightTrend.length - 1] || weightTrend[0];

  // Calculate BP Sparkline points (Systolic)
  const bpSystolicPoints = bpTrend.map((p) => p.systolic).filter(Boolean);
  const bpSparkline = createSvgPath(bpSystolicPoints);

  // Calculate Sugar Sparkline points
  const sugarPoints = sugarTrend.map((p) => p.value).filter(Boolean);
  const sugarSparkline = createSvgPath(sugarPoints);

  // Calculate Weight Sparkline points & delta
  const weightPoints = weightTrend.map((p) => p.weight_kg).filter(Boolean);
  const weightSparkline = createSvgPath(weightPoints);

  let weightDelta = null;
  if (weightPoints.length >= 2) {
    const diff = (weightPoints[weightPoints.length - 1] - weightPoints[0]).toFixed(1);
    weightDelta = `${diff > 0 ? '+' : ''}${diff} kg`;
  }

  // BP Alert Badge
  const isBpCritical = latestBp && (latestBp.systolic >= 140 || latestBp.diastolic >= 90);
  const isBpElevated =
    latestBp && !isBpCritical && (latestBp.systolic >= 120 || latestBp.diastolic >= 80);

  // Sugar Alert Badge
  const isSugarCritical = latestSugar && latestSugar.value >= 200;
  const isSugarElevated = latestSugar && !isSugarCritical && latestSugar.value >= 140;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
      {/* 1. Blood Pressure Card */}
      <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Blood Pressure
          </span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
              isBpCritical
                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                : isBpElevated
                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}
          >
            {isBpCritical ? 'Critical' : isBpElevated ? 'Stage 1' : 'Controlled'}
          </span>
        </div>

        <div className="flex items-end justify-between gap-2 mt-0.5">
          <span className="text-base font-extrabold text-slate-900 tracking-tight">
            {latestBp ? `${latestBp.systolic}/${latestBp.diastolic}` : '--/--'}{' '}
            <span className="text-[11px] font-normal text-slate-500">mmHg</span>
          </span>

          {bpSparkline && (
            <svg className="w-16 h-6 text-teal-600 overflow-visible shrink-0" viewBox="0 0 100 28">
              <path
                d={bpSparkline}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      </div>

      {/* 2. Blood Glucose Card */}
      <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Blood Glucose
          </span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
              isSugarCritical
                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                : isSugarElevated
                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}
          >
            {isSugarCritical ? 'High' : isSugarElevated ? 'Elevated' : 'Normal'}
          </span>
        </div>

        <div className="flex items-end justify-between gap-2 mt-0.5">
          <span className="text-base font-extrabold text-slate-900 tracking-tight">
            {latestSugar ? `${latestSugar.value}` : '--'}{' '}
            <span className="text-[11px] font-normal text-slate-500">mg/dL</span>
          </span>

          {sugarSparkline && (
            <svg className="w-16 h-6 text-amber-600 overflow-visible shrink-0" viewBox="0 0 100 28">
              <path
                d={sugarSparkline}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      </div>

      {/* 3. Weight & BMI Card */}
      <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Weight &amp; BMI
          </span>
          {weightDelta && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
              {weightDelta}
            </span>
          )}
        </div>

        <div className="flex items-end justify-between gap-2 mt-0.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-extrabold text-slate-900 tracking-tight">
              {latestWeight?.weight_kg ? `${latestWeight.weight_kg}` : '--'}{' '}
              <span className="text-[11px] font-normal text-slate-500">kg</span>
            </span>
            {latestWeight?.bmi && (
              <span className="text-xs font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
                BMI: {latestWeight.bmi}
              </span>
            )}
          </div>

          {weightSparkline && (
            <svg className="w-16 h-6 text-indigo-600 overflow-visible shrink-0" viewBox="0 0 100 28">
              <path
                d={weightSparkline}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}
