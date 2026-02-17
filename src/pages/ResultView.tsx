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
import QRCode from 'qrcode';
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
  const [classLevel, setClassLevel] = useState<any | null>(null);
  const [classArm, setClassArm] = useState<any | null>(null);
  const [sessionName, setSessionName] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

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
      // fetch session name (for header display)
      try {
        const sessId = data?.term?.session_id;
        if (sessId) {
          const { data: sess } = await supabase.from('sessions').select('name_en').eq('id', sessId).maybeSingle();
          setSessionName(sess?.name_en || null);
        }
      } catch (err) {
        // ignore
      }
      setSubjects(data.subjects || []);
      setScores(data.scores || []);
      // generate QR for verification URL (student uid + term id)
      try {
        const verifyUrl = `${window.location.origin}/verify-result?student_uid=${encodeURIComponent(data.student.student_uid)}&term_id=${encodeURIComponent(data.term.id)}`;
        const qr = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 240 });
        setQrDataUrl(qr);
      } catch (err) {
        setQrDataUrl(null);
      }
      // fetch class level and arm for display
      try {
        const stud = data.student as any;
        if (stud?.class_level_id) {
          const { data: cl } = await supabase.from('class_levels').select('*').eq('id', stud.class_level_id).maybeSingle();
          setClassLevel(cl || null);
        }
        if (stud?.class_arm_id) {
          const { data: arm } = await supabase.from('class_arms').select('*').eq('id', stud.class_arm_id).maybeSingle();
          setClassArm(arm || null);
        }
      } catch (err) {
        // ignore
      }
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
            {/* Header: English left, Arabic right */}
            {/* Polished centered header */}
            <div className="p-6">
              <div className="max-w-4xl mx-auto text-center">
                <div className="flex items-center justify-center">
                  <div className="rounded-full bg-emerald-900/10 border border-emerald-900 p-3 flex items-center justify-center" style={{width:72, height:72}}>
                    <GraduationCap className="h-8 w-8 text-emerald-900" />
                  </div>
                </div>
                <h1 className="text-3xl font-extrabold tracking-wide uppercase mt-4 text-emerald-900">Al-Bari Group of Schools</h1>
                <p className="text-lg mt-1 text-emerald-800">Madrasah Section</p>
                <div className="my-2 border-t border-emerald-200" />
                <p className="text-sm mt-2 text-slate-600">123 Islamic Road, Lagos | Tel: 08012345678 | Email: info@albarischools.com</p>
                <h2 className="text-xl font-semibold mt-4">STUDENT ACADEMIC REPORT</h2>
                <p className="mt-2 text-sm text-slate-600">{sessionName ? `Session: ${sessionName}` : ''} {term?.name_en ? ` | Term: ${term?.name_en}` : ''}</p>
              </div>
            </div>

            {/* Student Info block with photo */}
            <div className="p-6 border-b bg-white text-sm">
              <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                <div className="md:col-span-1 flex justify-center">
                  <div className="w-28 h-28 bg-slate-100 border rounded overflow-hidden">
                    {/* Placeholder for student photo if available */}
                    <img src={student.photo_url || '/'} onError={(e)=>{(e.target as HTMLImageElement).style.display='none'}} alt="photo" className="w-full h-full object-cover" />
                  </div>
                </div>
                <div className="md:col-span-3 grid grid-cols-2 gap-x-6">
                  <div className="space-y-2">
                    <div>
                      <span className="text-muted-foreground">Student Name:</span>
                      <div className="font-semibold">{student.name_en}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Student ID:</span>
                      <div className="font-semibold">{student.student_id}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Class:</span>
                      <div className="font-semibold">{classLevel?.name_en || '—'} {classArm?.name ? `- ${classArm?.name}` : ''}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Gender:</span>
                      <div className="font-semibold">{student.gender === 'male' ? 'Male' : 'Female'}</div>
                    </div>
                  </div>

                  <div className="space-y-2 text-right" dir="rtl">
                    <div>
                      <div className="font-semibold">{student.name_ar || '—'}</div>
                      <span className="text-muted-foreground">:الاسم</span>
                    </div>
                    <div>
                      <div className="font-semibold">{student.student_id}</div>
                      <span className="text-muted-foreground">:رقم الطالب</span>
                    </div>
                    <div>
                      <div className="font-semibold">{classLevel?.name_ar || '—'} {classArm?.name ? `- ${classArm?.name}` : ''}</div>
                      <span className="text-muted-foreground">:الصف</span>
                    </div>
                    <div>
                      <div className="font-semibold">{student.gender === 'male' ? 'ذكر' : 'أنثى'}</div>
                      <span className="text-muted-foreground">:الجنس</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Scores Table */}
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-emerald-900 text-white">
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
                        <TableCell className="font-medium align-top">
                          <div className="flex justify-between items-start">
                            <div className="text-sm">{row.subject.name_en}</div>
                            <div className="text-sm text-right" dir="rtl">{row.subject.name_ar}</div>
                          </div>
                        </TableCell>
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
              <div className="border-t p-6 space-y-6">
                <div className="flex justify-between items-center text-sm">
                  <div className="">{t('Term Average:', 'متوسط الفصل:')} <strong>{termAvg}%</strong></div>
                  {isCumulative && <div className="">{t('Cumulative Average:', 'المتوسط التراكمي:')} <strong>{cumulativeAvg}%</strong></div>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="font-semibold">{t("Class Teacher's Remark:", "ملاحظة معلم الفصل:")}</p>
                    <p className="mt-2 text-sm text-slate-700">{student?.teacher_remark || ''}</p>
                    <p className="mt-3 text-sm text-right" dir="rtl">{''}</p>
                  </div>
                  <div>
                    <p className="font-semibold">{t("Head Teacher's Remark:", 'ملاحظة مدير المدرسة:')}</p>
                    <p className="mt-2 text-sm text-slate-700">{''}</p>
                    <div className="mt-6 grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="border-b h-6" />
                        <div className="text-muted-foreground">Class Teacher</div>
                      </div>
                      <div>
                        <div className="border-b h-6" />
                        <div className="text-muted-foreground">Head Teacher</div>
                      </div>
                      <div>
                        <div className="border-b h-6" />
                        <div className="text-muted-foreground">Date</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-slate-600">Result generated via Al-Bari Madrasah Portal</div>
                  <div className="w-24 h-24 border grid place-items-center">
                    {qrDataUrl ? <img src={qrDataUrl} alt="verify-qr" className="w-20 h-20 object-contain" /> : <span>QR</span>}
                  </div>
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
