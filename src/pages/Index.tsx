import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PublicLayout } from '@/components/PublicLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, GraduationCap, BookOpen, Shield, ArrowRight, Users, Star, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState('');
  const [pin, setPin] = useState('');
  const [termId, setTermId] = useState('');
  const [loading, setLoading] = useState(false);
  const [terms, setTerms] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.from('terms').select('id,name_en,name_ar,term_number').order('term_number', { ascending: false });
        if (data) {
          setTerms(data);
          if (data.length > 0) setTermId(data[0].id);
        }
      } catch (err) {

        // ignore
      }})();
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

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/70 py-20 md:py-28">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 border-2 border-primary-foreground rounded-full" />
          <div className="absolute bottom-10 right-10 w-48 h-48 border-2 border-primary-foreground rounded-full" />
          <div className="absolute top-1/2 left-1/3 w-20 h-20 border border-primary-foreground rounded-full" />
        </div>
        
        <div className="container relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-3 rounded-full bg-primary-foreground/15 px-5 py-2 backdrop-blur-sm">
              
              <span className="text-sm font-semibold text-primary-foreground tracking-wide uppercase">
                {t('Al-Bari Group of Schools', 'مجموعة مدارس البارئ')}
              </span>
            </div>
            <h1 className="mb-5 text-4xl font-extrabold tracking-tight text-primary-foreground md:text-6xl leading-tight">
              {t('Madrasah Result Portal', 'بوابة نتائج المدرسة')}
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/85 max-w-2xl mx-auto leading-relaxed">
              {t(
                'Access your academic results securely and instantly. Enter your Student ID below to get started.',
                'تحقق من نتائجك الأكاديمية بأمان وفوراً. أدخل رقم الطالب أدناه للبدء.'
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Result Checker Form */}
      <section className="container relative z-10 -mt-12 pb-8">
        <Card className="mx-auto max-w-lg shadow-card-lg border-0 bg-card">
          <CardHeader className="text-center pb-2">
            <CardTitle className="flex items-center justify-center gap-2 text-xl">
              <Search className="h-5 w-5 text-primary" />
              {t('Check Your Result', 'تحقق من نتيجتك')}
            </CardTitle>
            <CardDescription>
              {t('Enter your Student ID to view your academic report', 'أدخل رقم الطالب لعرض تقريرك الأكاديمي')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCheckResult} className="space-y-4">
              <div className="space-y-2">
                <Label className="font-medium">{t('Student ID', 'رقم الطالب')} *</Label>
                <Input
                  placeholder={t('e.g., ABS-001', 'مثال: ABS-001')}
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  disabled={loading}
                  className="h-11" />

              </div>

              <div className="space-y-2">
                <Label className="font-medium">{t('Term', 'الفصل الدراسي')} *</Label>
                <select
                  className="w-full px-3 py-2.5 border border-input rounded-md bg-background text-foreground h-11"
                  value={termId}
                  onChange={(e) => setTermId(e.target.value)}
                  disabled={loading || terms.length === 0}>

                  <option value="">{t('Select term...', 'اختر الفصل...')}</option>
                  {terms.map((term) =>
                  <option key={term.id} value={term.id}>
                      {`${t('Term', 'الفصل')} ${term.term_number} - ${term.name_en || term.name_ar}`}
                    </option>
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <Label className="font-medium">{t('PIN', 'الرقم السري')} <span className="text-muted-foreground font-normal">{t('(optional)', '(اختياري)')}</span></Label>
                <Input
                  type="password"
                  placeholder={t('Enter your PIN', 'أدخل الرقم السري')}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  disabled={loading}
                  className="h-11" />

              </div>

              {error &&
              <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20">
                  {error}
                </div>
              }

              <Button type="submit" className="w-full h-12 text-base font-semibold" size="lg" disabled={loading}>
                <ArrowRight className="mr-2 h-5 w-5" />
                {loading ? t('Loading...', 'جارٍ التحميل...') : t('Check Result', 'عرض النتيجة')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>

      {/* Features Section */}
      <section className="container py-16">
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
          {[
          { icon: Shield, title_en: 'Secure & Private', title_ar: 'آمن وخاص', desc_en: 'PIN-protected results ensure only authorized access to student records.', desc_ar: 'نتائج محمية بالرقم السري تضمن الوصول المصرح به فقط.' },
          { icon: BookOpen, title_en: 'Comprehensive Reports', title_ar: 'تقارير شاملة', desc_en: 'View full term results with CA scores, exam marks, and overall grades.', desc_ar: 'عرض نتائج الفصل كاملة مع درجات الأعمال والامتحانات.' },
          { icon: GraduationCap, title_en: 'Bilingual Support', title_ar: 'دعم ثنائي اللغة', desc_en: 'Full English & Arabic support for all students and parents.', desc_ar: 'دعم كامل للإنجليزية والعربية لجميع الطلاب وأولياء الأمور.' }].
          map((f, i) =>
          <Card key={i} className="text-center border-0 shadow-card hover:shadow-card-lg transition-shadow duration-300">
              <CardContent className="pt-8 pb-6 px-6">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <f.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-bold text-foreground text-lg mb-2">{t(f.title_en, f.title_ar)}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t(f.desc_en, f.desc_ar)}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Quick Stats / Trust Bar */}
      <section className="bg-muted/50 py-12">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
            { icon: Users, value: '500+', label_en: 'Students', label_ar: 'طالب' },
            { icon: BookOpen, value: '20+', label_en: 'Subjects', label_ar: 'مادة' },
            { icon: Star, value: '100%', label_en: 'Digital Records', label_ar: 'سجلات رقمية' },
            { icon: CheckCircle, value: '24/7', label_en: 'Access', label_ar: 'وصول' }].
            map((s, i) =>
            <div key={i} className="flex flex-col items-center gap-2">
                <s.icon className="h-6 w-6 text-primary" />
                <span className="text-2xl font-bold text-foreground">{s.value}</span>
                <span className="text-sm text-muted-foreground">{t(s.label_en, s.label_ar)}</span>
              </div>
            )}
          </div>
        </div>
      </section>
    </PublicLayout>);

};

export default Index;