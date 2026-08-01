import { ReactNode } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export const PublicPageHeader = ({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) => {
  const { t } = useLanguage();
  return <section className="relative overflow-hidden bg-[hsl(var(--sidebar-background))] py-14 text-primary-foreground md:py-20"><img src="/images/school-building.png" alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" /><div className="absolute inset-0 bg-[linear-gradient(90deg,hsl(var(--sidebar-background)/0.96),hsl(var(--sidebar-background)/0.65),hsl(var(--sidebar-background)/0.35))]" /><div className="container relative"><p className="eyebrow text-accent">{t(eyebrow, eyebrow)}</p><div className="mt-4 h-px w-12 bg-accent" /><h1 className="mt-4 max-w-4xl font-display text-4xl font-extrabold leading-[1.05] md:text-6xl">{title}</h1>{children}</div></section>;
};