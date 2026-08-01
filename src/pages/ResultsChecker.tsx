import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, KeyRound, Search, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PublicLayout } from '@/components/PublicLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

type Term = { id: string; name_en: string | null; name_ar: string | null; term_number: number };

const ResultsChecker = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState('');
  const [pin, setPin] = useState('');
  const [termId, setTermId] = useState('');
  const [terms, setTerms] = useState<Term[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from('terms').select('id,name_en,name_ar,term_number').order('term_number', { ascending: false }).then(({ data }) => {
      const availableTerms = (data || []) as Term[];
      setTerms(availableTerms);
      if (availableTerms[0]) setTermId(availableTerms[0].id);
    });
  }, []);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!studentId.trim() || !termId) {
      setError(t('Please enter your Student ID and select a term.', 'الرجاء إدخال رقم الطالب واختيار الفصل الدراسي.'));
      return;
    }
    setLoading(true);
    navigate(`/result?student=${encodeURIComponent(studentId.trim())}&term=${encodeURIComponent(termId)}&pin=${encodeURIComponent(pin.trim())}`);
  };

  return (
    <PublicLayout>
      <main className="relative overflow-hidden bg-primary py-12 text-primary-foreground md:py-16">
        <div className="geometric-pattern absolute inset-0 opacity-10" />
          <div className="container relative grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <img src="/images/school-logo.png" alt="Al-Bari Group Of Schools" className="h-14 w-14 rounded-xl bg-white/10 p-1 object-contain" />
            <p className="eyebrow mt-8 text-accent">{t('Student services', 'خدمات الطلاب')}</p>
            <h1 className="mt-4 max-w-xl font-display text-4xl font-extrabold leading-[1.05] md:text-6xl">{t('Check your result', 'تحقق من نتيجتك')}</h1>
            <p className="mt-6 max-w-lg text-base leading-8 text-primary-foreground/75">{t('Use your student details to securely access a term report prepared by the Institute for Islamic Sciences.', 'استخدم بيانات الطالب للوصول الآمن إلى التقرير الدراسي الذي أعده معهد العلوم الإسلامية.')}</p>
            <div className="mt-8 flex items-center gap-3 text-sm font-semibold text-primary-foreground"><ShieldCheck className="h-5 w-5 text-accent" />{t('Private and secure access', 'وصول خاص وآمن')}</div>
          </div>
            <Card className="rounded-2xl border-border/70 bg-card shadow-card-lg">
            <CardHeader><div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Search className="h-5 w-5" /></div><CardTitle className="font-display text-2xl font-extrabold">{t('Enter your details', 'أدخل بياناتك')}</CardTitle><CardDescription>{t('View your academic performance securely.', 'اعرض أدائك الأكاديمي بأمان.')}</CardDescription></CardHeader>
            <CardContent><form onSubmit={handleSubmit} className="space-y-5"><div className="space-y-2"><Label>{t('Student ID', 'رقم الطالب')}</Label><Input placeholder="e.g. ABS-001" value={studentId} onChange={event => setStudentId(event.target.value)} disabled={loading} className="h-12 rounded-xl" /></div><div className="space-y-2"><Label>{t('Academic term', 'الفصل الدراسي')}</Label><Select value={termId} onValueChange={setTermId} disabled={loading}><SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder={t('Select term...', 'اختر الفصل...')} /></SelectTrigger><SelectContent>{terms.map(term => <SelectItem key={term.id} value={term.id}>{`${t('Term', 'الفصل')} ${term.term_number} - ${term.name_en || term.name_ar}`}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>{t('PIN', 'الرقم السري')} <span className="font-normal text-muted-foreground">{t('(optional)', '(اختياري)')}</span></Label><Input type="password" value={pin} onChange={event => setPin(event.target.value)} disabled={loading} className="h-12 rounded-xl" /></div>{error && <p className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}<Button type="submit" className="h-12 w-full text-sm font-bold" disabled={loading}>{loading ? t('Loading...', 'جارٍ التحميل...') : t('View student report', 'عرض تقرير الطالب')} <ArrowRight className="ml-2 h-4 w-4" /></Button></form><div className="mt-5 border-t border-border pt-5 text-center"><Button variant="ghost" size="sm" onClick={() => navigate('/pin-generate')} className="gap-2 text-xs font-bold text-primary"><KeyRound className="h-4 w-4" />{t('Generate a result PIN', 'توليد الرقم السري للنتيجة')}</Button></div></CardContent>
          </Card>
        </div>
      </main>
    </PublicLayout>
  );
};

export default ResultsChecker;