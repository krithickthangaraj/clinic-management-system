import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import HospitalProfileTab from './HospitalProfileTab';
import StaffManagementTab from './StaffManagementTab';
import ClinicalDictionaryTab from './ClinicalDictionaryTab';
import MyProfileTab from './MyProfileTab';

export default function SettingsDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('hospital');
  const [toast, setToast] = useState({ show: false, type: 'success', message: '' });

  const triggerToast = (type, message) => {
    setToast({ show: true, type, message });
    setTimeout(() => {
      setToast({ show: false, type: 'success', message: '' });
    }, 3500);
  };

  const isAdmin = user?.role?.toLowerCase() === 'admin';
  const isDoctor = user?.role?.toLowerCase() === 'doctor';

  const SETTINGS_TABS = [
    {
      id: 'hospital',
      label: 'Hospital Profile',
      desc: 'Letterhead, logo, branding & contact info',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
        </svg>
      ),
      visible: true,
    },
    {
      id: 'staff',
      label: 'Staff Management',
      desc: 'User accounts, roles & credentials',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      visible: isAdmin,
    },
    {
      id: 'dictionary',
      label: 'Clinical Dictionary',
      desc: 'Master terms, auto-complete & RX lists',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          <path d="M8 7h8M8 11h6" />
        </svg>
      ),
      visible: isAdmin || isDoctor,
    },
    {
      id: 'profile',
      label: 'My Profile',
      desc: 'Personal details & password',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="10" r="3" />
          <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
        </svg>
      ),
      visible: true,
    },
  ].filter((t) => t.visible);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50/60 p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <span className="p-1.5 bg-teal-600 text-white rounded-lg shadow-xs">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </span>
              <span>Settings &amp; Administration</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Centralized hub for facility letterhead, staff access credentials, clinical dictionaries, and profile security.
            </p>
          </div>
        </div>

        {/* Global Toast Alert */}
        {toast.show && (
          <div
            className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2 duration-150 ${
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
          {/* Left Navigation Sidebar (4 Cols) */}
          <aside className="md:col-span-4 lg:col-span-3 bg-white border border-slate-200/90 rounded-xl p-2.5 shadow-xs space-y-1">
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
              Configuration Menu
            </div>
            {SETTINGS_TABS.map((tab) => {
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
                  data-testid={`settings-tab-${tab.id}`}
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

          {/* Right Main Content Panel (8/9 Cols) */}
          <main className="md:col-span-8 lg:col-span-9 bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs">
            {activeTab === 'hospital' && <HospitalProfileTab onToast={triggerToast} />}
            {activeTab === 'staff' && <StaffManagementTab onToast={triggerToast} />}
            {activeTab === 'dictionary' && <ClinicalDictionaryTab onToast={triggerToast} />}
            {activeTab === 'profile' && <MyProfileTab onToast={triggerToast} />}
          </main>
        </div>
      </div>
    </div>
  );
}
