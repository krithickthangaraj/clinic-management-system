import React, { useState } from 'react';
import OperationalAnalyticsTab from './OperationalAnalyticsTab';
import DocumentGenerationTab from './DocumentGenerationTab';

export default function ReportsDashboard() {
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' | 'documents'
  const [toast, setToast] = useState({ show: false, type: 'success', message: '' });

  const triggerToast = (type, message) => {
    setToast({ show: true, type, message });
    setTimeout(() => {
      setToast({ show: false, type: 'success', message: '' });
    }, 3500);
  };

  const REPORT_TABS = [
    {
      id: 'analytics',
      label: 'Operational Analytics',
      desc: 'Patient volume flow, department wait times & clinical insights',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
    },
    {
      id: 'documents',
      label: 'Document Generation',
      desc: 'Daily OP census, referral slips & medical leave certificates',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50/60 p-4 sm:p-6 lg:p-8">
      {/* Print Stylesheet */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-sheet, .printable-sheet * {
            visibility: visible;
          }
          .printable-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            margin: 0;
            background: white !important;
            border: none !important;
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Header (Hidden in Print) */}
        <div className="flex items-center justify-between gap-4 border-b border-slate-200/80 pb-4 no-print">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <span className="p-1.5 bg-teal-600 text-white rounded-lg shadow-xs">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M3 3v18h18" />
                  <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
                </svg>
              </span>
              <span>Reports &amp; Operational Analytics</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Operational patient throughput metrics, department bottleneck insights, and printable clinical document generation.
            </p>
          </div>
        </div>

        {/* Global Toast Alert */}
        {toast.show && (
          <div
            className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-xs no-print ${
              toast.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <span>{toast.type === 'success' ? '✓' : '⚠️'}</span>
              <span>{toast.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setToast({ show: false, type: 'success', message: '' })}
              className="text-slate-400 hover:text-slate-600 font-bold ml-3 cursor-pointer"
            >
              &times;
            </button>
          </div>
        )}

        {/* Split Layout: Left Navigation + Right Content */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Left Navigation (3/4 Cols) */}
          <aside className="md:col-span-4 lg:col-span-3 bg-white border border-slate-200/90 rounded-xl p-2.5 shadow-xs space-y-1 no-print">
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
              Reports Menu
            </div>
            {REPORT_TABS.map((tab) => {
              const isCurrent = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-lg flex items-start gap-3 transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-teal-50 border border-teal-200/80 text-teal-950 font-bold shadow-2xs'
                      : 'hover:bg-slate-50 text-slate-700 font-medium'
                  }`}
                  data-testid={`reports-tab-${tab.id}`}
                >
                  <div className={`p-1.5 rounded-md shrink-0 mt-0.5 ${isCurrent ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {tab.icon}
                  </div>
                  <div>
                    <div className="text-xs">{tab.label}</div>
                    <div className={`text-[10px] line-clamp-1 ${isCurrent ? 'text-teal-700' : 'text-slate-400'}`}>
                      {tab.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </aside>

          {/* Right Main Panel (8/9 Cols) */}
          <main className="md:col-span-8 lg:col-span-9">
            {activeTab === 'analytics' && <OperationalAnalyticsTab onToast={triggerToast} />}
            {activeTab === 'documents' && <DocumentGenerationTab onToast={triggerToast} />}
          </main>
        </div>
      </div>
    </div>
  );
}
