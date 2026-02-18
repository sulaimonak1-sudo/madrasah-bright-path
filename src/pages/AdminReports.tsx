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

  const generateAutoRemark = (avg: number): string => {
    if (avg >= 70) return 'An excellent performance. Keep it up!';
    if (avg >= 60) return 'A very good performance. Well done!';
    if (avg >= 50) return 'A good performance. Keep working hard.';
    if (avg >= 40) return 'A fair performance. More effort is needed.';
    return 'Needs significant improvement. Please work harder.';
  };

  const printStudentReport = async (student: any) => {
    if (!termId) return;
    setPrintingId(student.id);
    try {
      const selectedSession = sessions.find(s => s.id === sessionId);
      const selectedTerm = terms.find(t => t.id === termId);

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
      const autoRemark = generateAutoRemark(avg);

      const className = `${classLevelRes.data?.name_en || ''}${classArmRes.data ? ' - ' + classArmRes.data.name : ''}`;

      const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>Report - ${student.name_en || student.full_name}</title>
<style>
  @page { size: A4; margin: 15mm; }
  body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; color: #1a1a1a; }
  .header { text-align: center; margin-bottom: 16px; border-bottom: 3px solid #166534; padding-bottom: 12px; }
  .logo { width: 80px; height: 80px; margin: 0 auto 8px; }
  .logo img { width: 100%; height: 100%; object-fit: contain; }
  .school-name { font-size: 22px; font-weight: 800; color: #166534; text-transform: uppercase; letter-spacing: 1px; }
  .section-label { font-size: 14px; color: #166534; margin-top: 2px; }
  .motto { font-size: 11px; color: #666; margin-top: 4px; font-style: italic; }
  .report-title { font-size: 16px; font-weight: 700; margin-top: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
  .session-info { font-size: 12px; color: #555; margin-top: 4px; }
  .student-info { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 16px 0; padding: 12px; background: #f8faf8; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 13px; }
  .student-info div span:first-child { color: #666; }
  .student-info div span:last-child { font-weight: 600; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12px; }
  th { background: #166534; color: white; padding: 8px 6px; text-align: center; font-size: 11px; text-transform: uppercase; }
  th:first-child { text-align: left; }
  td { padding: 7px 6px; border: 1px solid #d1d5db; text-align: center; }
  td:first-child { text-align: left; font-weight: 500; }
  tr:nth-child(even) { background: #f0fdf4; }
  .summary { margin-top: 16px; padding: 12px; border: 2px solid #166534; border-radius: 6px; }
  .summary-row { display: flex; justify-content: space-between; font-size: 14px; padding: 4px 0; }
  .summary-row strong { color: #166534; }
  .remark { margin-top: 16px; padding: 10px; background: #f8faf8; border-left: 4px solid #166534; font-size: 13px; }
  .remark-label { font-weight: 700; color: #166534; margin-bottom: 4px; }
  .signatures { margin-top: 24px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; font-size: 12px; }
  .sig-line { border-bottom: 1px solid #333; height: 30px; }
  .sig-label { color: #666; margin-top: 4px; }
  .grade-key { margin-top: 12px; font-size: 10px; color: #888; text-align: center; }
  .footer-bar { margin-top: 20px; height: 8px; background: #166534; border-radius: 4px; }
</style></head><body>
<div class="header">
  <div class="logo"><img src="${window.location.origin}/images/school-logo.png" /></div>
  <div class="school-name">Al-Bari Group of Schools</div>
  <div class="section-label">Madrasah Section</div>
  <div class="motto">Motto: Education Is Future</div>
  <div class="report-title">Student Academic Report</div>
  <div class="session-info">Session: ${selectedSession?.name || ''} | Term: ${selectedTerm?.name_en || ''}</div>
</div>
<div class="student-info">
  <div><span>Student Name: </span><span>${student.name_en || student.full_name}</span></div>
  <div><span>Arabic Name: </span><span>${student.name_ar || '—'}</span></div>
  <div><span>Student ID: </span><span>${student.student_uid || '—'}</span></div>
  <div><span>Class: </span><span>${className}</span></div>
  <div><span>Gender: </span><span>${student.gender === 'male' ? 'Male' : 'Female'}</span></div>
  <div><span>No. of Subjects: </span><span>${subjectRows.length}</span></div>
</div>
<table>
  <thead><tr><th>Subject</th><th>CA1 (15)</th><th>CA2 (15)</th><th>Exam (60)</th><th>Total (100)</th><th>Grade</th></tr></thead>
  <tbody>${subjectRows.map(r => `<tr><td>${r.name}</td><td>${r.ca1}</td><td>${r.ca2}</td><td>${r.exam}</td><td><strong>${r.total}</strong></td><td>${r.grade}</td></tr>`).join('')}</tbody>
</table>
<div class="summary">
  <div class="summary-row"><span>Total Marks Obtained:</span><strong>${totalSum} / ${subjectRows.length * 100}</strong></div>
  <div class="summary-row"><span>Average:</span><strong>${avg}%</strong></div>
  <div class="summary-row"><span>Overall Grade:</span><strong>${overallGrade}</strong></div>
  <div class="summary-row"><span>Status:</span><strong>${avg >= 50 ? '✅ PROMOTED' : '❌ NOT PROMOTED'}</strong></div>
</div>
<div class="remark">
  <div class="remark-label">Teacher's Remark:</div>
  <div>${autoRemark}</div>
</div>
<div class="signatures">
  <div><div class="sig-line"></div><div class="sig-label">Class Teacher</div></div>
  <div><div class="sig-line"></div><div class="sig-label">Head Teacher</div></div>
  <div><div class="sig-line"></div><div class="sig-label">Date</div></div>
</div>
<div class="grade-key">${GRADE_CONFIG.map(g => `${g.grade}: ${g.min}-${g.max}`).join(' | ')}</div>
<div class="footer-bar"></div>
</body></html>`;

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
