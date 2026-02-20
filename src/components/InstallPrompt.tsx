import React, { useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useInstallPrompt } from '@/hooks/use-install-prompt';
import { useLanguage } from '@/contexts/LanguageContext';

export const InstallPrompt = () => {
  const { t, language } = useLanguage();
  const { canInstall, promptInstall, dismissInstallPrompt } = useInstallPrompt();
  const [showPrompt, setShowPrompt] = React.useState(false);

  useEffect(() => {
    if (canInstall) {
      // Show prompt after a short delay to not startle the user
      const timer = setTimeout(() => setShowPrompt(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [canInstall]);

  if (!showPrompt) {
    return null;
  }

  const handleInstall = async () => {
    const installed = await promptInstall();
    if (installed) {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    dismissInstallPrompt();
    setShowPrompt(false);
  };

  const title = language === 'ar' ? 'تثبيت التطبيق' : 'Install App';
  const description = language === 'ar' 
    ? 'ثبت تطبيق نتائج المدرسة على جهازك للوصول السريع والاستخدام بدون اتصال'
    : 'Install the school results app on your device for quick access and offline usage';
  const installLabel = language === 'ar' ? 'تثبيت' : 'Install';
  const dismissLabel = language === 'ar' ? 'إغلاق' : 'Dismiss';

  return (
    <Alert className="mb-6 bg-blue-50 border-blue-200">
      <Download className="h-4 w-4 text-blue-600" />
      <AlertDescription className="ml-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <p className="font-semibold text-blue-900 mb-1">{title}</p>
            <p className="text-sm text-blue-800">{description}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              onClick={handleInstall}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              {installLabel}
            </Button>
            <Button
              onClick={handleDismiss}
              size="sm"
              variant="ghost"
              className="text-blue-600 hover:bg-blue-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};
