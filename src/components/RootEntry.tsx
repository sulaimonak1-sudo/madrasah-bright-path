import { Navigate } from 'react-router-dom';
import Index from '@/pages/Index';

/**
 * Installed app (home-screen / standalone) opens the staff login or dashboard.
 * Normal browser visits see the public homepage.
 */
const isInstalledApp = () => {
  if (typeof window === 'undefined') return false;
  const standalone =
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.matchMedia?.('(display-mode: fullscreen)').matches ||
    window.matchMedia?.('(display-mode: minimal-ui)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  return Boolean(standalone);
};

export const RootEntry = () => {
  if (isInstalledApp()) return <Navigate to="/admin" replace />;
  return <Index />;
};

export default RootEntry;
