import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const useInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    console.log('[PWA] useInstallPrompt hook mounted');

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('[PWA] App is already in standalone mode');
      setIsInstalled(true);
    }

    // Check if running as PWA (iOS)
    if ((navigator as any).standalone === true) {
      console.log('[PWA] App is running as iOS PWA');
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('[PWA] beforeinstallprompt event fired');
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Update UI to show install button
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      console.log('[PWA] App installed');
      // Clear the deferredPrompt since the app was installed
      setDeferredPrompt(null);
      setCanInstall(false);
      setIsInstalled(true);
    };

    const handleDisplayModeChange = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('[PWA] Display mode changed to standalone');
        setIsInstalled(true);
        setCanInstall(false);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.matchMedia('(display-mode: standalone)').addEventListener('change', handleDisplayModeChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.matchMedia('(display-mode: standalone)').removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) {
      console.warn('[PWA] No deferred install prompt available');
      return false;
    }

    try {
      console.log('[PWA] Showing install prompt');
      // Show the install prompt
      await deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      console.log('[PWA] User response:', outcome);
      
      if (outcome === 'accepted') {
        setCanInstall(false);
        setDeferredPrompt(null);
        setIsInstalled(true);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[PWA] Install prompt failed:', error);
      return false;
    }
  };

  const dismissInstallPrompt = () => {
    console.log('[PWA] Install prompt dismissed');
    setCanInstall(false);
    setDeferredPrompt(null);
  };

  return {
    canInstall,
    isInstalled,
    promptInstall,
    dismissInstallPrompt,
  };
};
