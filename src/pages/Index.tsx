import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PublicLayout } from '@/components/PublicLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { mockSessions, mockTerms } from '@/data/mockData';
import { Search, GraduationCap, BookOpen, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [termId, setTermId] = useState('');
  const [pin, setPin] = useState('');

  const handleCheckResult = (e: React.FormEvent) => {
    e.preventDefault();
    if (studentId && sessionId && termId && pin) {
      navigate(`/result?student=${studentId}&session=${sessionId}&term=${termId}&pin=${pin}`);
    }
  };

  const selectedSessionTerms = mockTerms.filter(t => t.session_id === sessionId);

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="gradient-hero geometric-pattern py-16 md:py-24">
        <div className="container text-center">
          <div className="mx-auto max-w-2xl animate-fade-in">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-4 py-2 text-sm text-primary-foreground backdrop-blur-sm">
              <GraduationCap className="h-4 w-4" />
              {t('Al-Bari Group of Schools', 'مجموعة مدارس البارئ')}
            </div>
            <h1 className="mb-4 text-3xl font-extrabold tracking-tight text-primary-foreground md:text-5xl">
              {t('Madrasah Result Portal', 'بوابة نتائج المدرسة')}
            </h1>
            <p className="text-lg text-primary-foreground/80">
              {t(
                'Check your academic results securely with your Student ID and PIN',
                'تحقق من نتائجك الأكاديمية بأمان باستخدام رقم الطالب والرقم السري'
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Result Checker Form */}
      <section className="container -mt-10 relative z-10 pb-16">
        <Card className="mx-auto max-w-lg shadow-card-lg animate-fade-in">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-xl">
              <Search className="h-5 w-5 text-accent" />
              {t('Check Your Result', 'تحقق من نتيجتك')}
            </CardTitle>
            <CardDescription>
              {t('Enter your details below to view your result', 'أدخل بياناتك أدناه لعرض نتيجتك')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCheckResult} className="space-y-4">
              <div className="space-y-2">
                <Label>{t('Student ID', 'رقم الطالب')}</Label>
                <Input
                  placeholder={t('e.g., ABS-001', 'مثال: ABS-001')}
                  value={studentId}
                  onChange={e => setStudentId(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>{t('Session', 'السنة الدراسية')}</Label>
                <Select value={sessionId} onValueChange={setSessionId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('Select session', 'اختر السنة الدراسية')} />
                  </SelectTrigger>
                  <SelectContent>
                    {mockSessions.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('Term', 'الفصل الدراسي')}</Label>
                <Select value={termId} onValueChange={setTermId} disabled={!sessionId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('Select term', 'اختر الفصل')} />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedSessionTerms.map(term => (
                      <SelectItem key={term.id} value={term.id}>{t(term.name_en, term.name_ar)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('PIN', 'الرقم السري')}</Label>
                <Input
                  type="password"
                  placeholder={t('Enter your PIN', 'أدخل الرقم السري')}
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" size="lg">
                <Search className="mr-2 h-4 w-4" />
                {t('Check Result', 'عرض النتيجة')}
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
