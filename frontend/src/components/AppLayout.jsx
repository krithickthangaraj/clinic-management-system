import { useClinic } from '../contexts/ClinicContext';
import './AppLayout.css';
import GlobalHeader from './GlobalHeader';

/**
 * AppLayout wraps pages with:
 * 1. GlobalHeader (fixed at top)
 * 2. Page content (with padding-top for header)
 *
 * Used on all authenticated pages.
 * NOT used on login page (which is full-screen).
 */
export default function AppLayout({ children }) {
  const clinic = useClinic();

  return (
    <div className="app-layout">
      <GlobalHeader />
      <main className="app-content" style={{ paddingTop: clinic.headerHeight }}>
        {children}
      </main>
    </div>
  );
}
