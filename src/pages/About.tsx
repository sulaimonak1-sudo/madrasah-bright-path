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
  return <PublicLayout><PublicPageHeader eyebrow="About the institute" title={t(settings['website.about_title'], 'مدرسة للإيمان والعلم والأخلاق')}><p className="mt-6 max-w-2xl text-lg leading-8 text-primary-foreground/75">{settings['website.about_text']}</p></PublicPageHeader><main className="container py-20"><div className="grid gap-px border border-border bg-border md:grid-cols-2">{blocks.map(([label, key]) => <article key={key} className="bg-background p-8"><p className="eyebrow text-primary">{t(label, label)}</p><p className="mt-5 text-base leading-8 text-muted-foreground">{settings[`website.${key}`]}</p></article>)}</div><section className="mt-20 border-l-4 border-accent bg-muted/45 p-8 md:p-12"><p className="eyebrow text-primary">{t('Message from the head of the institute', 'رسالة من مدير المعهد')}</p><p className="mt-5 max-w-3xl font-display text-2xl font-bold leading-relaxed">{settings['website.head_message']}</p></section></main></PublicLayout>;
};

export default About;