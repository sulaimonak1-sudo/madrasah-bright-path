import { useState, useEffect } from 'react';
import '../result-print.css';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { PublicLayout } from '@/components/PublicLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { GRADE_CONFIG, calculateGrade } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { Printer, GraduationCap, ArrowLeft } from 'lucide-react';
import QRCode from 'qrcode';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import html2pdf from 'html2pdf.js';

const ResultView = () => {
  const { t, bilingualText, isRTL } = useLanguage();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [studentUid, setStudentUid] = useState('');
  const [pin, setPin] = useState('');
  const [termId, setTermId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [student, setStudent] = useState<any | null>(null);
  const [term, setTerm] = useState<any | null>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [scores, setScores] = useState<any[]>([]);
  const [classLevel, setClassLevel] = useState<any | null>(null);
  const [classArm, setClassArm] = useState<any | null>(null);
  const [sessionName, setSessionName] = useState<string | null>(null);
  const [report, setReport] = useState<any | null>(null);
  const [tieredRemarks, setTieredRemarks] = useState<any[]>([]);
  const [teacherProfile, setTeacherProfile] = useState<any | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [includeQr, setIncludeQr] = useState(true);
  const [remarksEnabled, setRemarksEnabled] = useState(true);
  const [defaultTeacherRemark, setDefaultTeacherRemark] = useState('');
  const [defaultHeadRemark, setDefaultHeadRemark] = useState('');
  const [printDateAuto, setPrintDateAuto] = useState(true);
  const [printDate, setPrintDate] = useState<string | null>(null);

  // Try to load result from query params on mount
  useEffect(() => {
    const student = searchParams.get('student');
    const term = searchParams.get('term');
    const pin_param = searchParams.get('pin');
    const session = searchParams.get('session');

    if (student && term) {
      setStudentUid(student);
      setTermId(term);
      setPin(pin_param || '');
      // Auto-fetch result
      performLookup(student, pin_param || '', term);
    }
  }, []);

  // load report-related settings
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.from('school_settings').select('*');
        if (!mounted) return;
        const map: Record<string, string> = {};
        (data || []).forEach((r: any) => { map[r.key] = r.value; });
        setIncludeQr(map['report.include_qr'] !== 'false');
        setRemarksEnabled(map['report.remarks_enabled'] !== 'false');
        setPrintDateAuto(map['report.print_date_auto'] !== 'false');
        setDefaultTeacherRemark(map['report.default_teacher_remark'] || '');
        setDefaultHeadRemark(map['report.default_head_remark'] || '');
      } catch (err) {
        // ignore
      }
    })();
    const onBeforePrint = () => setPrintDate(new Date().toLocaleDateString());
    const onAfterPrint = () => setPrintDate(null);
    window.addEventListener('beforeprint', onBeforePrint);
    window.addEventListener('afterprint', onAfterPrint);
    return () => { mounted = false; window.removeEventListener('beforeprint', onBeforePrint); window.removeEventListener('afterprint', onAfterPrint); };
  }, []);

  const performLookup = async (uid: string, pinValue: string, tid: string) => {
    setError('');
    if (!uid.trim() || !tid) {
      setError(t('Please enter Student ID and select term', 'الرجاء إدخال رقم الطالب واختيار الفصل'));
      return;
    }
    setLoading(true);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('verify-result', {
        body: { student_uid: uid.trim(), pin: pinValue.trim(), term_id: tid }
      });
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
      setReport(data.report || null);

      // fetch session name
      try {
        const sessId = data?.term?.session_id;
        if (sessId) {
          const { data: sess } = await supabase.from('sessions').select('name').eq('id', sessId).maybeSingle();
          setSessionName(sess?.name || null);
        }
      } catch (err) {
        // ignore
      }

      // generate QR for verification URL
      try {
        const verifyUrl = `${window.location.origin}/#/result?student=${encodeURIComponent(data.student.student_uid)}&term=${encodeURIComponent(data.term.id)}`;
        const qr = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 240 });
        setQrDataUrl(qr);
      } catch (err) {
        setQrDataUrl(null);
      }

      // fetch class level and arm
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

  const handleLookup = async (e?: React.FormEvent) => {
    e?.preventDefault();
    performLookup(studentUid, pin, termId);
  };

  // If no student loaded, show lookup form
  if (!student) {
    return (
      <PublicLayout>
        <div className="container py-8 flex justify-center">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <GraduationCap className="h-5 w-5 text-accent" />
                {t('Check Your Result', 'تحقق من نتيجتك')}
              </CardTitle>
              <CardDescription>
                {t('Enter your Student ID and PIN', 'أدخل رقم الطالب والرقم السري')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLookup} className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('Student ID', 'رقم الطالب')}</Label>
                  <Input
                    placeholder={t('e.g., ABS-001', 'مثال: ABS-001')}
                    value={studentUid}
                    onChange={e => setStudentUid(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('PIN', 'الرقم السري')}</Label>
                  <Input
                    type="password"
                    placeholder={t('Enter your PIN', 'أدخل الرقم السري')}
                    value={pin}
                    onChange={e => setPin(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('Term', 'الفصل الدراسي')}</Label>
                  <Input
                    placeholder={t('e.g., Term 1 2024/2025', 'مثال: الفصل 1 2024/2025')}
                    value={termId}
                    onChange={e => setTermId(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('Ask your teacher if unsure', 'اطلب من معلمك إذا كنت غير متأكد')}
                  </p>
                </div>
                {error && <div className="text-destructive text-sm p-2 bg-destructive/10 rounded">{error}</div>}
                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? t('Loading...', 'جارٍ التحميل...') : t('View Result', 'عرض النتيجة')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/')}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t('Back to Home', 'العودة للصفحة الرئيسية')}
                </Button>
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

  const downloadResultPDF = () => {
    const element = document.querySelector('.result-printable-content');
    if (!element) return;
    const options = {
      margin: [10,10,10,10] as [number, number, number, number],
      filename: `result-${student?.student_uid || 'report'}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'portrait' as const, unit: 'mm' as const, format: 'a4' as const }
    };

    // set print date in DOM then generate PDF
    setPrintDate(new Date().toLocaleDateString());
    setTimeout(() => {
      html2pdf().set(options).from(element as HTMLElement).save();
      setPrintDate(null);
    }, 100);
  };

  return (
    <PublicLayout>
      <div className="container py-8">
          <div className="mx-auto max-w-4xl min-h-screen bg-white print:mx-0 print:max-w-[190mm]">
          {/* Print button */}
          <div className="mb-4 flex justify-end no-print">
            <Button onClick={downloadResultPDF} variant="outline">
              <Printer className="mr-2 h-4 w-4" />
              {t('Download Result', 'تحميل النتيجة')}
            </Button>
          </div>

          {/* Printable Report */}
          <div className="bg-white p-6 print:p-4 result-printable-content">
            {/* HEADER */}
            <div className="text-center pb-6 border-b-2 border-gray-300 mb-6">
                <div className="flex justify-center mb-3">
                <div className="w-20 h-20 flex items-center justify-center overflow-hidden">
                  <img 
                    src="/images/school-logo.png" 
                    alt="Logo" 
                    className="w-full h-full object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                </div>
              </div>
              
              <h1 className="text-3xl font-bold text-gray-800 tracking-wide uppercase mb-1">AL-BARI GROUP OF SCHOOLS</h1>
              <p className="text-lg text-gray-700 mb-3">Madrasah Section</p>
              
              <div className="flex items-center justify-center gap-3 my-2">
                <div className="flex-1 border-t border-gray-400" />
                <span className="text-gray-600">◆</span>
                <div className="flex-1 border-t border-gray-400" />
              </div>
              
              <p className="text-xs text-gray-600 mb-4">1, Al-bari cl, Behind UBA, Badagry, lagos, 08028152097, albarischools@Gmail.com</p>
              
              <h2 className="text-lg font-bold text-gray-800 tracking-wider uppercase mb-2 mt-3">STUDENT ACADEMIC REPORT</h2>
              <p className="text-sm text-gray-700">
                Session: {sessionName || '—'} | Term: {term?.name_en || '—'}
              </p>
            </div>

            {/* STUDENT INFO SECTION */}
            <div className="mb-6 pb-6 border-b-2 border-gray-300">
              <div className="flex gap-6">
                {/* Photo */}
                <div className="flex-shrink-0">
                  <Avatar className="w-24 h-32 rounded overflow-hidden border-2 border-gray-400 bg-gray-100">
                    <AvatarImage src={student.photo_url ?? ''} alt="Student Photo" className="h-full w-full object-cover" />
                    <AvatarFallback />
                  </Avatar>
                </div>

                {/* Student Info */}
                <div className="flex-1">
                  <div className="grid grid-cols-1 gap-3 text-sm">
                    <div className="flex">
                      <div className="w-1/2">
                        <span className="font-semibold">Student Name:</span>
                        <div className="text-gray-800">{student.name_en || '—'}</div>
                      </div>
                      <div className="w-1/2 text-right" dir="rtl">
                        <div className="text-gray-800">{student.name_ar || '—'}</div>
                        <span className="text-gray-600 text-xs">الاسم</span>
                      </div>
                    </div>

                    <div className="flex">
                      <div className="w-1/2">
                        <span className="font-semibold">Student ID:</span>
                        <div className="text-gray-800">{student.student_uid || student.student_id || '—'}</div>
                      </div>
                      <div className="w-1/2 text-right" dir="rtl">
                        <div className="text-gray-800">{student.student_uid || student.student_id || '—'}</div>
                        <span className="text-gray-600 text-xs">رقم الطالب</span>
                      </div>
                    </div>

                    <div className="flex">
                      <div className="w-1/2">
                        <span className="font-semibold">Class:</span>
                        <div className="text-gray-800">{classLevel?.name_en || '—'}{classArm?.name ? ` - ${classArm.name}` : ''}</div>
                      </div>
                      <div className="w-1/2 text-right" dir="rtl">
                        <div className="text-gray-800">{classLevel?.name_ar || '—'}{classArm?.name ? ` - ${classArm.name}` : ''}</div>
                        <span className="text-gray-600 text-xs">الصف</span>
                      </div>
                    </div>

                    <div className="flex">
                      <div className="w-1/2">
                        <span className="font-semibold">Gender:</span>
                        <div className="text-gray-800">{student.gender === 'male' ? 'Male' : 'Female'}</div>
                      </div>
                      <div className="w-1/2 text-right" dir="rtl">
                        <div className="text-gray-800">{student.gender === 'male' ? 'ذكر' : 'أنثى'}</div>
                        <span className="text-gray-600 text-xs">الجنس</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ACADEMIC PERFORMANCE SECTION */}
            <div className="mb-6">
              <div className="bg-green-700 text-white text-center py-2 px-4 font-bold tracking-wide mb-4 rounded-t">
                ACADEMIC PERFORMANCE
              </div>
              
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-green-700 text-white">
                    <th className="text-left px-3 py-2 font-semibold">Subject</th>
                    <th className="text-center px-2 py-2 font-semibold">CA1</th>
                    <th className="text-center px-2 py-2 font-semibold">CA2</th>
                    <th className="text-center px-2 py-2 font-semibold">Exam</th>
                    <th className="text-center px-2 py-2 font-semibold">المجموع</th>
                    <th className="text-center px-2 py-2 font-semibold">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {subjectRows.map((row, idx) => (
                    <tr key={row.subject.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-amber-50'}>
                      <td className="text-left px-3 py-2 font-medium border">
                        <div>{row.subject.name_en}</div>
                        <div className="text-xs text-gray-600">{row.subject.name_ar}</div>
                      </td>
                      <td className="text-center px-2 py-2 border">{row.currentScore?.ca1 ?? '—'}</td>
                      <td className="text-center px-2 py-2 border">{row.currentScore?.ca2 ?? '—'}</td>
                      <td className="text-center px-2 py-2 border">{row.currentScore?.exam ?? '—'}</td>
                      <td className="text-center px-2 py-2 border font-semibold">{row.currentScore?.total ?? '—'}</td>
                      <td className="text-center px-2 py-2 border font-bold">{row.currentScore?.grade ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* TERM AVERAGE */}
            <div className="text-right mb-6 text-lg font-bold">
              Term Average: <span className="text-gray-800">{termAvg}%</span>
            </div>

            {/* REMARKS SECTION */}
            {remarksEnabled && (
              <div className="mb-6 pb-6 border-t-2 border-b-2 border-gray-300 py-4">
                <div className="mb-4">
                  <p className="font-bold text-gray-800 mb-2">Class Teacher's Remark:</p>
                  <p className="text-sm text-gray-700 mb-1">{report?.teacher_remark || defaultTeacherRemark || '_________________________'}</p>
                  <p className="text-xs text-gray-600 text-right" dir="rtl">{(report?.teacher_remark || defaultTeacherRemark) ? 'ملاحظة معلم الفصل:' : ''}</p>
                </div>

                <div>
                  <p className="font-bold text-gray-800 mb-2">Head Teacher's Remark:</p>
                  <p className="text-sm text-gray-700 mb-1">{report?.head_remark || defaultHeadRemark || '_________________________'}</p>
                  <p className="text-xs text-gray-600 text-right" dir="rtl">{(report?.head_remark || defaultHeadRemark) ? 'كلمة مدير المدرسة:' : ''}</p>
                </div>
              </div>
            )}

            {/* SIGNATURE SECTION */}
            <div className="mb-8">
                <div className="grid grid-cols-3 gap-8 text-sm text-center">
                  <div className="relative">
                    <div className="border-b border-gray-800 h-10" />
                    <p className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 italic text-gray-800">
                      {report?.teacher_name || report?.teacher || 'Class Teacher'}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center mb-1">
                      <img
                        src="/images/head-teacher-stamp.png"
                        alt="Head Teacher Stamp"
                        className="w-24 h-24 object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                    <p className="font-semibold text-gray-800">{report?.head_name || report?.head || 'Head Teacher'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 mb-1">{printDateAuto ? (printDate || new Date().toLocaleDateString()) : (printDate || '_________________')}</p>
                    <div className="border-b border-gray-800 h-6 mb-1" />
                    <p className="text-sm text-gray-600 mt-0">Date</p>
                  </div>
                </div>
            </div>

            {/* FOOTER */}
            <div className="flex items-center justify-between gap-6 mb-4 pb-4 border-b-2 border-gray-300 text-xs">
              <div className="flex-1 text-center">
                <p className="text-gray-700 mb-1">Result generated via Al-Bari</p>
                <p className="text-gray-700">Madrasah Portal | Student ID: PIN</p>
              </div>
              
              <div className="flex-shrink-0 flex justify-center">
                {includeQr && qrDataUrl && (
                  <div className="w-20 h-20 border-2 border-gray-300 p-1">
                    <img src={qrDataUrl} alt="QR Code" className="w-full h-full object-contain" />
                  </div>
                )}
              </div>

              <div className="flex-1 text-center">
                <p className="text-gray-700 mb-1">Scan here to verify result</p>
                <p className="text-gray-700 text-right" dir="rtl">اضغط هنا للتحقق من النتيجة</p>
              </div>
            </div>

            {/* GREEN FOOTER BAR */}
            <div className="h-3 bg-green-700 rounded" />
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default ResultView;
