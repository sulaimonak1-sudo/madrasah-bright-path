import { useLanguage } from '@/contexts/LanguageContext';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileSpreadsheet, Save, Loader2, ArrowLeft, BookOpen, Users, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { calculateGrade } from '@/types';

interface ScoreEntry {
  student_id: string;
  student_name: string;
  ca1: number;
  ca2: number;
  exam: number;
  existing_id?: string;
}

type Step = 'classes' | 'subjects' | 'scores';

const AdminResults = () => {
  const { t, bilingualText } = useLanguage();
  const { toast } = useToast();

  // Global filters
  const [sessionId, setSessionId] = useState('');
  const [termId, setTermId] = useState('');
  const [sessions, setSessions] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);

  // Drill-down state
  const [step, setStep] = useState<Step>('classes');
  const [selectedClassLevel, setSelectedClassLevel] = useState<any>(null);
  const [selectedClassArm, setSelectedClassArm] = useState<any>(null);
  const [selectedSubject, setSelectedSubject] = useState<any>(null);

  // Data
  const [classLevels, setClassLevels] = useState<any[]>([]);
  const [classArms, setClassArms] = useState<Record<string, any[]>>({});
  const [subjects, setSubjects] = useState<any[]>([]);
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [saving, setSaving] = useState(false);

  // State for viewing/generating a student's result
  const [selectedStudentResult, setSelectedStudentResult] = useState<ScoreEntry | null>(null);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportData, setReportData] = useState<any | null>(null);
  const [teacherRemark, setTeacherRemark] = useState('');
  const [headRemark, setHeadRemark] = useState('');
  const [loadingReport, setLoadingReport] = useState(false);
  const [teacherSignatureFile, setTeacherSignatureFile] = useState<File | null>(null);
  const [headSignatureFile, setHeadSignatureFile] = useState<File | null>(null);

  const uploadSignature = async (file: File | null, destPath: string) => {
    if (!file) return null;
    try {
      const { error } = await supabase.storage.from('signatures').upload(destPath, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('signatures').getPublicUrl(destPath);
      return data.publicUrl;
    } catch (err) {
      console.error('Signature upload error', err);
      throw err;
    }
  };

  // Bulk auto-remarks UI state
  const [autoDialogOpen, setAutoDialogOpen] = useState(false);
  const [autoTemplate, setAutoTemplate] = useState('');
  const [autoSign, setAutoSign] = useState(false);
  const [generatingRemarks, setGeneratingRemarks] = useState(false);

  const defaultRemarkFromGrade = (grade: string, total: number, name: string) => {
    if (grade === 'A') return `${name} performed excellently with ${total} marks.`;
    if (grade === 'B') return `${name} performed well with ${total} marks.`;
    if (grade === 'C') return `${name} showed satisfactory performance with ${total} marks.`;
    return `${name} needs improvement; scored ${total} marks.`;
  };

  const applyAutoRemarks = async () => {
    if (!termId) { toast({ title: t('Select term first', 'اختر الفصل أولاً') }); return; }
    setGeneratingRemarks(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = (userData as any)?.user;
      const upserts = scores.map(s => {
        const total = s.ca1 + s.ca2 + s.exam;
        const grade = calculateGrade(total);
        const name = s.student_name;
        const remark = autoTemplate
          ? autoTemplate.replace(/{name}/g, name).replace(/{total}/g, String(total)).replace(/{grade}/g, grade)
          : defaultRemarkFromGrade(grade, total, name);
        const obj: any = { student_id: s.student_id, term_id: termId, teacher_remark: remark };
        if (autoSign && user?.id) obj.teacher_signed_by = user.id;
        return obj;
      });
      const { error } = await supabase.from('term_reports').upsert(upserts, { onConflict: 'student_id,term_id' });
      if (error) throw error;
      toast({ title: t('Remarks applied', 'تم تطبيق الملاحظات') });
      setAutoDialogOpen(false);
    } catch (err: any) {
      toast({ title: t('Error', 'خطأ'), description: err.message, variant: 'destructive' });
    } finally {
      setGeneratingRemarks(false);
    }
  };

  // Handler for generating/viewing result
  const handleGenerateResult = async (student: ScoreEntry) => {
    setSelectedStudentResult(student);
    // open dialog and load report for this student+term
    setShowReportDialog(true);
    setLoadingReport(true);
    try {
      const { data } = await supabase.from('term_reports').select('*').eq('student_id', student.student_id).eq('term_id', termId).maybeSingle();
      setReportData(data || null);
      setTeacherRemark(data?.teacher_remark || '');
      setHeadRemark(data?.head_remark || '');
    } catch (err: any) {
      toast({ title: t('Error', 'خطأ'), description: err.message, variant: 'destructive' });
    } finally {
      setLoadingReport(false);
    }
  };

  const closeReportDialog = () => {
    setShowReportDialog(false);
    setSelectedStudentResult(null);
    setReportData(null);
    setTeacherRemark(''); setHeadRemark('');
  };

  const saveTeacherRemark = async () => {
    if (!selectedStudentResult) return;
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = (userData as any)?.user;
      const upsertObj: any = {
        student_id: selectedStudentResult.student_id,
        term_id: termId,
        teacher_remark: teacherRemark,
      };
      if (user?.id) upsertObj.teacher_signed_by = user.id;
      // upload signature image if provided
      if (teacherSignatureFile) {
        const path = `signatures/${termId}/${selectedStudentResult.student_id}/teacher_${Date.now()}.png`;
        const url = await uploadSignature(teacherSignatureFile, path);
        if (url) upsertObj.teacher_signature_url = url;
      }
      const { error } = await supabase.from('term_reports').upsert(upsertObj, { onConflict: 'student_id,term_id' });
      if (error) throw error;
      toast({ title: t('Saved!', 'تم الحفظ!') });
      // refresh report data
      const { data } = await supabase.from('term_reports').select('*').eq('student_id', selectedStudentResult.student_id).eq('term_id', termId).maybeSingle();
      setReportData(data || null);
    } catch (err: any) {
      toast({ title: t('Error', 'خطأ'), description: err.message, variant: 'destructive' });
    }
  };

  const saveHeadRemark = async () => {
    if (!selectedStudentResult) return;
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = (userData as any)?.user;
      const upsertObj: any = {
        student_id: selectedStudentResult.student_id,
        term_id: termId,
        head_remark: headRemark,
      };
      if (user?.id) upsertObj.head_signed_by = user.id;
      if (headSignatureFile) {
        const path = `signatures/${termId}/${selectedStudentResult.student_id}/head_${Date.now()}.png`;
        const url = await uploadSignature(headSignatureFile, path);
        if (url) upsertObj.head_signature_url = url;
      }
      const { error } = await supabase.from('term_reports').upsert(upsertObj, { onConflict: 'student_id,term_id' });
      if (error) throw error;
      toast({ title: t('Saved!', 'تم الحفظ!') });
      const { data } = await supabase.from('term_reports').select('*').eq('student_id', selectedStudentResult.student_id).eq('term_id', termId).maybeSingle();
      setReportData(data || null);
    } catch (err: any) {
      toast({ title: t('Error', 'خطأ'), description: err.message, variant: 'destructive' });
    }
  };

  // Fetch sessions and class levels
  useEffect(() => {
    const fetch = async () => {
      const [sessRes, clRes, armsRes] = await Promise.all([
        supabase.from('sessions').select('*').order('name', { ascending: false }),
        supabase.from('class_levels').select('*').order('display_order'),
        supabase.from('class_arms').select('*'),
      ]);
      setSessions(sessRes.data || []);
      setClassLevels(clRes.data || []);
      // Group arms by class_level_id
      const grouped: Record<string, any[]> = {};
      (armsRes.data || []).forEach((arm: any) => {
        if (!grouped[arm.class_level_id]) grouped[arm.class_level_id] = [];
        grouped[arm.class_level_id].push(arm);
      });
      setClassArms(grouped);
    };
    fetch();
  }, []);

  // Fetch terms when session changes
  useEffect(() => {
    if (!sessionId) { setTerms([]); setTermId(''); return; }
    supabase.from('terms').select('*').eq('session_id', sessionId).order('term_number')
      .then(({ data }) => setTerms(data || []));
    setTermId('');
  }, [sessionId]);

  // When class is selected, fetch subjects
  useEffect(() => {
    if (!selectedClassLevel) { setSubjects([]); return; }
    supabase.from('subjects').select('*').eq('class_level_id', selectedClassLevel.id)
      .then(({ data }) => setSubjects(data || []));
  }, [selectedClassLevel]);

  // When subject is selected, fetch students & scores. Support classes without arms
  // by querying students where `class_arm_id IS NULL` when `selectedClassArm` is null.
  useEffect(() => {
    if (!selectedSubject || !termId || !selectedClassLevel) { setScores([]); return; }
    const fetchData = async () => {
      // Fetch students by class level, then filter client-side for arms.
      const [studRes, scoresRes] = await Promise.all([
        supabase.from('students').select('id, full_name, name_en, name_ar, student_uid, class_arm_id')
          .eq('class_level_id', selectedClassLevel.id)
          .eq('status', 'active')
          .order('full_name'),
        supabase.from('term_scores').select('*')
          .eq('term_id', termId).eq('subject_id', selectedSubject.id),
      ]);
      let students = studRes.data || [];
      // Normalize: treat undefined/empty-string/null as no arm
      if (selectedClassArm) {
        students = students.filter((s: any) => s.class_arm_id === selectedClassArm.id);
      } else {
        students = students.filter((s: any) => !s.class_arm_id);
      }
      const existingScores = scoresRes.data || [];
      const entries: ScoreEntry[] = students.map(s => {
        const existing = existingScores.find(sc => sc.student_id === s.id);
        return {
          student_id: s.id,
          student_name: s.name_en || s.full_name,
          ca1: existing ? Number(existing.ca1) : 0,
          ca2: existing ? Number(existing.ca2) : 0,
          exam: existing ? Number(existing.exam) : 0,
          existing_id: existing?.id,
        };
      });
      setScores(entries);
    };
    fetchData();
  }, [selectedSubject, selectedClassArm, termId, selectedClassLevel]);

  const updateScore = useCallback((index: number, field: 'ca1' | 'ca2' | 'exam', value: string) => {
    const num = Math.max(0, Math.min(field === 'exam' ? 60 : 15, Number(value) || 0));
    setScores(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: num };
      return updated;
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const upserts = scores.map(s => ({
        ...(s.existing_id ? { id: s.existing_id } : {}),
        student_id: s.student_id,
        subject_id: selectedSubject.id,
        term_id: termId,
        ca1: s.ca1,
        ca2: s.ca2,
        exam: s.exam,
        grade: calculateGrade(s.ca1 + s.ca2 + s.exam),
      }));
      const { error } = await supabase.from('term_scores').upsert(upserts, {
        onConflict: 'student_id,subject_id,term_id',
      });
      if (error) throw error;
      toast({ title: t('Saved!', 'تم الحفظ!'), description: t(`${scores.length} scores saved`, `تم حفظ ${scores.length} درجة`) });
      // Refresh IDs
      const { data } = await supabase.from('term_scores').select('*').eq('term_id', termId).eq('subject_id', selectedSubject.id);
      if (data) {
        setScores(prev => prev.map(s => {
          const updated = data.find(d => d.student_id === s.student_id);
          return updated ? { ...s, existing_id: updated.id } : s;
        }));
      }
    } catch (err: any) {
      toast({ title: t('Error', 'خطأ'), description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const selectClass = (level: any, arm: any) => {
    setSelectedClassLevel(level);
    setSelectedClassArm(arm);
    setSelectedSubject(null);
    setStep('subjects');
  };

  const selectSubject = (subject: any) => {
    setSelectedSubject(subject);
    setStep('scores');
  };

  const goBack = () => {
    if (step === 'scores') { setSelectedSubject(null); setStep('subjects'); }
    else if (step === 'subjects') { setSelectedClassLevel(null); setSelectedClassArm(null); setStep('classes'); }
  };

  const selectedTerm = terms.find(t => t.id === termId);
  const isLocked = selectedTerm?.is_locked;
  const hasSessionTerm = sessionId && termId;

  // Breadcrumb
  const breadcrumb = () => {
    const parts = [t('Results', 'النتائج')];
    if (step !== 'classes' && selectedClassLevel && selectedClassArm) {
      parts.push(`${bilingualText(selectedClassLevel.name_en, selectedClassLevel.name_ar)} - ${selectedClassArm.name}`);
    }
    if (step === 'scores' && selectedSubject) {
      parts.push(t(selectedSubject.name, selectedSubject.name_ar));
    }
    return parts;
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header with breadcrumb */}
        <div className="flex items-center gap-3">
          {step !== 'classes' && (
            <Button variant="ghost" size="icon" onClick={goBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              {breadcrumb().map((part, i) => (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight className="h-3 w-3" />}
                  <span className={i === breadcrumb().length - 1 ? 'text-foreground font-medium' : ''}>{part}</span>
                </span>
              ))}
            </div>
            <h1 className="text-2xl font-bold">{t('Results', 'النتائج')}</h1>
          </div>
        </div>

        {/* Session & Term selector - always visible */}
        <Card className="shadow-card">
          <CardContent className="py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
              <div className="space-y-1.5">
                <Label className="text-xs">{t('Session', 'السنة')}</Label>
                <Select value={sessionId} onValueChange={setSessionId}>
                  <SelectTrigger className="h-9"><SelectValue placeholder={t('Select session', 'اختر السنة')} /></SelectTrigger>
                  <SelectContent>
                    {sessions.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t('Term', 'الفصل')}</Label>
                <Select value={termId} onValueChange={setTermId} disabled={!sessionId}>
                  <SelectTrigger className="h-9"><SelectValue placeholder={t('Select term', 'اختر الفصل')} /></SelectTrigger>
                  <SelectContent>
                    {terms.map(term => (
                      <SelectItem key={term.id} value={term.id}>
                        {t(term.name_en, term.name_ar)} {term.is_locked ? '🔒' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report dialog for teacher/head remarks */}
        <Dialog open={showReportDialog} onOpenChange={(o) => { if (!o) closeReportDialog(); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('Teacher / Head Remarks', 'ملاحظات المعلم/المدير')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">{t("Class Teacher's Remark:", 'ملاحظة معلم الفصل:')}</label>
                <textarea className="w-full mt-1 p-2 border rounded" rows={4} value={teacherRemark} onChange={(e) => setTeacherRemark(e.target.value)} />
                <div className="mt-2 flex gap-2 items-center">
                  <input type="file" accept="image/*" onChange={(e) => setTeacherSignatureFile(e.target.files ? e.target.files[0] : null)} />
                  <Button onClick={saveTeacherRemark} disabled={loadingReport}>{loadingReport ? '...' : t('Save', 'حفظ')}</Button>
                </div>
                {teacherSignatureFile && (
                  <div className="mt-2 text-xs text-muted-foreground">{teacherSignatureFile.name}</div>
                )}
                {reportData?.teacher_signature_url && !teacherSignatureFile && (
                  <img src={reportData.teacher_signature_url} alt="teacher signature" className="mt-2 h-16" />
                )}
                <div className="text-xs text-muted-foreground mt-1">{reportData?.teacher_signed_at ? `Signed at ${new Date(reportData.teacher_signed_at).toLocaleString()}` : ''}</div>
              </div>

              <div>
                <label className="text-sm font-medium">{t("Head Teacher's Remark:", 'ملاحظة مدير المدرسة:')}</label>
                <textarea className="w-full mt-1 p-2 border rounded" rows={3} value={headRemark} onChange={(e) => setHeadRemark(e.target.value)} />
                <div className="mt-2 flex gap-2 items-center">
                  <input type="file" accept="image/*" onChange={(e) => setHeadSignatureFile(e.target.files ? e.target.files[0] : null)} />
                  <Button onClick={saveHeadRemark} disabled={loadingReport}>{loadingReport ? '...' : t('Save', 'حفظ')}</Button>
                </div>
                {headSignatureFile && (
                  <div className="mt-2 text-xs text-muted-foreground">{headSignatureFile.name}</div>
                )}
                {reportData?.head_signature_url && !headSignatureFile && (
                  <img src={reportData.head_signature_url} alt="head signature" className="mt-2 h-16" />
                )}
                <div className="text-xs text-muted-foreground mt-1">{reportData?.head_signed_at ? `Signed at ${new Date(reportData.head_signed_at).toLocaleString()}` : ''}</div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">{t('Close', 'إغلاق')}</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Auto Remarks dialog (bulk) */}
        <Dialog open={autoDialogOpen} onOpenChange={(o) => { if (!o) setAutoDialogOpen(false); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('Auto Remarks', 'تطبيق ملاحظات تلقائياً')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">{t('Template (use {name}, {total}, {grade})', 'قالب (استخدم {name}، {total}، {grade})')}</label>
                <textarea className="w-full mt-1 p-2 border rounded" rows={4} value={autoTemplate} onChange={(e) => setAutoTemplate(e.target.value)} placeholder="{name} scored {total} ({grade})" />
              </div>
              <div className="flex items-center gap-3">
                <input id="autoSign" type="checkbox" checked={autoSign} onChange={(e) => setAutoSign(e.target.checked)} />
                <label htmlFor="autoSign" className="text-sm">{t('Sign remarks as current teacher', 'توقيع الملاحظات باسم المعلم الحالي')}</label>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" onClick={() => setAutoDialogOpen(false)}>{t('Close', 'إغلاق')}</Button>
                <Button onClick={applyAutoRemarks} disabled={generatingRemarks}>{generatingRemarks ? t('Applying...', 'جارٍ التطبيق') : t('Apply to all', 'تطبيق على الكل')}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {isLocked && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-destructive text-sm">
            {t('⚠ This term is locked. Scores cannot be edited.', '⚠ هذا الفصل مقفل. لا يمكن تعديل الدرجات.')}
          </div>
        )}

        {!hasSessionTerm && (
          <Card className="shadow-card">
            <CardContent className="py-12 text-center text-muted-foreground">
              {t('Please select a session and term to continue.', 'يرجى اختيار السنة والفصل للمتابعة.')}
            </CardContent>
          </Card>
        )}

        {/* Step 1: All classes */}
        {hasSessionTerm && step === 'classes' && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {classLevels.map(level => {
              const arms = classArms[level.id] || [];
              return (
                <Card key={level.id} className="shadow-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{bilingualText(level.name_en, level.name_ar)}</CardTitle>
                    <CardDescription>{t(`${arms.length} arm(s)`, `${arms.length} شعبة`)}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {arms.length === 0 ? (
                      <Button
                        variant="outline"
                        className="w-full justify-between"
                        onClick={() => selectClass(level, null)}
                      >
                        <span className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {bilingualText(level.name_en, level.name_ar)}
                        </span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    ) : (
                      arms.map(arm => (
                        <Button
                          key={arm.id}
                          variant="outline"
                          className="w-full justify-between"
                          onClick={() => selectClass(level, arm)}
                        >
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

        {/* Step 2: Subjects for selected class */}
        {hasSessionTerm && step === 'subjects' && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-accent" />
                {t('Subjects', 'المواد')} — {bilingualText(selectedClassLevel?.name_en, selectedClassLevel?.name_ar)} {selectedClassArm?.name}
              </CardTitle>
              <CardDescription>{t('Select a subject to enter scores', 'اختر مادة لإدخال الدرجات')}</CardDescription>
            </CardHeader>
            <CardContent>
              {subjects.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">{t('No subjects found for this class level.', 'لا توجد مواد لهذه المرحلة.')}</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {subjects.map(sub => (
                    <Button
                      key={sub.id}
                      variant="outline"
                      className="justify-between h-auto py-3"
                      onClick={() => selectSubject(sub)}
                    >
                      <div className="text-left">
                        <div className="font-medium">{sub.name}</div>
                        {sub.name_ar && <div className="text-xs text-muted-foreground">{sub.name_ar}</div>}
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0" />
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Score entry */}
        {hasSessionTerm && step === 'scores' && (
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-accent" />
                  {t(selectedSubject?.name, selectedSubject?.name_ar)}
                </CardTitle>
                <CardDescription>
                  {bilingualText(selectedClassLevel?.name_en, selectedClassLevel?.name_ar)} {selectedClassArm?.name} — {scores.length} {t('students', 'طالب')}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setAutoDialogOpen(true)} disabled={scores.length === 0 || !termId}>{t('Auto Remarks', 'تطبيق ملاحظات تلقائياً')}</Button>
                <Button onClick={handleSave} disabled={saving || isLocked || scores.length === 0}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {t('Save All', 'حفظ الكل')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {scores.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">{t('No students found in this class arm.', 'لا يوجد طلاب في هذه الشعبة.')}</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8">#</TableHead>
                        <TableHead>{t('Student', 'الطالب')}</TableHead>
                        <TableHead className="w-24 text-center">{t('CA1 (15)', 'اختبار١ (١٥)')}</TableHead>
                        <TableHead className="w-24 text-center">{t('CA2 (15)', 'اختبار٢ (١٥)')}</TableHead>
                        <TableHead className="w-24 text-center">{t('Exam (60)', 'امتحان (٦٠)')}</TableHead>
                        <TableHead className="w-20 text-center">{t('Total', 'المجموع')}</TableHead>
                        <TableHead className="w-16 text-center">{t('Grade', 'التقدير')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scores.map((s, i) => {
                        const total = s.ca1 + s.ca2 + s.exam;
                        const grade = calculateGrade(total);
                        return (
                          <TableRow key={s.student_id}>
                            <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                            <TableCell className="font-medium">{s.student_name}</TableCell>
                            <TableCell>
                              <Input type="number" min={0} max={15} value={s.ca1}
                                onChange={e => updateScore(i, 'ca1', e.target.value)}
                                className="h-8 text-center" disabled={isLocked} />
                            </TableCell>
                            <TableCell>
                              <Input type="number" min={0} max={15} value={s.ca2}
                                onChange={e => updateScore(i, 'ca2', e.target.value)}
                                className="h-8 text-center" disabled={isLocked} />
                            </TableCell>
                            <TableCell>
                              <Input type="number" min={0} max={60} value={s.exam}
                                onChange={e => updateScore(i, 'exam', e.target.value)}
                                className="h-8 text-center" disabled={isLocked} />
                            </TableCell>
                            <TableCell className="text-center font-semibold">{total}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant={
                                grade === 'A' ? 'default' :
                                grade === 'B' ? 'secondary' :
                                grade === 'F' ? 'destructive' : 'outline'
                              }>{grade}</Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      
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

export default AdminResults;
