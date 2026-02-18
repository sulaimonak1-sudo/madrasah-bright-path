import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';

export const PublicLayout = ({ children }: { children: ReactNode }) => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container flex items-center justify-between py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary overflow-hidden">
              <img src="/images/school-logo.png" alt="Al-Bari Logo" className="h-full w-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">
                {t('Al-Bari Group of Schools', 'مجموعة مدارس البارئ')}
              </h1>
              <p className="text-xs text-muted-foreground">
                {t('Madrasah Result Portal', 'بوابة نتائج المدرسة')}
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <Link
              to="/admin/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('Admin', 'المسؤول')}
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t bg-card py-6">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2025 {t('Al-Bari Group of Schools. All rights reserved.', 'مجموعة مدارس البارئ. جميع الحقوق محفوظة.')}</p>
        </div>
      </footer>
    </div>
  );
};
