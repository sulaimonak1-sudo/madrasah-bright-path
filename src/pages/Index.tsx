import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PublicLayout } from '@/components/PublicLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, GraduationCap, BookOpen, Shield, ArrowRight, Users, Star, CheckCircle, KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { HeroCarousel } from '@/components/landing/HeroCarousel';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { ScrollToTop } from '@/components/ScrollToTop';

const Index = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState('');
  const [pin, setPin] = useState('');
  const [termId, setTermId] = useState('');
  const [loading, setLoading] = useState(false);
  const [terms, setTerms] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [liveStats, setLiveStats] = useState({ students: 0, subjects: 0 });

  useEffect(() => {
    (async () => {
      try {
        const [termsRes, studentsRes, subjectsRes] = await Promise.all([
          supabase.from('terms').select('id,name_en,name_ar,term_number').order('term_number', { ascending: false }),
          supabase.from('students').select('id', { count: 'exact', head: true }),
          supabase.from('subjects').select('id', { count: 'exact', head: true }),
        ]);
        if (termsRes.data) {
          setTerms(termsRes.data);
          if (termsRes.data.length > 0) setTermId(termsRes.data[0].id);
        }
        setLiveStats({
          students: Number(studentsRes.count || 0),
          subjects: Number(subjectsRes.count || 0),
        });
      } catch (err) {
        // ignore
      }
    })();
  }, []);

  const handleCheckResult = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!studentId.trim()) {
      setError(t('Please enter your Student ID', 'الرجاء إدخال رقم الطالب'));
      return;
    }
    if (!termId) {
      setError(t('Please select a term', 'الرجاء اختيار الفصل'));
      return;
    }
    setLoading(true);
    navigate(`/result?student=${encodeURIComponent(studentId.trim())}&term=${encodeURIComponent(termId)}&pin=${encodeURIComponent(pin.trim())}`);
  };

  const features = [
    { icon: Shield, title_en: 'Secure & Private', title_ar: 'آمن وخاص', desc_en: 'PIN-protected results ensure only authorized access to student records.', desc_ar: 'نتائج محمية بالرقم السري تضمن الوصول المصرح به فقط.' },
    { icon: BookOpen, title_en: 'Comprehensive Reports', title_ar: 'تقارير شاملة', desc_en: 'View full term results with CA scores, exam marks, and overall grades.', desc_ar: 'عرض نتائج الفصل كاملة مع درجات الأعمال والامتحانات.' },
    { icon: GraduationCap, title_en: 'Bilingual Support', title_ar: 'دعم ثنائي اللغة', desc_en: 'Full English & Arabic support for all students and parents.', desc_ar: 'دعم كامل للإنجليزية والعربية لجميع الطلاب وأولياء الأمور.' },
  ];

  const stats = [
    { icon: Users, value: liveStats.students > 0 ? `${liveStats.students}+` : '—', label_en: 'Students', label_ar: 'طالب' },
    { icon: BookOpen, value: liveStats.subjects > 0 ? `${liveStats.subjects}+` : '—', label_en: 'Subjects', label_ar: 'مادة' },
    { icon: Star, value: '100%', label_en: 'Digital Records', label_ar: 'سجلات رقمية' },
    { icon: CheckCircle, value: '24/7', label_en: 'Access', label_ar: 'وصول' },
  ];

  return (
    <PublicLayout>
      <ScrollToTop />

      {/* Hero Section */}
      <section className="relative min-h-[460px] overflow-hidden bg-[hsl(var(--sidebar-background))] py-20 md:min-h-[540px] md:py-28">
        <div className="absolute inset-0">
          <HeroCarousel />
        </div>
        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl text-left"
          >
            <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-primary-foreground/15 bg-primary-foreground/10 px-4 py-2 backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-accent" />
              <span className="text-[11px] font-bold text-primary-foreground tracking-[0.16em] uppercase">
                {t('Al-Bari Group of Schools', 'مجموعة مدارس البارئ')}
              </span>
            </div>
            <h1 className="mb-5 max-w-2xl font-display text-4xl font-extrabold tracking-tight text-primary-foreground md:text-6xl leading-[1.05]">
              {t('Madrasah', 'بوابة')}{' '}
              <span className="text-gradient-gold">{t('Result Portal', 'نتائج المدرسة')}</span>
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-primary-foreground/75 md:text-lg">
              {t(
                'Access your academic results securely and instantly. Enter your Student ID below to get started.',
                'اطّلع على نتائجك الدراسية بأمان وفورًا. أدخل رقم الطالب أدناه للبدء.'
              )}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Result Checker Form */}
      <section className="container relative z-10 -mt-20 pb-10 md:-mt-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="ml-auto max-w-xl border border-border/70 bg-card shadow-card-lg">
            <CardHeader className="pb-3">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                <Search className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="font-display text-2xl font-extrabold tracking-tight">
                {t('Check your result', 'التحقق من النتيجة')}
              </CardTitle>
              <CardDescription>
                {t('Enter your Student ID to view your academic report', 'أدخل رقم الطالب لعرض تقريرك الدراسي')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCheckResult} className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-medium">{t('Student ID', 'رقم الطالب')} *</Label>
                  <Input placeholder={t('e.g., ABS-001', 'مثال: ABS-001')} value={studentId} onChange={(e) => setStudentId(e.target.value)} disabled={loading} className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label className="font-medium">{t('Term', 'الفصل الدراسي')} *</Label>
                  <select className="w-full px-3 py-2.5 border border-input rounded-md bg-background text-foreground h-11" value={termId} onChange={(e) => setTermId(e.target.value)} disabled={loading || terms.length === 0}>
                    <option value="">{t('Select term...', 'اختر الفصل...')}</option>
                    {terms.map((term) => (
                      <option key={term.id} value={term.id}>
                        {`${t('Term', 'الفصل')} ${term.term_number} - ${term.name_en || term.name_ar}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="font-medium">{t('PIN', 'الرقم السري')} <span className="text-muted-foreground font-normal">{t('(optional)', '(اختياري)')}</span></Label>
                  <Input type="password" placeholder={t('Enter your PIN', 'أدخل الرقم السري')} value={pin} onChange={(e) => setPin(e.target.value)} disabled={loading} className="h-11" />
                </div>
                {error && (
                  <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20">{error}</div>
                )}
                <Button type="submit" className="w-full h-12 text-base font-semibold" size="lg" disabled={loading}>
                  <ArrowRight className="mr-2 h-5 w-5" />
                  {loading ? t('Loading...', 'جارٍ التحميل...') : t('Check Result', 'عرض النتيجة')}
                </Button>
              </form>
              <div className="mt-4 pt-4 border-t border-border text-center">
                <Button variant="outline" size="sm" onClick={() => navigate('/pin-generate')} className="gap-2">
                  <KeyRound className="h-4 w-4" />
                  {t('Generate Result PIN', 'توليد الرقم السري للنتيجة')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* How It Works */}
      <HowItWorks />

      {/* Features Section */}
      <section className="bg-muted/30 py-16">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-foreground md:text-3xl">
              {t('Why Use Our Portal?', 'لماذا تستخدم بوابتنا؟')}
            </h2>
            <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
              {t('A modern, secure, and bilingual platform for accessing student academic results.',
                'منصة حديثة وآمنة وثنائية اللغة للوصول إلى نتائج الطلاب الأكاديمية.')}
            </p>
          </div>
          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
              >
                <Card className="text-center border-0 shadow-card hover:shadow-card-lg transition-shadow duration-300 h-full">
                  <CardContent className="pt-8 pb-6 px-6">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                      <f.icon className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="font-bold text-foreground text-lg mb-2">{t(f.title_en, f.title_ar)}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{t(f.desc_en, f.desc_ar)}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-12">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="flex flex-col items-center gap-2"
              >
                <s.icon className="h-6 w-6 text-primary" />
                <span className="text-2xl font-bold text-foreground">{s.value}</span>
                <span className="text-sm text-muted-foreground">{t(s.label_en, s.label_ar)}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default Index;
