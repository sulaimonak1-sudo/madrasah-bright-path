import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PublicLayout } from '@/components/PublicLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, GraduationCap, BookOpen, Shield, ArrowRight } from 'lucide-react';
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
    // Load available terms
    (async () => {
      try {
        const { data } = await supabase.from('terms').select('id,name_en,name_ar,term_number').order('term_number', { ascending: false });
        if (data) {
          setTerms(data);
          if (data.length > 0) setTermId(data[0].id);
        }
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
    // Navigate to result page with parameters - ResultView will handle the lookup
    navigate(`/result?student=${encodeURIComponent(studentId.trim())}&term=${encodeURIComponent(termId)}&pin=${encodeURIComponent(pin.trim())}`);
  };

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="gradient-hero geometric-pattern py-16 md:py-24">
        <div className="container text-center">
          <div className="mx-auto max-w-2xl animate-fade-in">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-4 py-2 text-sm text-primary-foreground backdrop-blur-sm">
              <img src="/images/school-logo.png" alt="Al-Bari Logo" className="h-6 w-6 object-contain" />
              {t('Al-Bari Group of Schools', 'مجموعة مدارس البارئ')}
            </div>
            <h1 className="mb-4 text-3xl font-extrabold tracking-tight text-primary-foreground md:text-5xl">
              {t('Madrasah Result Portal', 'بوابة نتائج المدرسة')}
            </h1>
            <p className="text-lg text-primary-foreground/80">
              {t(
                'Check your academic results securely with your Student ID',
                'تحقق من نتائجك الأكاديمية بأمان باستخدام رقم الطالب'
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Result Checker Form */}
      <section className="container -mt-10 relative z-10 pb-16">
        <Card className="mx-auto max-w-md shadow-card-lg animate-fade-in">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-xl">
              <Search className="h-5 w-5 text-accent" />
              {t('Check Your Result', 'تحقق من نتيجتك')}
            </CardTitle>
            <CardDescription>
              {t('Enter your Student ID to view your result', 'أدخل رقم الطالب لعرض نتيجتك')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCheckResult} className="space-y-4">
              <div className="space-y-2">
                <Label>{t('Student ID', 'رقم الطالب')} *</Label>
                <Input
                  placeholder={t('e.g., ABS-001', 'مثال: ABS-001')}
                  value={studentId}
                  onChange={e => setStudentId(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label>{t('Term', 'الفصل الدراسي')} *</Label>
                <select 
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground" 
                  value={termId} 
                  onChange={e => setTermId(e.target.value)}
                  disabled={loading || terms.length === 0}
                >
                  <option value="">{t('Select term...', 'اختر الفصل...')}</option>
                  {terms.map(term => (
                    <option key={term.id} value={term.id}>
                      {`${t('Term', 'الفصل')} ${term.term_number} - ${term.name_en || term.name_ar}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>{t('PIN', 'الرقم السري')} {t('(optional)', '(اختياري)')}</Label>
                <Input
                  type="password"
                  placeholder={t('Enter your PIN', 'أدخل الرقم السري')}
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => navigate('/pin-generate')}
                  disabled={loading}
                >
                  {t('generate PIN?', 'هل تريد الحصول على رقم سري؟')}
                </Button>
              </div>

              {error && (
                <div className="p-2 bg-destructive/10 text-destructive text-sm rounded">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                <ArrowRight className="mr-2 h-4 w-4" />
                {loading ? t('Loading...', 'جارٍ التحميل...') : t('Check Result', 'عرض النتيجة')}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="mx-auto mt-12 grid max-w-3xl gap-6 md:grid-cols-3">
          {[
            { icon: Shield, title_en: 'Secure Access', title_ar: 'وصول آمن', desc_en: 'PIN-protected results', desc_ar: 'نتائج محمية بالرقم السري' },
            { icon: BookOpen, title_en: 'Comprehensive', title_ar: 'شامل', desc_en: 'Full term & cumulative results', desc_ar: 'نتائج الفصل والتراكمية' },
            { icon: GraduationCap, title_en: 'Bilingual', title_ar: 'ثنائي اللغة', desc_en: 'English & Arabic support', desc_ar: 'دعم الإنجليزية والعربية' },
          ].map((f, i) => (
            <div key={i} className="text-center animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">{t(f.title_en, f.title_ar)}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t(f.desc_en, f.desc_ar)}</p>
            </div>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
};

export default Index;
