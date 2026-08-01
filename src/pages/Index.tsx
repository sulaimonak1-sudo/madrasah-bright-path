import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronRight, GraduationCap, MapPin, Shield, Sparkles, Users } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PublicLayout } from '@/components/PublicLayout';
import { ScrollToTop } from '@/components/ScrollToTop';
import { supabase } from '@/integrations/supabase/client';

type WebsiteSettings = Record<string, string>;

const defaults: WebsiteSettings = {
  'website.school_name': 'Al-Bari Madrasah',
  'website.school_name_ar': 'مدرسة البارئ',
  'website.hero_title': 'Rooted in faith. Growing in knowledge.',
  'website.hero_title_ar': 'راسخون في الإيمان، نامون في العلم',
  'website.hero_text': 'A welcoming Islamic learning community where Qur’anic values, sound knowledge, and excellent character shape every student’s journey.',
  'website.hero_text_ar': 'مجتمع تعليمي إسلامي يرحب بالجميع، تتشكل فيه رحلة كل طالب بقيم القرآن والعلم النافع وحسن الخلق.',
  'website.about_title': 'A madrasah for faith, knowledge, and character.',
  'website.about_title_ar': 'مدرسة للإيمان والعلم والأخلاق.',
  'website.about_text': 'Our madrasah brings together Qur’anic learning, strong academics, and tarbiyah in a caring environment. We partner with families to nurture students who learn with purpose and serve with excellence.',
  'website.about_text_ar': 'تجمع مدرستنا بين تعليم القرآن والدراسة الأكاديمية والتربية في بيئة راعية، ونتعاون مع الأسر لبناء طلاب يتعلمون بوعي ويخدمون بإتقان.',
  'website.address': 'Al-Bari Madrasah, Main Campus',
  'website.email': 'hello@albari.sch.ng',
  'website.programs_title': 'Built around every learner.',
  'website.programs_title_ar': 'نضع كل متعلم في المقدمة.',
  'website.program_quran': 'Qur’an and sound learning',
  'website.program_tarbiyah': 'Tarbiyah and good character',
  'website.program_community': 'A trusted family partnership',
};

const Index = () => {
  const { t } = useLanguage();
  const [settings, setSettings] = useState<WebsiteSettings>(defaults);
  const [stats, setStats] = useState({ students: 0, subjects: 0 });

  useEffect(() => {
    (async () => {
      const [settingsRes, studentsRes, subjectsRes] = await Promise.all([
        supabase.from('school_settings').select('key,value').like('key', 'website.%'),
        supabase.from('students').select('id', { count: 'exact', head: true }),
        supabase.from('subjects').select('id', { count: 'exact', head: true }),
      ]);
      const saved = Object.fromEntries((settingsRes.data || []).map(row => [row.key, row.value]));
      setSettings(current => ({ ...current, ...saved }));
      setStats({ students: Number(studentsRes.count || 0), subjects: Number(subjectsRes.count || 0) });
    })();
  }, []);

  const featureItems = [
    { icon: GraduationCap, title: [settings['website.program_quran'], 'القرآن والعلم النافع'], text: ['A balanced programme that honours revelation, scholarship, and discovery.', 'منهج متوازن يكرم الوحي والعلم والاكتشاف.'] },
    { icon: Users, title: [settings['website.program_tarbiyah'], 'التربية وحسن الخلق'], text: ['Students are guided to live their values with confidence and compassion.', 'نوجه الطلاب ليعيشوا قيمهم بثقة ورحمة.'] },
    { icon: Shield, title: [settings['website.program_community'], 'شراكة موثوقة مع الأسرة'], text: ['Families and educators stay connected around each learner’s growth.', 'تبقى الأسرة والمعلمون متصلين بنمو كل طالب.'] },
  ];

  return (
    <PublicLayout>
      <ScrollToTop />
      <section className="relative overflow-hidden bg-[hsl(var(--sidebar-background))] text-primary-foreground">
        <div className="absolute inset-0 bg-[url('/images/school-front.png')] bg-cover bg-center opacity-25" />
        <div className="absolute inset-0 bg-[linear-gradient(110deg,hsl(var(--sidebar-background))_20%,transparent_90%)]" />
        <div className="container relative grid min-h-[590px] items-center gap-12 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:py-28">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="mb-7 inline-flex items-center gap-2 border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em]"><Sparkles className="h-3.5 w-3.5 text-accent" /> {t('Islamic institute', 'المعهد الإسلامي')}</div>
            <h1 className="max-w-3xl font-display text-5xl font-extrabold leading-[0.98] tracking-tight md:text-7xl">{t(settings['website.hero_title'], settings['website.hero_title_ar'])}</h1>
            <p className="mt-7 max-w-xl text-base leading-8 text-primary-foreground/75 md:text-lg">{t(settings['website.hero_text'], settings['website.hero_text_ar'])}</p>
            <div className="mt-9 flex flex-wrap gap-3"><Link to="/results" className="inline-flex h-12 items-center gap-2 bg-accent px-5 text-sm font-bold text-accent-foreground transition-transform hover:-translate-y-0.5">{t('Check student results', 'عرض نتائج الطلاب')} <ArrowRight className="h-4 w-4" /></Link><a href="#about" className="inline-flex h-12 items-center gap-2 border border-primary-foreground/25 px-5 text-sm font-bold text-primary-foreground hover:bg-primary-foreground/10">{t('Discover our madrasah', 'اكتشف مدرستنا')} <ChevronRight className="h-4 w-4" /></a></div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 22 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.15 }} className="hidden lg:block"><img src="/images/school-students.png" alt={t('Students at Al-Bari Madrasah', 'طلاب مدرسة البارئ')} className="ml-auto aspect-[4/5] max-h-[430px] w-full max-w-[390px] object-cover shadow-2xl" /></motion.div>
        </div>
      </section>

      <section className="container relative z-10 -mt-10 pb-20"><div className="ml-auto flex max-w-xl items-center justify-between gap-5 border border-border/70 bg-card p-5 shadow-card-lg"><div><p className="font-display text-lg font-extrabold">{t('Looking for a student report?', 'هل تبحث عن تقرير طالب؟')}</p><p className="mt-1 text-sm text-muted-foreground">{t('Results have their own secure space.', 'للنتائج مساحة آمنة ومخصصة.')}</p></div><Link to="/results" className="inline-flex h-11 shrink-0 items-center gap-2 bg-primary px-4 text-xs font-bold text-primary-foreground hover:bg-primary/90">{t('Check results', 'عرض النتائج')} <ArrowRight className="h-4 w-4" /></Link></div></section>

      <section id="about" className="container grid gap-10 pb-24 lg:grid-cols-[0.8fr_1.2fr] lg:items-center"><div><p className="eyebrow text-primary">{t('Our madrasah', 'مدرستنا')}</p><h2 className="mt-3 max-w-lg font-display text-4xl font-extrabold leading-tight md:text-5xl">{t(settings['website.about_title'], settings['website.about_title_ar'])}</h2></div><div><p className="max-w-2xl text-lg leading-8 text-muted-foreground">{t(settings['website.about_text'], settings['website.about_text_ar'])}</p><div className="mt-8 grid grid-cols-2 gap-5 border-t border-border pt-6 sm:grid-cols-3"><div><p className="font-display text-3xl font-extrabold">{stats.students || '—'}</p><p className="mt-1 text-xs text-muted-foreground">{t('Learners', 'المتعلمون')}</p></div><div><p className="font-display text-3xl font-extrabold">{stats.subjects || '—'}</p><p className="mt-1 text-xs text-muted-foreground">{t('Subjects', 'المواد')}</p></div><div><p className="font-display text-3xl font-extrabold">100%</p><p className="mt-1 text-xs text-muted-foreground">{t('Digital records', 'سجلات رقمية')}</p></div></div></div></section>

      <section id="programs" className="bg-muted/45 py-24"><div className="container"><div className="mb-10 max-w-xl"><p className="eyebrow text-primary">{t('What matters here', 'ما يهمنا هنا')}</p><h2 className="mt-3 font-display text-4xl font-extrabold">{t(settings['website.programs_title'], settings['website.programs_title_ar'])}</h2></div><div className="grid gap-px overflow-hidden border border-border bg-border md:grid-cols-3">{featureItems.map(item => <div key={item.title[0]} className="bg-background p-7"><item.icon className="h-7 w-7 text-primary" strokeWidth={1.7} /><h3 className="mt-12 font-display text-xl font-extrabold">{t(item.title[0], item.title[1])}</h3><p className="mt-3 text-sm leading-7 text-muted-foreground">{t(item.text[0], item.text[1])}</p></div>)}</div></div></section>

      <section id="contact" className="container grid gap-10 py-24 md:grid-cols-[1fr_auto] md:items-end"><div><p className="eyebrow text-primary">{t('Visit or reach us', 'تواصل معنا')}</p><h2 className="mt-3 max-w-xl font-display text-4xl font-extrabold">{t('Your child’s next chapter starts with a conversation.', 'تبدأ رحلة طفلك القادمة بمحادثة.')}</h2><p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4 text-primary" />{settings['website.address']}</p><p className="mt-2 text-sm text-muted-foreground">{settings['website.email']}</p></div><div><a href={`mailto:${settings['website.email']}`} className="inline-flex h-12 items-center gap-2 bg-primary px-5 text-sm font-bold text-primary-foreground hover:bg-primary/90">{t('Contact the school', 'تواصل مع المدرسة')} <ArrowRight className="h-4 w-4" /></a></div></section>
    </PublicLayout>
  );
};

export default Index;