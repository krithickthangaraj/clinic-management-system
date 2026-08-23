import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import { reportsService } from '../../services/reportsService';

const BOTTLENECK_COLORS = ['#0d9488', '#0284c7', '#8b5cf6'];

export default function OperationalAnalyticsTab({ onToast }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const res = await reportsService.getAnalytics();
      setData(res);
    } catch (err) {
      console.error('Failed to load operational analytics:', err);
      onToast('error', 'Failed to load analytics metrics.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center text-slate-400 text-xs">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 animate-spin text-teal-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" strokeWidth="3" className="opacity-25" />
            <path d="M4 12a8 8 0 018-8" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <span>Loading operational analytics...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs">
        No analytics data available.
      </div>
    );
  }

  const bottleneckChartData = [
    {
      name: 'Wait Time (Reg to Doctor)',
      minutes: data.bottlenecks?.avg_wait_time_minutes || 0,
      fill: '#0d9488',
    },
    {
      name: 'Consultation Time',
      minutes: data.bottlenecks?.avg_consultation_time_minutes || 0,
      fill: '#0284c7',
    },
    {
      name: 'Lab Turnaround Time',
      minutes: data.bottlenecks?.avg_lab_turnaround_minutes || 0,
      fill: '#8b5cf6',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Operational KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider">
            <span>7-Day OP Volume</span>
            <span className="p-1.5 bg-teal-50 text-teal-700 rounded-md">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{data.total_patients_7d}</div>
          <div className="text-[11px] text-teal-700 font-medium mt-1">Total registered outpatients</div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider">
            <span>Completed Visits</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-md">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-2">{data.total_completed_7d}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            {data.total_patients_7d > 0
              ? `${Math.round((data.total_completed_7d / data.total_patients_7d) * 100)}% completion rate`
              : '100% completion rate'}
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider">
            <span>Avg Wait Time</span>
            <span className="p-1.5 bg-amber-50 text-amber-700 rounded-md">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </span>
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-2">
            {data.bottlenecks?.avg_wait_time_minutes} <span className="text-xs font-normal text-slate-500">mins</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">Registration to Doctor desk</div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider">
            <span>Lab Turnaround</span>
            <span className="p-1.5 bg-purple-50 text-purple-700 rounded-md">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 2v7.31M14 9.3V1.99M8.5 2h7M14 9.3a6.5 6.5 0 1 1-4 0" />
              </svg>
            </span>
          </div>
          <div className="text-2xl font-bold text-purple-700 mt-2">
            {data.bottlenecks?.avg_lab_turnaround_minutes} <span className="text-xs font-normal text-slate-500">mins</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">Sample collection to results</div>
        </div>
      </div>

      {/* Charts Row 1: Line Chart & Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 1. Patient Flow 7 Days (7 Cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">7-Day Patient Flow Volume</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Daily registered outpatients vs. completed consultations</p>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
              Live Flow
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.patient_flow_7d} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="day_label"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    fontSize: '11px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line
                  type="monotone"
                  dataKey="patient_count"
                  name="Total Registered"
                  stroke="#0d9488"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#0d9488' }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="completed_count"
                  name="Completed OP"
                  stroke="#0284c7"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: '#0284c7' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Department Turnaround Times (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Department Turnaround (Mins)</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Average operational duration across clinical touchpoints</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bottleneckChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 9, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    fontSize: '11px',
                  }}
                  formatter={(val) => [`${val} Minutes`, 'Duration']}
                />
                <Bar dataKey="minutes" radius={[6, 6, 0, 0]}>
                  {bottleneckChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2: Top Prescribed Drugs & Top Diagnoses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top 5 Prescribed Drugs */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Top 5 Prescribed Medications</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Most frequent drugs in Doctor RX orders</p>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Frequency</span>
          </div>

          <div className="space-y-2.5">
            {data.top_prescribed_drugs && data.top_prescribed_drugs.length > 0 ? (
              data.top_prescribed_drugs.map((drug, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="font-bold text-slate-800 flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-teal-50 text-teal-700 text-[10px] flex items-center justify-center font-bold">
                        {idx + 1}
                      </span>
                      {drug.name}
                    </span>
                    <span className="font-mono text-slate-600 text-[11px]">
                      {drug.count} RX ({drug.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-teal-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(drug.percentage || 10, 100)}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-slate-400 text-xs">
                No prescription drugs recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Top 5 Clinical Diagnoses */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Top 5 Clinical Diagnoses</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Leading presenting conditions diagnosed</p>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Prevalence</span>
          </div>

          <div className="space-y-2.5">
            {data.top_diagnoses && data.top_diagnoses.length > 0 ? (
              data.top_diagnoses.map((diag, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="font-bold text-slate-800 flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-sky-50 text-sky-700 text-[10px] flex items-center justify-center font-bold">
                        {idx + 1}
                      </span>
                      {diag.name}
                    </span>
                    <span className="font-mono text-slate-600 text-[11px]">
                      {diag.count} Cases ({diag.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-sky-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(diag.percentage || 10, 100)}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-slate-400 text-xs">
                No clinical diagnoses recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
