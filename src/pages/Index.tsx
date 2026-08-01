import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, ChevronRight, GraduationCap, Image as ImageIcon, MapPin, Shield, Sparkles, Users } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PublicLayout } from '@/components/PublicLayout';
import { ScrollToTop } from '@/components/ScrollToTop';
import { supabase } from '@/integrations/supabase/client';

type WebsiteSettings = Record<string, string>;

const defaults: WebsiteSettings = {
  'website.school_name': 'Al-Bari Group Of Schools',
  'website.school_name_ar': 'مجموعة مدارس البارئ',
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
  'website.news_1': 'Students celebrate another term of learning and growth.',
  'website.news_2': 'Qur’an recitation and Islamic knowledge competition announced.',
  'website.news_3': 'Our learning community welcomes families to a new academic session.',
  'website.events': 'Qur’an Competition|Ramadan Activities|End-of-year Graduation',
  'website.facilities': 'Mosque and prayer hall|Tahfeez hall|Library|ICT room|Playground|Safe classrooms',
  'website.phone': '+234 000 000 0000',
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
    { icon: BookOpen, title: ['Qualified scholars', 'علماء مؤهلون'], text: ['Students learn from teachers who combine knowledge with care.', 'يتعلم الطلاب من معلمين يجمعون بين العلم والرعاية.'] },
    { icon: GraduationCap, title: ['Academic excellence', 'التميز الأكاديمي'], text: ['A clear academic foundation supports every learner’s future.', 'أساس أكاديمي واضح يدعم مستقبل كل متعلم.'] },
    { icon: Users, title: ['Safe and supportive community', 'مجتمع آمن وداعم'], text: ['A welcoming environment where every student is seen and valued.', 'بيئة مرحبة يرى فيها كل طالب ويقدّر.'] },
  ];
  const programmes = ['Nursery Madrasah', 'Primary Madrasah', 'Secondary Madrasah', 'Tahfeez Programme', 'Weekend Classes', 'Adult Classes'];
  const news = [settings['website.news_1'], settings['website.news_2'], settings['website.news_3']];
  const events = settings['website.events'].split('|');
  const facilities = settings['website.facilities'].split('|');

  return (
    <PublicLayout>
      <ScrollToTop />
      <section className="relative overflow-hidden bg-secondary">
        <div className="absolute inset-0 geometric-pattern opacity-[0.04]" />
        <div className="container relative flex min-h-[560px] items-center py-24 lg:py-32">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="mb-7 inline-flex items-center gap-2 border border-primary/20 bg-background/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-primary"><Sparkles className="h-3.5 w-3.5 text-accent" /> {t('Institute for Islamic Sciences', 'معهد العلوم الإسلامية')}</div>
            <h1 className="max-w-4xl font-display text-5xl font-extrabold leading-[0.98] tracking-tight text-foreground md:text-8xl">{t(settings['website.hero_title'], settings['website.hero_title_ar'])}</h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">{t(settings['website.hero_text'], settings['website.hero_text_ar'])}</p>
            <div className="mt-9 flex flex-wrap gap-3"><Link to="/results" className="inline-flex h-12 items-center gap-2 bg-accent px-5 text-sm font-bold text-accent-foreground transition-transform hover:-translate-y-0.5">{t('Check student results', 'عرض نتائج الطلاب')} <ArrowRight className="h-4 w-4" /></Link><a href="#about" className="inline-flex h-12 items-center gap-2 border border-primary-foreground/25 px-5 text-sm font-bold text-primary-foreground hover:bg-primary-foreground/10">{t('Discover our madrasah', 'اكتشف مدرستنا')} <ChevronRight className="h-4 w-4" /></a></div>
          </motion.div>
        </div>
      </section>

      <section className="container relative z-10 -mt-10 pb-20"><div className="ml-auto flex max-w-xl items-center justify-between gap-5 border border-border/70 bg-card p-5 shadow-card-lg"><div><p className="font-display text-lg font-extrabold">{t('Looking for a student report?', 'هل تبحث عن تقرير طالب؟')}</p><p className="mt-1 text-sm text-muted-foreground">{t('Results have their own secure space.', 'للنتائج مساحة آمنة ومخصصة.')}</p></div><Link to="/results" className="inline-flex h-11 shrink-0 items-center gap-2 bg-primary px-4 text-xs font-bold text-primary-foreground hover:bg-primary/90">{t('Check results', 'عرض النتائج')} <ArrowRight className="h-4 w-4" /></Link></div></section>

      <section id="about" className="container grid gap-10 pb-24 lg:grid-cols-[0.8fr_1.2fr] lg:items-center"><div><p className="eyebrow text-primary">{t('Our madrasah', 'مدرستنا')}</p><h2 className="mt-3 max-w-lg font-display text-4xl font-extrabold leading-tight md:text-5xl">{t(settings['website.about_title'], settings['website.about_title_ar'])}</h2></div><div><p className="max-w-2xl text-lg leading-8 text-muted-foreground">{t(settings['website.about_text'], settings['website.about_text_ar'])}</p><div className="mt-8 grid grid-cols-2 gap-5 border-t border-border pt-6 sm:grid-cols-3"><div><p className="font-display text-3xl font-extrabold">{stats.students || '—'}</p><p className="mt-1 text-xs text-muted-foreground">{t('Learners', 'المتعلمون')}</p></div><div><p className="font-display text-3xl font-extrabold">{stats.subjects || '—'}</p><p className="mt-1 text-xs text-muted-foreground">{t('Subjects', 'المواد')}</p></div><div><p className="font-display text-3xl font-extrabold">100%</p><p className="mt-1 text-xs text-muted-foreground">{t('Digital records', 'سجلات رقمية')}</p></div></div></div></section>

      <section id="programs" className="bg-muted/45 py-24"><div className="container"><div className="mb-10 max-w-xl"><p className="eyebrow text-primary">{t('Why choose Al-Bari Institute?', 'لماذا تختار معهد البارئ؟')}</p><h2 className="mt-3 font-display text-4xl font-extrabold">{t(settings['website.programs_title'], settings['website.programs_title_ar'])}</h2></div><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{featureItems.map(item => <div key={item.title[0]} className="border border-border bg-background p-7"><item.icon className="h-7 w-7 text-primary" strokeWidth={1.7} /><h3 className="mt-12 font-display text-xl font-extrabold">{t(item.title[0], item.title[1])}</h3><p className="mt-3 text-sm leading-7 text-muted-foreground">{t(item.text[0], item.text[1])}</p></div>)}</div><h2 className="mt-20 font-display text-3xl font-extrabold">{t('Our programmes', 'برامجنا')}</h2><div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{programmes.map(programme => <div key={programme} className="flex items-center gap-3 border border-border bg-background p-5"><BookOpen className="h-5 w-5 text-primary" /><span className="font-bold">{t(programme, programme)}</span></div>)}</div></div></section>

      <section className="container py-24"><div className="grid grid-cols-2 gap-6 border-y border-border py-8 md:grid-cols-4"><div><p className="font-display text-4xl font-extrabold">{stats.students || '—'}</p><p className="text-sm text-muted-foreground">{t('Students', 'الطلاب')}</p></div><div><p className="font-display text-4xl font-extrabold">{stats.subjects || '—'}</p><p className="text-sm text-muted-foreground">{t('Subjects', 'المواد')}</p></div><div><p className="font-display text-4xl font-extrabold">100%</p><p className="text-sm text-muted-foreground">{t('Digital records', 'سجلات رقمية')}</p></div><div><p className="font-display text-4xl font-extrabold">6</p><p className="text-sm text-muted-foreground">{t('Core programmes', 'البرامج الأساسية')}</p></div></div></section>

      <section className="bg-muted/45 py-24"><div className="container grid gap-16 lg:grid-cols-2"><div><p className="eyebrow text-primary">{t('Latest news', 'آخر الأخبار')}</p><h2 className="mt-3 font-display text-4xl font-extrabold">{t('What is happening at the madrasah.', 'ما يحدث في المدرسة.')}</h2><div className="mt-8 space-y-3">{news.map(item => <article key={item} className="border border-border bg-background p-5"><p className="font-bold">{item}</p><p className="mt-2 text-xs text-muted-foreground">{t('School news', 'أخبار المدرسة')}</p></article>)}</div><Link to="/news-events" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary">{t('View all news and events', 'عرض كل الأخبار والفعاليات')} <ArrowRight className="h-4 w-4" /></Link></div><div><p className="eyebrow text-primary">{t('Upcoming events', 'الفعاليات القادمة')}</p><div className="mt-8 border-l-2 border-accent pl-6">{events.map(event => <div key={event} className="pb-8 last:pb-0"><p className="text-xs font-bold text-primary">{t('Coming soon', 'قريباً')}</p><p className="mt-2 font-display text-xl font-bold">{event}</p></div>)}</div></div></div></section>

      <section className="container py-24"><div className="flex items-end justify-between gap-6"><div><p className="eyebrow text-primary">{t('Learning environment', 'بيئة التعلم')}</p><h2 className="mt-3 font-display text-4xl font-extrabold">{t('A place prepared for growth.', 'مكان مهيأ للنمو.')}</h2></div><Link to="/gallery" className="hidden items-center gap-2 text-sm font-bold text-primary sm:flex">{t('View gallery', 'عرض المعرض')} <ImageIcon className="h-4 w-4" /></Link></div><div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{facilities.map(facility => <div key={facility} className="border border-border bg-card p-6"><p className="font-display text-xl font-bold">{facility}</p></div>)}</div></section>

      <section id="contact" className="container grid gap-10 py-24 md:grid-cols-[1fr_auto] md:items-end"><div><p className="eyebrow text-primary">{t('Visit or reach us', 'تواصل معنا')}</p><h2 className="mt-3 max-w-xl font-display text-4xl font-extrabold">{t('Your child’s next chapter starts with a conversation.', 'تبدأ رحلة طفلك القادمة بمحادثة.')}</h2><p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4 text-primary" />{settings['website.address']}</p><p className="mt-2 text-sm text-muted-foreground">{settings['website.phone']} · {settings['website.email']}</p></div><div><Link to="/contact" className="inline-flex h-12 items-center gap-2 bg-primary px-5 text-sm font-bold text-primary-foreground hover:bg-primary/90">{t('Get in touch', 'تواصل معنا')} <ArrowRight className="h-4 w-4" /></Link></div></section>
    </PublicLayout>
  );
};

export default Index;