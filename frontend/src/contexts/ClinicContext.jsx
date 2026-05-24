import { createContext, useContext } from 'react';
import { clinicConfig } from '../config/clinicConfig';

const ClinicContext = createContext();

export function ClinicProvider({ children }) {
  return (
    <ClinicContext.Provider value={clinicConfig}>
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
