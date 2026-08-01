import { ReactNode } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export const PublicPageHeader = ({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) => {
  const { t } = useLanguage();
  return <section className="bg-[hsl(var(--sidebar-background))] py-20 text-primary-foreground md:py-28"><div className="container"><p className="eyebrow text-accent">{t(eyebrow, eyebrow)}</p><h1 className="mt-4 max-w-4xl font-display text-5xl font-extrabold leading-tight md:text-7xl">{title}</h1>{children}</div></section>;
};