import { useLanguage } from '@/contexts/LanguageContext';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, Printer, Download, Users, ChevronRight, ArrowLeft, Loader2, Save, MessageSquare } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { calculateGrade, GRADE_CONFIG } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import QRCode from 'qrcode';
import { useCampus } from '@/contexts/CampusContext';

type Step = 'select' | 'students';

// Tiered remark helper
function getTieredRemark(avg: number, remarks: any[], role: 'teacher' | 'head'): string {
  const filtered = remarks.filter(r => r.role === role);
  const match = filtered.find(r => avg >= r.min_score && avg <= r.max_score);
  return match?.remark_en || '';
}

const AdminReports = () => {
  const { t, bilingualText } = useLanguage();
  const { toast } = useToast();
  const { user, isTeacher, isAdmin } = useAuth();
  const { campusId } = useCampus();

  const [sessionId, setSessionId] = useState('');
  const [termId, setTermId] = useState('');
  const [sessions, setSessions] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [classLevels, setClassLevels] = useState<any[]>([]);
  const [classArms, setClassArms] = useState<Record<string, any[]>>({});

  const [step, setStep] = useState<Step>('select');
  const [selectedClassLevel, setSelectedClassLevel] = useState<any>(null);
  const [selectedClassArm, setSelectedClassArm] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [printingId, setPrintingId] = useState<string | null>(null);
  const [reportIncludeQr, setReportIncludeQr] = useState(true);
  const [tieredRemarks, setTieredRemarks] = useState<any[]>([]);
  const [teacherClassArmId, setTeacherClassArmId] = useState<string | null>(null);

  // Teacher tiered remarks editor
  const REMARK_TIERS = [
    { min: 0, max: 44, label: 'Below 45' },
    { min: 45, max: 55, label: '45 - 55' },
    { min: 56, max: 70, label: '56 - 70' },
    { min: 71, max: 100, label: '71 and above' },
  ];
  const [teacherRemarks, setTeacherRemarks] = useState<Record<string, string>>({});
  const [savingTeacherRemarks, setSavingTeacherRemarks] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const [sessRes, clRes, armsRes, remarksRes] = await Promise.all([
        supabase.from('sessions').select('*').order('name', { ascending: false }),
        supabase.from('class_levels').select('*').eq('campus_id', campusId).order('display_order'),
        supabase.from('class_arms').select('*').eq('campus_id', campusId),
        supabase.from('tiered_remarks').select('*'),
      ]);
      setSessions(sessRes.data || []);
      setClassLevels(clRes.data || []);
      setTieredRemarks(remarksRes.data || []);
      const grouped: Record<string, any[]> = {};
      (armsRes.data || []).forEach((arm: any) => {
        if (!grouped[arm.class_level_id]) grouped[arm.class_level_id] = [];
        grouped[arm.class_level_id].push(arm);
      });
      setClassArms(grouped);

      // If teacher, get their assigned class arm
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('class_teacher_class_arm_id').eq('user_id', user.id).maybeSingle();
        const armId = profile?.class_teacher_class_arm_id || null;
        setTeacherClassArmId(armId);

        // Load teacher's tiered remarks for their class arm
        if (armId) {
          const { data: tRemarks } = await supabase.from('tiered_remarks').select('*').eq('role', 'teacher').eq('class_arm_id', armId);
          const map: Record<string, string> = {};
          (tRemarks || []).forEach((r: any) => {
            map[`${r.min_score}-${r.max_score}`] = r.remark_en;
          });
          setTeacherRemarks(map);
        }
      }
    };
    fetch();
    // load report settings
    (async () => {
      try {
        const { data } = await supabase.from('school_settings').select('*');
        const map: Record<string, string> = {};
        (data || []).forEach((r: any) => { map[r.key] = r.value; });
        setReportIncludeQr(map['report.include_qr'] !== 'false');
      } catch (err) {
        // ignore
      }
    })();
  }, [campusId, user]);

  useEffect(() => {
    if (!sessionId) { setTerms([]); setTermId(''); return; }
    supabase.from('terms').select('*').eq('session_id', sessionId).order('term_number')
      .then(({ data }) => setTerms(data || []));
    setTermId('');
  }, [sessionId]);

  // For teachers, filter class levels/arms to only their assigned class
  const filteredClassLevels = (() => {
    if (isAdmin) return classLevels;
    if (!teacherClassArmId) return classLevels; // show all if no assignment
    // Find the class level that contains the teacher's arm
    const allArms = Object.values(classArms).flat();
    const teacherArm = allArms.find(a => a.id === teacherClassArmId);
    if (!teacherArm) return [];
    return classLevels.filter(l => l.id === teacherArm.class_level_id);
  })();

  const getFilteredArms = (levelId: string) => {
    const arms = classArms[levelId] || [];
    if (isAdmin) return arms;
    if (!teacherClassArmId) return arms;
    return arms.filter(a => a.id === teacherClassArmId);
  };

  const selectClass = async (level: any, arm: any) => {
    setSelectedClassLevel(level);
    setSelectedClassArm(arm);
    setStep('students');
    setLoadingStudents(true);
    try {
      let query = supabase.from('students').select('id, full_name, name_en, name_ar, student_uid, class_arm_id, gender')
        .eq('campus_id', campusId).eq('class_level_id', level.id).eq('status', 'active').order('full_name');
      const { data } = await query;
      let filtered = data || [];
      if (arm) {
        filtered = filtered.filter(s => s.class_arm_id === arm.id);
      } else {
        filtered = filtered.filter(s => !s.class_arm_id);
      }
      setStudents(filtered);
    } catch (err: any) {
      toast({ title: t('Error', 'خطأ'), description: err.message, variant: 'destructive' });
    } finally {
      setLoadingStudents(false);
    }
  };

  const printStudentReport = async (student: any) => {
    if (!termId) return;
    setPrintingId(student.id);
    try {
      const selectedSession = sessions.find(s => s.id === sessionId);
      const selectedTerm = terms.find(t => t.id === termId);

      const [subjectsRes, scoresRes, classLevelRes, classArmRes, teacherProfileRes] = await Promise.all([
        supabase.from('subjects').select('*').eq('class_level_id', selectedClassLevel.id).order('name'),
        supabase.from('term_scores').select('*').eq('student_id', student.id).eq('term_id', termId),
        supabase.from('class_levels').select('*').eq('id', selectedClassLevel.id).maybeSingle(),
        selectedClassArm ? supabase.from('class_arms').select('*').eq('id', selectedClassArm.id).maybeSingle() : Promise.resolve({ data: null }),
        selectedClassArm ? supabase.from('profiles').select('signature_url, full_name').eq('class_teacher_class_arm_id', selectedClassArm.id).maybeSingle() : Promise.resolve({ data: null }),
      ]);
      const teacherSigUrl = (teacherProfileRes?.data as any)?.signature_url || '';
      const teacherName = (teacherProfileRes?.data as any)?.full_name || '';

      const subjects = subjectsRes.data || [];
      const scores = scoresRes.data || [];
      const scoresMap: Record<string, any> = {};
      scores.forEach(s => { scoresMap[s.subject_id] = s; });

      const subjectRows = subjects.map(sub => {
        const sc = scoresMap[sub.id];
        const total = sc ? (Number(sc.ca1 || 0) + Number(sc.ca2 || 0) + Number(sc.exam || 0)) : 0;
        return { name: sub.name, name_ar: sub.name_ar || '', ca1: sc?.ca1 || 0, ca2: sc?.ca2 || 0, exam: sc?.exam || 0, total, grade: calculateGrade(total) };
      });

      const totalSum = subjectRows.reduce((s, r) => s + r.total, 0);
      const avg = subjectRows.length > 0 ? Math.round(totalSum / subjectRows.length) : 0;

      const className = `${classLevelRes.data?.name_en || ''}${classArmRes.data ? ' - ' + classArmRes.data.name : ''}`;
      const classNameAr = `${classLevelRes.data?.name_ar || ''}${classArmRes.data ? ' - ' + classArmRes.data.name : ''}`;

      const printDate = new Date().toLocaleDateString();

      // Get tiered remarks based on overall average
      const teacherRemarkText = getTieredRemark(avg, tieredRemarks, 'teacher') || '_________________________________________';
      const headRemarkText = getTieredRemark(avg, tieredRemarks, 'head') || '_________________________________________';

      // generate verification QR if enabled
      let qrSrc = '';
      try {
        if (reportIncludeQr) {
          const verifyUrl = `${window.location.origin}/#/result?student=${encodeURIComponent(student.student_uid)}&term=${encodeURIComponent(termId)}`;
          qrSrc = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 240 });
        }
      } catch (err) {
        qrSrc = '';
      }

      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Report - ${student.name_en || student.full_name}</title>
  <style>
    @page { size: A4; margin: 8mm; }
    @media print {
      html, body { width: 210mm; height: 297mm; }
      .page-wrap { width: 194mm; max-height: 281mm; transform-origin: top left; overflow: hidden; page-break-after: avoid; page-break-inside: avoid; }
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; line-height: 1.35; font-size: 10px; }
    .header { text-align: center; padding: 20px 0 16px; border-bottom: 2px solid #374151; margin-bottom: 16px; }
    .logo { width: 60px; height: 60px; margin: 0 auto 8px; }
    .logo img { width: 100%; height: 100%; object-fit: contain; }
    .school-name { font-size: 26px; font-weight: 800; color: #1f2937; text-transform: uppercase; letter-spacing: 1.5px; margin: 4px 0; }
    .section-label { font-size: 13px; color: #4b5563; margin: 2px 0; font-weight: 600; }
    .divider { width: 50%; margin: 6px auto; border-top: 1px solid #d1d5db; }
    .contact-info { font-size: 10px; color: #666; margin: 4px 0; }
    .report-title { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 8px; }
    .session-info { font-size: 11px; color: #555; margin-top: 3px; }
    .student-section { margin-top: 16px; margin-bottom: 16px; display: flex; gap: 12px; }
    .student-photo { width: 70px; height: 90px; background: #f3f4f6; border: 1px solid #d1d5db; flex-shrink: 0; overflow: hidden; }
    .student-photo img { width: 100%; height: 100%; object-fit: cover; }
    .student-info-grid { flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 3px 8px; font-size: 11px; }
    .info-row { display: flex; justify-content: space-between; align-items: center; }
    .info-label { color: #555; font-weight: 600; }
    .info-value { color: #1f2937; font-weight: 700; }
    .academic-header { background: #047857; color: white; text-align: center; padding: 6px; font-weight: 700; margin-bottom: 4px; }
    .scores-table { width: 100%; border-collapse: collapse; margin: 0; font-size: 10px; }
    .scores-table th { background: #047857; color: white; padding: 6px 4px; text-align: center; font-weight: 700; text-transform: uppercase; }
    .scores-table th:first-child { text-align: left; }
    .scores-table td { padding: 6px 4px; border: 1px solid #d1d5db; text-align: center; }
    .scores-table td:first-child { text-align: left; font-weight: 500; }
    .scores-table tbody tr:nth-child(odd) { background: white; }
    .scores-table tbody tr:nth-child(even) { background: #fafaf8; }
    .term-avg { margin-top: 8px; text-align: right; font-weight: bold; font-size: 11px; }
    .remarks-section { margin-top: 12px; padding-top: 12px; border-top: 2px solid #d1d5db; border-bottom: 2px solid #d1d5db; padding-bottom: 12px; font-size: 11px; }
    .remark-block { margin-bottom: 8px; }
    .remark-label { font-weight: 700; color: #1f2937; margin-bottom: 2px; }
    .remark-text { color: #555; }
    .signatures { margin-top: 12px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; font-size: 10px; text-align: center; }
    .sig-item { }
    .sig-line { border-bottom: 1px solid #333; height: 25px; margin-bottom: 2px; }
    .sig-name { color: #555; font-weight: 600; }
    .footer { margin-top: 12px; display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 0; border-bottom: 2px solid #d1d5db; font-size: 9px; }
    .footer-text { flex: 1; text-align: center; color: #666; }
    .qr-container { flex-shrink: 0; width: 50px; height: 50px; border: 1px solid #999; display: flex; align-items: center; justify-content: center; }
    .qr-container img { width: 100%; height: 100%; object-fit: contain; }
    .footer-bar { margin-top: 8px; height: 3px; background: #047857; }
  </style>
</head>
<body>
<div class="page-wrap">

<div class="header">
  <div class="logo"><img src="${window.location.origin}/images/school-logo.png" alt="Logo" onerror="this.style.display='none'" /></div>
  <h1 class="school-name">AL-BARI GROUP OF SCHOOLS</h1>
  <div class="section-label">Madrasah Section</div>
  <div class="divider"></div>
  <div class="contact-info">1, Al-bari cl, Behind UBA, Badagry, lagos, 08028152097, albarischools@Gmail.com</div>
  <h2 class="report-title">STUDENT ACADEMIC REPORT</h2>
  <div class="session-info">Session: ${selectedSession?.name || ''} | Term: ${selectedTerm?.name_en || ''}</div>
</div>

<div class="student-section">
  <div class="student-photo">
    <img src="${window.location.origin}/images/placeholder-student.png" alt="Photo" onerror="this.style.display='none'" />
  </div>
  <div class="student-info-grid">
    <div class="info-row"><span class="info-label">Student Name:</span><span class="info-value">${student.name_en || student.full_name}</span></div>
    <div class="info-row"><span class="info-label">الاسم:</span><span class="info-value">${student.name_ar || '—'}</span></div>
    <div class="info-row"><span class="info-label">Student ID:</span><span class="info-value">${student.student_uid || '—'}</span></div>
    <div class="info-row"><span class="info-label">رقم الطالب:</span><span class="info-value">${student.student_uid || '—'}</span></div>
    <div class="info-row"><span class="info-label">Class:</span><span class="info-value">${className}</span></div>
    <div class="info-row"><span class="info-label">الصف:</span><span class="info-value">${classNameAr}</span></div>
    <div class="info-row"><span class="info-label">Gender:</span><span class="info-value">${student.gender === 'male' ? 'Male' : 'Female'}</span></div>
    <div class="info-row"><span class="info-label">الجنس:</span><span class="info-value">${student.gender === 'male' ? 'ذكر' : 'أنثى'}</span></div>
  </div>
</div>

<div class="academic-header">ACADEMIC PERFORMANCE</div>

<table class="scores-table">
  <thead>
    <tr>
      <th>Subject</th><th>CA1</th><th>CA2</th><th>Exam</th><th>المجموع</th><th>Grade</th>
    </tr>
  </thead>
  <tbody>
    ${subjectRows.map(r => `
    <tr>
      <td><div style="font-weight: 600;">${r.name}</div><div style="font-size: 9px; color: #888;">${r.name_ar}</div></td>
      <td>${r.ca1}</td><td>${r.ca2}</td><td>${r.exam}</td>
      <td style="font-weight: 700;">${r.total}</td><td style="font-weight: 700;">${r.grade}</td>
    </tr>`).join('')}
  </tbody>
</table>

<div class="term-avg">Term Average: <strong>${avg}%</strong></div>

<div class="remarks-section">
  <div class="remark-block">
    <div class="remark-label">Class Teacher's Remark:</div>
    <div class="remark-text">${teacherRemarkText}</div>
  </div>
  <div class="remark-block">
    <div class="remark-label">Head Teacher's Remark:</div>
    <div class="remark-text">${headRemarkText}</div>
  </div>
</div>

<div class="signatures">
  <div class="sig-item">
    ${teacherSigUrl ? `<div style="text-align:center;"><img src="${teacherSigUrl}" alt="Teacher Signature" style="width:80px;height:40px;object-fit:contain;margin:0 auto;" onerror="this.style.display='none'" /></div>` : `<div class="sig-line"></div>`}
    <div class="sig-name">${teacherName || 'Class Teacher'}</div>
  </div>
  <div class="sig-item">
    <div style="text-align:center;"><img src="${window.location.origin}/images/head-teacher-stamp.png" alt="Stamp" style="width:80px;height:80px;object-fit:contain;margin:0 auto;" onerror="this.style.display='none'" /></div>
    <div class="sig-name">Head Teacher</div>
  </div>
  <div class="sig-item">
    <div class="sig-line"></div>
    <div class="sig-name">${printDate}</div>
  </div>
</div>

<div class="footer">
  <div class="footer-text"><strong>Result generated via Al-Bari</strong><br/>Madrasah Portal | Student ID: PIN</div>
  <div class="qr-container">
    ${qrSrc ? `<img src="${qrSrc}" alt="QR" />` : `<img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='white' width='100' height='100'/%3E%3C/svg%3E" alt="QR" />`}
  </div>
  <div class="footer-text"><strong>Scan here to verify result</strong><br/>اضغط هنا للتحقق من النتيجة</div>
</div>

<div class="footer-bar"></div>
</div>
<script>
  (function(){
    function fitToPage(){
      var el = document.querySelector('.page-wrap');
      if(!el) return;
      // 281mm available height at ~3.78 px/mm = ~1062px
      var maxH = 1062;
      var h = el.scrollHeight;
      if (h > maxH) {
        var scale = maxH / h;
        el.style.transform = 'scale(' + scale + ')';
        el.style.width = (100 / scale) + '%';
      }
    }
    if (document.readyState === 'complete') fitToPage();
    else window.addEventListener('load', fitToPage);
  })();
</script>
</body>
</html>`;

      const w = window.open('', '_blank');
      if (!w) { toast({ title: t('Popup blocked', 'تم حظر النافذة') }); return; }
      w.document.open();
      w.document.write(html);
      w.document.close();
      setTimeout(() => { w.focus(); w.print(); }, 800);
    } catch (err: any) {
      toast({ title: t('Error', 'خطأ'), description: err.message, variant: 'destructive' });
    } finally {
      setPrintingId(null);
    }
  };

  const printAll = async () => {
    for (const student of students) {
      await printStudentReport(student);
    }
  };

  const saveTeacherRemarks = async () => {
    if (!teacherClassArmId) return;
    setSavingTeacherRemarks(true);
    try {
      await supabase.from('tiered_remarks').delete().eq('role', 'teacher').eq('class_arm_id', teacherClassArmId);
      const inserts = REMARK_TIERS.map(tier => ({
        role: 'teacher' as const,
        class_arm_id: teacherClassArmId,
        min_score: tier.min,
        max_score: tier.max,
        remark_en: teacherRemarks[`${tier.min}-${tier.max}`] || '',
        remark_ar: '',
      })).filter(r => r.remark_en.trim());
      if (inserts.length > 0) {
        await supabase.from('tiered_remarks').insert(inserts);
      }
      toast({ title: t('Saved', 'تم الحفظ'), description: t('Teacher remarks saved successfully', 'تم حفظ ملاحظات المعلم بنجاح') });
    } catch (err: any) {
      toast({ title: t('Error', 'خطأ'), description: err.message, variant: 'destructive' });
    } finally {
      setSavingTeacherRemarks(false);
    }
  };
  const hasSessionTerm = sessionId && termId;

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in pb-20 md:pb-0">
        <div className="flex items-center gap-3">
          {step === 'students' && (
            <Button variant="ghost" size="icon" onClick={() => setStep('select')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{t('School operations', 'عمليات المدرسة')}</p>
            <h1 className="font-display text-2xl font-extrabold tracking-tight">{t('Reports', 'التقارير')}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t('Generate and download individual student report sheets.', 'إنشاء وتنزيل كشوف تقارير الطلاب.')}</p>
          </div>
        </div>

        {/* Session/Term selector */}
        <Card className="rounded-2xl border-border/70 shadow-card">
          <CardContent className="py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
              <div className="space-y-1.5">
                <Label className="text-xs">{t('Session', 'السنة')}</Label>
                <Select value={sessionId} onValueChange={setSessionId}>
                  <SelectTrigger className="h-9"><SelectValue placeholder={t('Select session', 'اختر السنة')} /></SelectTrigger>
                  <SelectContent>{sessions.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t('Term', 'الفصل')}</Label>
                <Select value={termId} onValueChange={setTermId} disabled={!sessionId}>
                  <SelectTrigger className="h-9"><SelectValue placeholder={t('Select term', 'اختر الفصل')} /></SelectTrigger>
                  <SelectContent>{terms.map(term => <SelectItem key={term.id} value={term.id}>{t(term.name_en, term.name_ar)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Teacher Tiered Remarks Editor */}
        {isTeacher && teacherClassArmId && (
          <Card className="rounded-2xl border-border/70 shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                {t("My Class Teacher's Remarks", 'ملاحظات معلم الفصل')}
              </CardTitle>
              <CardDescription className="text-xs">
                {t('Set automatic remarks based on student average scores for your assigned class', 'حدد ملاحظات تلقائية بناءً على متوسط درجات الطالب لفصلك المعين')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-w-lg">
                {REMARK_TIERS.map(tier => (
                  <div key={tier.label} className="space-y-1">
                    <Label className="text-xs font-semibold">{tier.label} ({tier.min}–{tier.max}%)</Label>
                    <textarea
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={teacherRemarks[`${tier.min}-${tier.max}`] || ''}
                      onChange={e => setTeacherRemarks(prev => ({ ...prev, [`${tier.min}-${tier.max}`]: e.target.value }))}
                      rows={2}
                      placeholder={t(`Remark for students scoring ${tier.label}`, `ملاحظة للطلاب بدرجة ${tier.label}`)}
                    />
                  </div>
                ))}
                <div className="flex justify-end">
                  <Button onClick={saveTeacherRemarks} disabled={savingTeacherRemarks} size="sm">
                    {savingTeacherRemarks ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {t('Save Remarks', 'حفظ الملاحظات')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!hasSessionTerm && (
          <Card className="shadow-card">
            <CardContent className="py-12 text-center text-muted-foreground">
              {t('Please select a session and term to continue.', 'يرجى اختيار السنة والفصل للمتابعة.')}
            </CardContent>
          </Card>
        )}

        {/* Class selection */}
        {hasSessionTerm && step === 'select' && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredClassLevels.map(level => {
              const arms = getFilteredArms(level.id);
              return (
                <Card key={level.id} className="shadow-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{bilingualText(level.name_en, level.name_ar)}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {arms.length === 0 ? (
                      <Button variant="outline" className="w-full justify-between" onClick={() => selectClass(level, null)}>
                        <span className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {bilingualText(level.name_en, level.name_ar)}
                        </span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    ) : (
                      arms.map(arm => (
                        <Button key={arm.id} variant="outline" className="w-full justify-between" onClick={() => selectClass(level, arm)}>
                          <span className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            {bilingualText(level.name_en, level.name_ar)} - {arm.name}
                          </span>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      ))
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Students list */}
        {hasSessionTerm && step === 'students' && (
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>
                  {bilingualText(selectedClassLevel?.name_en, selectedClassLevel?.name_ar)} {selectedClassArm?.name || ''}
                </CardTitle>
                <CardDescription>{students.length} {t('students', 'طالب')}</CardDescription>
              </div>
              <Button onClick={printAll} disabled={students.length === 0} variant="outline">
                <Printer className="mr-2 h-4 w-4" />
                {t('Print All', 'طباعة الكل')}
              </Button>
            </CardHeader>
            <CardContent>
              {loadingStudents ? (
                <div className="py-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
              ) : students.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">{t('No students found.', 'لا يوجد طلاب.')}</p>
              ) : (
                <div className="overflow-y-auto max-h-[60vh]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8">#</TableHead>
                        <TableHead>{t('Student ID', 'رقم الطالب')}</TableHead>
                        <TableHead>{t('Name', 'الاسم')}</TableHead>
                        <TableHead>{t('Gender', 'الجنس')}</TableHead>
                        <TableHead className="text-right">{t('Action', 'إجراء')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student, i) => (
                        <TableRow key={student.id}>
                          <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                          <TableCell className="font-mono text-sm">{student.student_uid || '—'}</TableCell>
                          <TableCell className="font-medium">{student.name_en || student.full_name}</TableCell>
                          <TableCell className="capitalize">{student.gender || '—'}</TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="outline" onClick={() => printStudentReport(student)} disabled={printingId === student.id}>
                              {printingId === student.id ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Download className="mr-2 h-3 w-3" />}
                              {t('Download', 'تحميل')}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminReports;
