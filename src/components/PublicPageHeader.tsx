import { ReactNode } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export const PublicPageHeader = ({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) => {
  const { t } = useLanguage();
  return <section className="relative overflow-hidden border-b border-border bg-secondary py-20 md:py-28"><div className="absolute inset-y-0 right-0 w-1/3 bg-primary/[0.035]" /><div className="container relative"><p className="eyebrow text-primary">{t(eyebrow, eyebrow)}</p><div className="mt-5 h-px w-16 bg-accent" /><h1 className="mt-6 max-w-4xl font-display text-5xl font-extrabold leading-[1.05] text-foreground md:text-7xl">{title}</h1>{children}</div></section>;
};