import { ReactNode, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { supabase } from '@/integrations/supabase/client';
import { Mail, MapPin, Menu, Phone, X } from 'lucide-react';

export const PublicLayout = ({ children }: { children: ReactNode }) => {
  const { t } = useLanguage();
  const [schoolName, setSchoolName] = useState('Al-Bari Group Of Schools');
  const [schoolNameAr, setSchoolNameAr] = useState('مجموعة مدارس البارئ');
  const [contact, setContact] = useState({ address: 'Main Campus', phone: '+234 000 000 0000', email: 'hello@albari.sch.ng' });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    supabase.from('school_settings').select('key,value').like('key', 'website.%').then(({ data }) => {
      const settings = Object.fromEntries((data || []).map(row => [row.key, row.value]));
      if (settings['website.school_name']) setSchoolName(settings['website.school_name']);
      if (settings['website.school_name_ar']) setSchoolNameAr(settings['website.school_name_ar']);
      setContact(current => ({ address: settings['website.address'] || current.address, phone: settings['website.phone'] || current.phone, email: settings['website.email'] || current.email }));
    });
  }, []);

  return (
    <div className="public-site min-h-screen flex flex-col bg-background">
      <div className="hidden bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))] md:block">
        <div className="container flex h-7 items-center justify-between text-[10px]">
          <div className="flex items-center gap-5"><span className="flex items-center gap-1.5"><MapPin className="h-3 w-3 text-accent" />{contact.address}</span><a href={`tel:${contact.phone}`} className="flex items-center gap-1.5"><Phone className="h-3 w-3 text-accent" />{contact.phone}</a><a href={`mailto:${contact.email}`} className="flex items-center gap-1.5"><Mail className="h-3 w-3 text-accent" />{contact.email}</a></div>
          <div className="flex items-center gap-4"><Link to="/staff/signup" className="hover:text-accent">{t('Staff Portal', 'بوابة الموظفين')}</Link><Link to="/admin/login" className="hover:text-accent">{t('Admin Portal', 'بوابة المسؤول')}</Link></div>
        </div>
      </div>
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/95 backdrop-blur-lg">
        <div className="container flex h-[62px] items-center justify-between gap-5">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-primary/10 p-1">
              <img src="/images/school-logo.png" alt="School logo" className="h-full w-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
            </div>
            <div>
              <h1 className="font-display text-base font-extrabold tracking-tight text-foreground md:text-lg">
                {t(schoolName, schoolNameAr)}
              </h1>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary/70">
                {t('Institute for Islamic Sciences', 'معهد العلوم الإسلامية')}
              </p>
            </div>
          </Link>
          <div className="hidden items-center gap-5 lg:flex">
            <nav className="flex items-center gap-5">
              <Link to="/about" className="text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground">{t('About', 'عن المدرسة')}</Link>
              <Link to="/academics" className="text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground">{t('Academics', 'الأكاديميات')}</Link>
              <Link to="/news-events" className="text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground">{t('News & Events', 'الأخبار والفعاليات')}</Link>
              <Link to="/gallery" className="text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground">{t('Gallery', 'معرض الصور')}</Link>
              <Link to="/contact" className="text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground">{t('Contact', 'تواصل معنا')}</Link>
              <Link to="/results" className="inline-flex h-10 items-center bg-accent px-4 text-xs font-bold text-accent-foreground transition-colors hover:bg-accent/85">{t('Check Result', 'عرض النتيجة')}</Link>
            </nav>
            <LanguageToggle />
            <Link
              to="/admin/login"
              className="rounded-xl border border-border/70 bg-card px-3 py-2 text-xs font-bold text-muted-foreground shadow-sm transition-colors hover:text-foreground"
            >
              {t('Admin', 'المسؤول')}
            </Link>
          </div>
          <div className="flex items-center gap-2 lg:hidden"><Link to="/results" className="inline-flex h-10 items-center bg-accent px-3 text-xs font-bold text-accent-foreground">{t('Result', 'النتيجة')}</Link><button type="button" onClick={() => setMobileOpen(true)} className="flex h-10 w-10 items-center justify-center rounded-lg border border-border" aria-label={t('Open menu', 'فتح القائمة')}><Menu className="h-5 w-5" /></button></div>
        </div>
      </header>
      {mobileOpen && <div className="fixed inset-0 z-50 bg-background lg:hidden"><div className="flex h-[76px] items-center justify-between border-b border-border px-5"><span className="font-display text-lg font-extrabold">{t('Menu', 'القائمة')}</span><button type="button" onClick={() => setMobileOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-lg border border-border" aria-label={t('Close menu', 'إغلاق القائمة')}><X className="h-5 w-5" /></button></div><nav className="flex flex-col gap-1 p-5">{[["/", 'Home'], ['/about', 'About Us'], ['/academics', 'Academics'], ['/news-events', 'News & Events'], ['/gallery', 'Gallery'], ['/contact', 'Contact'], ['/results', 'Check Result'], ['/staff/signup', 'Staff Portal'], ['/admin/login', 'Admin Portal']].map(([path, label]) => <Link key={path} to={path} onClick={() => setMobileOpen(false)} className="border-b border-border py-4 text-base font-bold">{t(label, label)}</Link>)}</nav></div>}

      {/* Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-[hsl(var(--sidebar-background))] py-12 text-[hsl(var(--sidebar-foreground))]">
        <div className="container grid gap-10 md:grid-cols-4">
          <div><div className="flex items-center gap-3"><img src="/images/school-logo.png" alt="School logo" className="h-12 w-12 object-contain" /><div><p className="font-display font-extrabold">{t(schoolName, schoolNameAr)}</p><p className="text-[10px] uppercase tracking-[0.14em] text-accent">{t('Institute for Islamic Sciences', 'معهد العلوم الإسلامية')}</p></div></div><p className="mt-5 text-sm leading-7 text-sidebar-foreground/65">{t('A structured Islamic learning community developing knowledge, character, discipline, and confidence.', 'مجتمع تعليمي إسلامي ينمي العلم والأخلاق والانضباط والثقة.')}</p></div>
          <div><p className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-accent">{t('Quick links', 'روابط سريعة')}</p><div className="grid gap-3 text-sm text-sidebar-foreground/70"><Link to="/about" className="hover:text-accent">{t('About Us', 'عن المعهد')}</Link><Link to="/academics" className="hover:text-accent">{t('Academics', 'الأكاديميات')}</Link><Link to="/news-events" className="hover:text-accent">{t('News & Events', 'الأخبار والفعاليات')}</Link><Link to="/gallery" className="hover:text-accent">{t('Gallery', 'معرض الصور')}</Link><Link to="/contact" className="hover:text-accent">{t('Contact', 'تواصل معنا')}</Link></div></div>
          <div><p className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-accent">{t('Results', 'النتائج')}</p><div className="grid gap-3 text-sm text-sidebar-foreground/70"><Link to="/results" className="hover:text-accent">{t('Result Checker', 'الاستعلام عن النتائج')}</Link></div></div>
          <div><p className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-accent">{t('Contact', 'تواصل معنا')}</p><div className="grid gap-3 text-sm text-sidebar-foreground/70"><span>{contact.address}</span><a href={`tel:${contact.phone}`} className="hover:text-accent">{contact.phone}</a><a href={`mailto:${contact.email}`} className="hover:text-accent">{contact.email}</a></div></div>
        </div>
        <div className="container mt-10 border-t border-sidebar-border pt-5 text-xs text-sidebar-foreground/45"><p>© {new Date().getFullYear()} {t(schoolName, schoolNameAr)}. {t('All rights reserved.', 'جميع الحقوق محفوظة.')}</p></div>
      </footer>
    </div>
  );
};
