import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PublicLayout } from '@/components/PublicLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { GRADE_CONFIG, calculateGrade } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { Printer, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

const ResultView = () => {
  const { t, bilingualText, isRTL } = useLanguage();

  const [studentUid, setStudentUid] = useState('');
  const [pin, setPin] = useState('');
  const [termId, setTermId] = useState('');
  const [terms, setTerms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [student, setStudent] = useState<any | null>(null);
  const [term, setTerm] = useState<any | null>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [scores, setScores] = useState<any[]>([]);

  useEffect(() => {
    // load available terms for selection
    (async () => {
      try {
        const { data, error } = await supabase.from('terms').select('id,name_en,name_ar,term_number').order('term_number', { ascending: false });
        if (error) throw error;
        setTerms(data || []);
        if (data && data.length > 0) setTermId(prev => prev || data[0].id);
      } catch (err) {
        // ignore - user can still enter a term id manually if needed
      }
    })();
  }, []);

  const handleLookup = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError('');
    if (!studentUid.trim() || !termId) return setError(t('Please enter Student ID and select term', 'الرجاء إدخال رقم الطالب واختيار الفصل'));
    setLoading(true);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('verify-result', { body: { student_uid: studentUid.trim(), pin: pin.trim(), term_id: termId } });
      if (fnErr) throw fnErr;
      if (!data?.ok) {
        setError(data?.error || 'Not found');
        setLoading(false);
        return;
      }
      setStudent(data.student);
      setTerm(data.term);
      setSubjects(data.subjects || []);
      setScores(data.scores || []);
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  // If no student loaded, show lookup form
  if (!student) {
    return (
      <PublicLayout>
        <div className="container py-8 flex justify-center">
          <Card className="max-w-md w-full">
            <CardContent>
              <form onSubmit={handleLookup} className="space-y-4">
                <input className="w-full p-2 border rounded" placeholder={t('Student ID', 'رقم الطالب')} value={studentUid} onChange={e => setStudentUid(e.target.value)} />
                <input className="w-full p-2 border rounded" placeholder={t('PIN (if provided)', 'الرقم السري (اختياري)')} value={pin} onChange={e => setPin(e.target.value)} />
                <label className="block text-sm text-muted-foreground">{t('Select Term', 'اختر الفصل')}</label>
                <select className="w-full p-2 border rounded" value={termId} onChange={e => setTermId(e.target.value)}>
                  <option value="">{t('Select term...', 'اختر الفصل...')}</option>
                  {terms.map(tm => (
                    <option key={tm.id} value={tm.id}>{`${tm.term_number} - ${bilingualText(tm.name_en, tm.name_ar)}`}</option>
                  ))}
                </select>
                {error && <div className="text-destructive text-sm">{error}</div>}
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1" disabled={loading}>{loading ? t('Loading...', 'جارٍ التحميل...') : t('View Result', 'عرض النتيجة')}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </PublicLayout>
    );
  }

  // Build subject rows from fetched data
  const isCumulative = term?.term_number === 3;
  const getScoreFor = (subjectId: string) => scores.find((s: any) => s.subject_id === subjectId);
  const subjectRows = subjects.map(sub => {
    const current = getScoreFor(sub.id);
    const total = current ? (Number(current.ca1 || 0) + Number(current.ca2 || 0) + Number(current.exam || 0)) : null;
    return {
      subject: sub,
      currentScore: current ? { ca1: current.ca1, ca2: current.ca2, exam: current.exam, total, grade: current.grade || calculateGrade(total || 0) } : null,
      cumulativeTotal: total || 0,
      cumulativeAvg: total || 0,
      finalGrade: current ? (current.grade || calculateGrade(total || 0)) : '—',
    };
  });

  const termAvg = subjectRows.length > 0 ? Math.round(subjectRows.reduce((s, r) => s + (r.currentScore?.total || 0), 0) / subjectRows.length) : 0;
  const cumulativeAvg = subjectRows.length > 0 ? Math.round(subjectRows.reduce((s, r) => s + (r.cumulativeAvg || 0), 0) / subjectRows.length) : 0;
  const promoted = cumulativeAvg >= 50;

  return (
    <PublicLayout>
      <div className="container py-8">
        <div className="mx-auto max-w-4xl">
          {/* Print button */}
          <div className="mb-4 flex justify-end no-print">
            <Button onClick={() => window.print()} variant="outline">
              <Printer className="mr-2 h-4 w-4" />
              {t('Print Result', 'طباعة النتيجة')}
            </Button>
          </div>

          <Card className="shadow-card-lg overflow-hidden">
            {/* Header */}
            <div className="gradient-hero geometric-pattern p-6 text-center text-primary-foreground">
              <div className="flex items-center justify-center gap-3 mb-2">
                <GraduationCap className="h-8 w-8" />
              </div>
              <h1 className="text-xl font-bold">{t('Al-Bari Group of Schools', 'مجموعة مدارس البارئ')}</h1>
              <p className="text-sm opacity-80">{t('Madrasah Result Portal', 'بوابة نتائج المدرسة')}</p>
              <p className="mt-2 text-lg font-semibold">
                {t('Academic Report', 'التقرير الأكاديمي')} — {t(term.name_en, term.name_ar)}
              </p>
            </div>

            {/* Student Info */}
            <div className="grid grid-cols-2 gap-4 p-6 border-b bg-muted/30 text-sm">
              <div><span className="text-muted-foreground">{t('Name:', 'الاسم:')}</span> <strong>{bilingualText(student.name_en, student.name_ar)}</strong></div>
              <div><span className="text-muted-foreground">{t('Student ID:', 'رقم الطالب:')}</span> <strong>{student.student_id}</strong></div>
              <div><span className="text-muted-foreground">{t('Class:', 'الصف:')}</span> <strong>{bilingualText(classLevel?.name_en, classLevel?.name_ar)} {classArm?.name}</strong></div>
              <div><span className="text-muted-foreground">{t('Gender:', 'الجنس:')}</span> <strong>{t(student.gender, student.gender === 'male' ? 'ذكر' : 'أنثى')}</strong></div>
            </div>

            {/* Scores Table */}
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">{t('Subject', 'المادة')}</TableHead>
                      {!isCumulative && (
                        <>
                          <TableHead className="text-center">{t('CA1', 'د.أ١')}</TableHead>
                          <TableHead className="text-center">{t('CA2', 'د.أ٢')}</TableHead>
                          <TableHead className="text-center">{t('Exam', 'الامتحان')}</TableHead>
                          <TableHead className="text-center font-semibold">{t('Total', 'المجموع')}</TableHead>
                          <TableHead className="text-center">{t('Grade', 'التقدير')}</TableHead>
                        </>
                      )}
                      {isCumulative && (
                        <>
                          <TableHead className="text-center">{t('T1', 'ف١')}</TableHead>
                          <TableHead className="text-center">{t('T2', 'ف٢')}</TableHead>
                          <TableHead className="text-center">{t('T3', 'ف٣')}</TableHead>
                          <TableHead className="text-center">{t('Cum. Total', 'المجموع التراكمي')}</TableHead>
                          <TableHead className="text-center">{t('Cum. Avg', 'المتوسط')}</TableHead>
                          <TableHead className="text-center">{t('Grade', 'التقدير')}</TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subjectRows.map(row => (
                      <TableRow key={row.subject.id}>
                        <TableCell className="font-medium">{bilingualText(row.subject.name_en, row.subject.name_ar)}</TableCell>
                        {!isCumulative && (
                          <>
                            <TableCell className="text-center">{row.currentScore?.ca1 ?? '—'}</TableCell>
                            <TableCell className="text-center">{row.currentScore?.ca2 ?? '—'}</TableCell>
                            <TableCell className="text-center">{row.currentScore?.exam ?? '—'}</TableCell>
                            <TableCell className="text-center font-bold">{row.currentScore?.total ?? '—'}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline">{row.currentScore?.grade ?? '—'}</Badge>
                            </TableCell>
                          </>
                        )}
                        {isCumulative && (
                          <>
                            <TableCell className="text-center">{row.t1Total ?? '—'}</TableCell>
                            <TableCell className="text-center">{row.t2Total ?? '—'}</TableCell>
                            <TableCell className="text-center">{row.t3Total ?? '—'}</TableCell>
                            <TableCell className="text-center font-bold">{row.cumulativeTotal}</TableCell>
                            <TableCell className="text-center font-bold">{row.cumulativeAvg}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline">{row.finalGrade}</Badge>
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>

            {/* Footer */}
            <div className="border-t p-6 space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>{t('Term Average:', 'متوسط الفصل:')} <strong>{termAvg}%</strong></div>
                {isCumulative && <div>{t('Cumulative Average:', 'المتوسط التراكمي:')} <strong>{cumulativeAvg}%</strong></div>}
              </div>
              {isCumulative && (
                <div className="rounded-lg bg-muted p-4 text-center">
                  <p className="text-lg font-bold">
                    {t('Promotion Status:', 'حالة الترقية:')}{' '}
                    <span className={cn(promoted ? 'text-success' : 'text-destructive')}>
                      {promoted ? t('PROMOTED', 'ناجح') : t('RETAINED', 'باقٍ')}
                    </span>
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 pt-4 text-sm">
                <div>
                  <p className="text-muted-foreground">{t("Teacher's Remark:", 'ملاحظة المعلم:')}</p>
                  <div className="mt-1 h-8 border-b border-dashed" />
                </div>
                <div>
                  <p className="text-muted-foreground">{t("Head Teacher's Remark:", 'ملاحظة مدير المدرسة:')}</p>
                  <div className="mt-1 h-8 border-b border-dashed" />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PublicLayout>
  );
};

export default ResultView;
