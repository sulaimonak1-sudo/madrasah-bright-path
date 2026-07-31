import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';

export const PublicLayout = ({ children }: { children: ReactNode }) => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-lg">
        <div className="container flex items-center justify-between py-4 md:py-5">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 p-1">
              <img src="/images/school-logo.png" alt="Al-Bari Logo" className="h-full w-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
            </div>
            <div>
              <h1 className="font-display text-base font-extrabold tracking-tight text-foreground md:text-lg">
                {t('Al-Bari Group of Schools', 'مجموعة مدارس البارئ')}
              </h1>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary/70">
                {t('Madrasah Result Portal', 'بوابة نتائج المدرسة')}
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <Link
              to="/admin/login"
              className="rounded-xl border border-border/70 bg-card px-3 py-2 text-xs font-bold text-muted-foreground shadow-sm transition-colors hover:text-foreground"
            >
              {t('Admin', 'المسؤول')}
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border/70 bg-card/60 py-8">
        <div className="container text-center text-sm text-muted-foreground space-y-2">
          <p>© {new Date().getFullYear()} {t('Al-Bari Group of Schools. All rights reserved.', 'مجموعة مدارس البارئ. جميع الحقوق محفوظة.')}</p>
          <p>
            {t('Designed by', 'تصميم')}{' '}
            <a
              href="https://akboy.space"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary hover:underline transition-colors"
            >
              Akboy Creative Hub
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
};
