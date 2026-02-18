import { useLanguage } from '@/contexts/LanguageContext';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, Printer, Download, Users, ChevronRight, ArrowLeft, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { calculateGrade, GRADE_CONFIG } from '@/types';
import html2pdf from 'html2pdf.js';

type Step = 'select' | 'students';

const AdminReports = () => {
  const { t, bilingualText } = useLanguage();
  const { toast } = useToast();

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

  useEffect(() => {
    const fetch = async () => {
      const [sessRes, clRes, armsRes] = await Promise.all([
        supabase.from('sessions').select('*').order('name', { ascending: false }),
        supabase.from('class_levels').select('*').order('display_order'),
        supabase.from('class_arms').select('*'),
      ]);
      setSessions(sessRes.data || []);
      setClassLevels(clRes.data || []);
      const grouped: Record<string, any[]> = {};
      (armsRes.data || []).forEach((arm: any) => {
        if (!grouped[arm.class_level_id]) grouped[arm.class_level_id] = [];
        grouped[arm.class_level_id].push(arm);
      });
      setClassArms(grouped);
    };
    fetch();
  }, []);

  useEffect(() => {
    if (!sessionId) { setTerms([]); setTermId(''); return; }
    supabase.from('terms').select('*').eq('session_id', sessionId).order('term_number')
      .then(({ data }) => setTerms(data || []));
    setTermId('');
  }, [sessionId]);

  const selectClass = async (level: any, arm: any) => {
    setSelectedClassLevel(level);
    setSelectedClassArm(arm);
    setStep('students');
    setLoadingStudents(true);
    try {
      let query = supabase.from('students').select('id, full_name, name_en, name_ar, student_uid, class_arm_id, gender')
        .eq('class_level_id', level.id).eq('status', 'active').order('full_name');
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
      const isTermThree = selectedTerm?.term_number === 3;

      const [subjectsRes, scoresRes, classLevelRes, classArmRes] = await Promise.all([
        supabase.from('subjects').select('*').eq('class_level_id', selectedClassLevel.id).order('name'),
        supabase.from('term_scores').select('*').eq('student_id', student.id).eq('term_id', termId),
        supabase.from('class_levels').select('*').eq('id', selectedClassLevel.id).maybeSingle(),
        selectedClassArm ? supabase.from('class_arms').select('*').eq('id', selectedClassArm.id).maybeSingle() : Promise.resolve({ data: null }),
      ]);

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
      const overallGrade = calculateGrade(avg);
      const promoted = avg >= 50;

      const className = `${classLevelRes.data?.name_en || ''}${classArmRes.data ? ' - ' + classArmRes.data.name : ''}`;
      const classNameAr = `${classLevelRes.data?.name_ar || ''}${classArmRes.data ? ' - ' + classArmRes.data.name : ''}`;

      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Report - ${student.name_en || student.full_name}</title>
  <style>
    @page { size: A4; margin: 20mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; line-height: 1.5; }
    
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
    
    .academic-header { background: #374151; color: white; text-align: center; padding: 6px; font-weight: 700; tracking-wider; margin-bottom: 4px; }
    .scores-table { width: 100%; border-collapse: collapse; margin: 0; font-size: 10px; }
    .scores-table th { background: #374151; color: white; padding: 6px 4px; text-align: center; font-weight: 700; text-transform: uppercase; }
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
    
    .footer-bar { margin-top: 8px; height: 3px; background: #374151; }
  </style>
</head>
<body>

<div class="header">
  <div class="logo"><img src="${window.location.origin}/images/school-logo.png" alt="Logo" onerror="this.style.display='none'" /></div>
  <h1 class="school-name">AL-BARI GROUP OF SCHOOLS</h1>
  <div class="section-label">Madrasah Section</div>
  <div class="divider"></div>
  <div class="contact-info">123 Islamic Road, Lagos | Tel: 08012345678 | Email: info@albarischools.com | 🌐 albarischools.com</div>
  <h2 class="report-title">STUDENT ACADEMIC REPORT</h2>
  <div class="session-info">Session: ${selectedSession?.name || ''} | Term: ${selectedTerm?.name_en || ''}</div>
</div>

<div class="student-section">
  <div class="student-photo">
    <img src="${window.location.origin}/images/placeholder-student.png" alt="Photo" onerror="this.style.display='none'" />
  </div>
  <div class="student-info-grid">
    <div class="info-row">
      <span class="info-label">Student Name:</span>
      <span class="info-value">${student.name_en || student.full_name}</span>
    </div>
    <div class="info-row">
      <span class="info-label">الاسم:</span>
      <span class="info-value">${student.name_ar || '—'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Student ID:</span>
      <span class="info-value">${student.student_uid || '—'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">رقم الطالب:</span>
      <span class="info-value">${student.student_uid || '—'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Class:</span>
      <span class="info-value">${className}</span>
    </div>
    <div class="info-row">
      <span class="info-label">الصف:</span>
      <span class="info-value">${classNameAr}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Gender:</span>
      <span class="info-value">${student.gender === 'male' ? 'Male' : 'Female'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">الجنس:</span>
      <span class="info-value">${student.gender === 'male' ? 'ذكر' : 'أنثى'}</span>
    </div>
  </div>
</div>

<div class="academic-header">ACADEMIC PERFORMANCE</div>

<table class="scores-table">
  <thead>
    <tr>
      <th>Subject</th>
      <th>CA1</th>
      <th>CA2</th>
      <th>Exam</th>
      <th>المجموع</th>
      <th>المجموع</th>
      <th>Grade</th>
    </tr>
  </thead>
  <tbody>
    ${subjectRows.map((r, i) => `
    <tr>
      <td>
        <div style="font-weight: 600;">${r.name}</div>
        <div style="font-size: 9px; color: #888;">${r.name_ar}</div>
      </td>
      <td>${r.ca1}</td>
      <td>${r.ca2}</td>
      <td>${r.exam}</td>
      <td style="font-weight: 700;">${r.total}</td>
      <td style="font-weight: 700;">${r.total}</td>
      <td style="font-weight: 700;">${r.grade}</td>
    </tr>
    `).join('')}
  </tbody>
</table>

<div class="term-avg">Term Average: <strong>${avg}%</strong></div>

<div class="remarks-section">
  <div class="remark-block">
    <div class="remark-label">Class Teacher's Remark:</div>
    <div class="remark-text">_________________________________________</div>
  </div>
  <div class="remark-block">
    <div class="remark-label">Head Teacher's Remark:</div>
    <div class="remark-text">_________________________________________</div>
  </div>
</div>

<div class="signatures">
  <div class="sig-item">
    <div class="sig-line"></div>
    <div class="sig-name">Class Teacher</div>
  </div>
  <div class="sig-item">
    <div class="sig-line"></div>
    <div class="sig-name">Head Teacher</div>
  </div>
  <div class="sig-item">
    <div class="sig-line"></div>
    <div class="sig-name">Date:</div>
  </div>
</div>

<div class="footer">
  <div class="footer-text">
    <strong>Result generated via Al-Bari</strong><br/>
    Madrasah Portal | Student ID: PIN
  </div>
  <div class="qr-container">
    <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='white' width='100' height='100'/%3E%3C/svg%3E" alt="QR" />
  </div>
  <div class="footer-text">
    <strong>Scan here to verify result</strong><br/>
    اضغط هنا للتحقق من النتيجة
  </div>
</div>

<div class="footer-bar"></div>

</body>
</html>`;

      const w = window.open('', '_blank');
      if (!w) { toast({ title: t('Popup blocked', 'تم حظر النافذة') }); return; }
      w.document.open();
      w.document.write(html);
      w.document.close();
      setTimeout(() => { w.focus(); w.print(); }, 500);
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

  const hasSessionTerm = sessionId && termId;

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          {step === 'students' && (
            <Button variant="ghost" size="icon" onClick={() => setStep('select')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold">{t('Reports', 'التقارير')}</h1>
            <p className="text-muted-foreground">{t('Download individual student report sheets', 'تحميل كشوف تقارير الطلاب')}</p>
          </div>
        </div>

        {/* Session/Term selector */}
        <Card className="shadow-card">
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
            {classLevels.map(level => {
              const arms = classArms[level.id] || [];
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
