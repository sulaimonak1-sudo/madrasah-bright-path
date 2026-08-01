import { HeartHandshake, ShieldCheck, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PublicLayout } from '@/components/PublicLayout';
import { PublicPageHeader } from '@/components/PublicPageHeader';
import { useWebsiteSettings } from '@/hooks/use-website-settings';

const defaults = {
  'website.about_title': 'A madrasah for faith, knowledge, and character.',
  'website.about_text': 'Al-Bari Madrasah is an Islamic learning institute committed to nurturing confident, principled learners through Qur’anic education, sound academics, and purposeful tarbiyah.',
  'website.history': 'Founded to serve families seeking a balanced Islamic education, our madrasah continues to grow through a shared commitment to knowledge and good character.',
  'website.mission': 'To provide a safe, excellent, and faith-centred learning environment that prepares students to benefit themselves and their communities.',
  'website.vision': 'To raise a generation grounded in Islam, equipped with knowledge, and ready to serve with excellence.',
  'website.values': 'Faith, excellence, integrity, compassion, discipline, and service.',
  'website.philosophy': 'We believe education is an amanah. Learning should shape the mind, refine the heart, and equip each student to contribute positively.',
  'website.head_message': 'Welcome to our madrasah. We are honoured to partner with families in a journey of learning, worship, and character.',
};

const About = () => {
  const { t } = useLanguage();
  const settings = useWebsiteSettings(defaults);
  const blocks = [['History', 'history'], ['Mission', 'mission'], ['Vision', 'vision'], ['Core values', 'values'], ['Educational philosophy', 'philosophy']] as const;
  return <PublicLayout><PublicPageHeader eyebrow="About the institute" title={t(settings['website.about_title'], 'مدرسة للإيمان والعلم والأخلاق')}><p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">{settings['website.about_text']}</p></PublicPageHeader><main className="container py-20"><section className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center"><img src="/images/school-building.png" alt={t('Al-Bari Institute building', 'مبنى معهد البارئ')} className="h-full min-h-[300px] w-full object-cover" /><div><p className="eyebrow text-primary">{t('Our story', 'قصتنا')}</p><h2 className="mt-3 font-display text-4xl font-extrabold">{t('An institution built around purposeful learning.', 'مؤسسة بنيت حول التعلم الهادف.')}</h2><p className="mt-5 text-base leading-8 text-muted-foreground">{settings['website.history']}</p></div></section><section className="mt-20 grid gap-5 md:grid-cols-2"><article className="border border-primary/15 bg-[hsl(var(--accent-soft))] p-8"><HeartHandshake className="h-7 w-7 text-primary" /><p className="eyebrow mt-10 text-primary">{t('Mission', 'رسالتنا')}</p><p className="mt-4 text-base leading-8 text-foreground/75">{settings['website.mission']}</p></article><article className="border border-border bg-secondary p-8"><Sparkles className="h-7 w-7 text-primary" /><p className="eyebrow mt-10 text-primary">{t('Vision', 'رؤيتنا')}</p><p className="mt-4 text-base leading-8 text-foreground/75">{settings['website.vision']}</p></article></section><section className="mt-20"><div className="max-w-xl"><p className="eyebrow text-primary">{t('Core values', 'قيمنا الأساسية')}</p><h2 className="mt-3 font-display text-4xl font-extrabold">{t('The principles that guide our work.', 'المبادئ التي توجه عملنا.')}</h2></div><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{settings['website.values'].split(',').map((value, index) => <div key={value} className="border border-border bg-card p-6"><span className="font-display text-3xl font-extrabold text-accent">0{index + 1}</span><h3 className="mt-8 font-display text-xl font-bold">{value.trim()}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{t('A value we practise in learning and community life.', 'قيمة نمارسها في التعلم وحياة المجتمع.')}</p></div>)}</div></section><section className="mt-20 grid gap-10 border-t border-border pt-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center"><div><p className="eyebrow text-primary">{t('Educational philosophy', 'فلسفتنا التعليمية')}</p><h2 className="mt-3 font-display text-4xl font-extrabold">{t('Education is an amanah.', 'التعليم أمانة.')}</h2><p className="mt-5 text-base leading-8 text-muted-foreground">{settings['website.philosophy']}</p></div><div className="border-l-2 border-accent bg-muted/45 p-8"><ShieldCheck className="h-7 w-7 text-primary" /><p className="mt-5 font-display text-xl font-bold">{settings['website.head_message']}</p></div></section></main></PublicLayout>;
};

export default About;