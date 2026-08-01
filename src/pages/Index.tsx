import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronRight, GraduationCap, KeyRound, MapPin, Search, Shield, Sparkles, Users } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PublicLayout } from '@/components/PublicLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollToTop } from '@/components/ScrollToTop';
import { supabase } from '@/integrations/supabase/client';

type WebsiteSettings = Record<string, string>;

const defaults: WebsiteSettings = {
  'website.school_name': 'Al-Bari Madrasah',
  'website.school_name_ar': 'مدرسة البارئ',
  'website.hero_title': 'A grounded education for bright futures.',
  'website.hero_title_ar': 'تعليم راسخ لمستقبل مشرق',
  'website.hero_text': 'A caring learning community in the western section, helping every student grow in knowledge, character, and confidence.',
  'website.hero_text_ar': 'مجتمع تعليمي راعٍ في القسم الغربي، يساعد كل طالب على النمو في المعرفة والشخصية والثقة.',
  'website.about_title': 'A place to learn, belong, and become.',
  'website.about_title_ar': 'مكان للتعلم والانتماء والنمو.',
  'website.about_text': 'Our madrasah brings together purposeful teaching, strong values, and close attention to each learner. Families can stay connected to the academic journey from the classroom to home.',
  'website.about_text_ar': 'تجمع مدرستنا بين التعليم الهادف والقيم الراسخة والاهتمام بكل متعلم، مع إبقاء الأسرة على صلة بالرحلة الدراسية.',
  'website.address': 'Western Section, Al-Bari Group of Schools',
  'website.email': 'hello@albari.sch.ng',
};

const Index = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<WebsiteSettings>(defaults);
  const [studentId, setStudentId] = useState('');
  const [pin, setPin] = useState('');
  const [termId, setTermId] = useState('');
  const [terms, setTerms] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ students: 0, subjects: 0 });

  useEffect(() => {
    (async () => {
      const [settingsRes, termsRes, studentsRes, subjectsRes] = await Promise.all([
        supabase.from('school_settings').select('key,value').like('key', 'website.%'),
        supabase.from('terms').select('id,name_en,name_ar,term_number').order('term_number', { ascending: false }),
        supabase.from('students').select('id', { count: 'exact', head: true }),
        supabase.from('subjects').select('id', { count: 'exact', head: true }),
      ]);
      const saved = Object.fromEntries((settingsRes.data || []).map(row => [row.key, row.value]));
      setSettings(current => ({ ...current, ...saved }));
      setTerms(termsRes.data || []);
      if (termsRes.data?.[0]) setTermId(termsRes.data[0].id);
      setStats({ students: Number(studentsRes.count || 0), subjects: Number(subjectsRes.count || 0) });
    })();
  }, []);

  const handleCheckResult = (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!studentId.trim() || !termId) {
      setError(t('Please enter your Student ID and select a term.', 'الرجاء إدخال رقم الطالب واختيار الفصل الدراسي.'));
      return;
    }
    setLoading(true);
    navigate(`/result?student=${encodeURIComponent(studentId.trim())}&term=${encodeURIComponent(termId)}&pin=${encodeURIComponent(pin.trim())}`);
  };

  const featureItems = [
    { icon: GraduationCap, title: ['Whole-child learning', 'تعليم متكامل'], text: ['Strong academics shaped by character, curiosity, and care.', 'تعليم أكاديمي قوي تشكله الأخلاق والفضول والرعاية.'] },
    { icon: Users, title: ['A connected community', 'مجتمع مترابط'], text: ['Families and educators work together around every learner.', 'تتعاون الأسر والمعلمون حول كل متعلم.'] },
    { icon: Shield, title: ['Clear and trusted records', 'سجلات موثوقة وواضحة'], text: ['Secure digital access keeps progress visible when it matters.', 'وصول رقمي آمن يجعل التقدم واضحاً عند الحاجة.'] },
  ];

  return (
    <PublicLayout>
      <ScrollToTop />
      <section className="relative overflow-hidden bg-[hsl(var(--sidebar-background))] text-primary-foreground">
        <div className="absolute inset-0 bg-[url('/images/school-front.png')] bg-cover bg-center opacity-25" />
        <div className="absolute inset-0 bg-[linear-gradient(110deg,hsl(var(--sidebar-background))_20%,transparent_90%)]" />
        <div className="container relative grid min-h-[590px] items-center gap-12 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:py-28">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="mb-7 inline-flex items-center gap-2 border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em]"><Sparkles className="h-3.5 w-3.5 text-accent" /> {t('Western section', 'القسم الغربي')}</div>
            <h1 className="max-w-3xl font-display text-5xl font-extrabold leading-[0.98] tracking-tight md:text-7xl">{t(settings['website.hero_title'], settings['website.hero_title_ar'])}</h1>
            <p className="mt-7 max-w-xl text-base leading-8 text-primary-foreground/75 md:text-lg">{t(settings['website.hero_text'], settings['website.hero_text_ar'])}</p>
            <div className="mt-9 flex flex-wrap gap-3"><a href="#results" className="inline-flex h-12 items-center gap-2 bg-accent px-5 text-sm font-bold text-accent-foreground transition-transform hover:-translate-y-0.5">{t('Check a result', 'عرض النتيجة')} <ArrowRight className="h-4 w-4" /></a><a href="#about" className="inline-flex h-12 items-center gap-2 border border-primary-foreground/25 px-5 text-sm font-bold text-primary-foreground hover:bg-primary-foreground/10">{t('Discover our madrasah', 'اكتشف مدرستنا')} <ChevronRight className="h-4 w-4" /></a></div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 22 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.15 }} className="hidden lg:block"><img src="/images/school-students.png" alt={t('Students at Al-Bari Madrasah', 'طلاب مدرسة البارئ')} className="ml-auto aspect-[4/5] max-h-[430px] w-full max-w-[390px] object-cover shadow-2xl" /></motion.div>
        </div>
      </section>

      <section id="results" className="container relative z-10 -mt-10 pb-20"><Card className="ml-auto max-w-xl rounded-none border-border/70 bg-card shadow-card-lg"><CardHeader className="pb-3"><div className="mb-2 flex h-10 w-10 items-center justify-center bg-primary/10 text-primary"><Search className="h-5 w-5" /></div><CardTitle className="font-display text-2xl font-extrabold">{t('Check your result', 'التحقق من النتيجة')}</CardTitle><CardDescription>{t('Securely view a student report from the current academic cycle.', 'اعرض تقرير الطالب بأمان من الدورة الدراسية الحالية.')}</CardDescription></CardHeader><CardContent><form onSubmit={handleCheckResult} className="space-y-4"><div className="space-y-2"><Label>{t('Student ID', 'رقم الطالب')}</Label><Input placeholder="e.g. ABS-001" value={studentId} onChange={e => setStudentId(e.target.value)} disabled={loading} className="h-11 rounded-none" /></div><div className="space-y-2"><Label>{t('Academic term', 'الفصل الدراسي')}</Label><select className="h-11 w-full rounded-none border border-input bg-background px-3 text-sm" value={termId} onChange={e => setTermId(e.target.value)} disabled={loading}><option value="">{t('Select term...', 'اختر الفصل...')}</option>{terms.map(term => <option key={term.id} value={term.id}>{`${t('Term', 'الفصل')} ${term.term_number} - ${term.name_en || term.name_ar}`}</option>)}</select></div><div className="space-y-2"><Label>{t('PIN', 'الرقم السري')} <span className="font-normal text-muted-foreground">{t('(optional)', '(اختياري)')}</span></Label><Input type="password" value={pin} onChange={e => setPin(e.target.value)} disabled={loading} className="h-11 rounded-none" /></div>{error && <p className="border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}<Button type="submit" className="h-12 w-full rounded-none text-sm font-bold" disabled={loading}>{loading ? t('Loading...', 'جارٍ التحميل...') : t('View student report', 'عرض تقرير الطالب')} <ArrowRight className="ml-2 h-4 w-4" /></Button></form><div className="mt-4 border-t border-border pt-4 text-center"><Link to="/pin-generate" className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:underline"><KeyRound className="h-4 w-4" />{t('Generate a result PIN', 'توليد الرقم السري للنتيجة')}</Link></div></CardContent></Card></section>

      <section id="about" className="container grid gap-10 pb-24 lg:grid-cols-[0.8fr_1.2fr] lg:items-center"><div><p className="eyebrow text-primary">{t('Our madrasah', 'مدرستنا')}</p><h2 className="mt-3 max-w-lg font-display text-4xl font-extrabold leading-tight md:text-5xl">{t(settings['website.about_title'], settings['website.about_title_ar'])}</h2></div><div><p className="max-w-2xl text-lg leading-8 text-muted-foreground">{t(settings['website.about_text'], settings['website.about_text_ar'])}</p><div className="mt-8 grid grid-cols-2 gap-5 border-t border-border pt-6 sm:grid-cols-3"><div><p className="font-display text-3xl font-extrabold">{stats.students || '—'}</p><p className="mt-1 text-xs text-muted-foreground">{t('Learners', 'المتعلمون')}</p></div><div><p className="font-display text-3xl font-extrabold">{stats.subjects || '—'}</p><p className="mt-1 text-xs text-muted-foreground">{t('Subjects', 'المواد')}</p></div><div><p className="font-display text-3xl font-extrabold">100%</p><p className="mt-1 text-xs text-muted-foreground">{t('Digital records', 'سجلات رقمية')}</p></div></div></div></section>

      <section id="programs" className="bg-muted/45 py-24"><div className="container"><div className="mb-10 max-w-xl"><p className="eyebrow text-primary">{t('What matters here', 'ما يهمنا هنا')}</p><h2 className="mt-3 font-display text-4xl font-extrabold">{t('Built around every learner.', 'نضع كل متعلم في المقدمة.')}</h2></div><div className="grid gap-px overflow-hidden border border-border bg-border md:grid-cols-3">{featureItems.map(item => <div key={item.title[0]} className="bg-background p-7"><item.icon className="h-7 w-7 text-primary" strokeWidth={1.7} /><h3 className="mt-12 font-display text-xl font-extrabold">{t(item.title[0], item.title[1])}</h3><p className="mt-3 text-sm leading-7 text-muted-foreground">{t(item.text[0], item.text[1])}</p></div>)}</div></div></section>

      <section id="contact" className="container grid gap-10 py-24 md:grid-cols-[1fr_auto] md:items-end"><div><p className="eyebrow text-primary">{t('Visit or reach us', 'تواصل معنا')}</p><h2 className="mt-3 max-w-xl font-display text-4xl font-extrabold">{t('Your child’s next chapter starts with a conversation.', 'تبدأ رحلة طفلك القادمة بمحادثة.')}</h2><p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4 text-primary" />{settings['website.address']}</p><p className="mt-2 text-sm text-muted-foreground">{settings['website.email']}</p></div><div><a href={`mailto:${settings['website.email']}`} className="inline-flex h-12 items-center gap-2 bg-primary px-5 text-sm font-bold text-primary-foreground hover:bg-primary/90">{t('Contact the school', 'تواصل مع المدرسة')} <ArrowRight className="h-4 w-4" /></a></div></section>
    </PublicLayout>
  );
};

export default Index;