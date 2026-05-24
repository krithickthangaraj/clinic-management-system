import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { clinicConfig } from '../config/clinicConfig';

const ClinicContext = createContext();
const CLINIC_CONFIG_KEY = 'clinic_config';

export function ClinicProvider({ children }) {
  const [clinic, setClinic] = useState(() => {
    try {
      const stored = localStorage.getItem(CLINIC_CONFIG_KEY);
      return stored ? { ...clinicConfig, ...JSON.parse(stored) } : clinicConfig;
    } catch {
      return clinicConfig;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary', clinic.accentColor);
    root.style.setProperty('--primary-dark', clinic.accentColor);
  }, [clinic.accentColor]);

  const value = useMemo(
    () => ({
      ...clinic,
      updateClinic: (updates) => {
        setClinic((current) => {
          const next = { ...current, ...updates };
          localStorage.setItem(CLINIC_CONFIG_KEY, JSON.stringify(next));
          return next;
        });
      },
      resetClinic: () => {
        localStorage.removeItem(CLINIC_CONFIG_KEY);
        setClinic(clinicConfig);
      },
    }),
    [clinic]
  );

  return (
    <ClinicContext.Provider value={value}>
      {children}
    </ClinicContext.Provider>
  );
}

export function useClinic() {
  const context = useContext(ClinicContext);
  if (!context) {
    throw new Error('useClinic must be used within ClinicProvider');
  }
  return context;
}
