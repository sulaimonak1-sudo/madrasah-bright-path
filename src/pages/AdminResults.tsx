import { useLanguage } from '@/contexts/LanguageContext';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileSpreadsheet, Save, Loader2 } from 'lucide-react';
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

const AdminResults = () => {
  const { t, bilingualText } = useLanguage();
  const { toast } = useToast();
  const [sessionId, setSessionId] = useState('');
  const [termId, setTermId] = useState('');
  const [classLevelId, setClassLevelId] = useState('');
  const [classArmId, setClassArmId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [saving, setSaving] = useState(false);

  const [sessions, setSessions] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [classLevels, setClassLevels] = useState<any[]>([]);
  const [classArms, setClassArms] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [scores, setScores] = useState<ScoreEntry[]>([]);

  // Fetch sessions and class levels on mount
  useEffect(() => {
    const fetchBase = async () => {
      const [sessRes, clRes] = await Promise.all([
        supabase.from('sessions').select('*').order('name', { ascending: false }),
        supabase.from('class_levels').select('*').order('display_order'),
      ]);
      setSessions(sessRes.data || []);
      setClassLevels(clRes.data || []);
    };
    fetchBase();
  }, []);

  // Fetch terms when session changes
  useEffect(() => {
    if (!sessionId) { setTerms([]); setTermId(''); return; }
    supabase.from('terms').select('*').eq('session_id', sessionId).order('term_number')
      .then(({ data }) => setTerms(data || []));
    setTermId('');
  }, [sessionId]);

  // Fetch class arms when class level changes
  useEffect(() => {
    if (!classLevelId) { setClassArms([]); setClassArmId(''); return; }
    supabase.from('class_arms').select('*').eq('class_level_id', classLevelId)
      .then(({ data }) => setClassArms(data || []));
    setClassArmId('');
  }, [classLevelId]);

  // Fetch subjects when class level changes
  useEffect(() => {
    if (!classLevelId) { setSubjects([]); setSubjectId(''); return; }
    supabase.from('subjects').select('*').eq('class_level_id', classLevelId)
      .then(({ data }) => setSubjects(data || []));
    setSubjectId('');
  }, [classLevelId]);

  // Fetch students and existing scores when all filters are set
  useEffect(() => {
    if (!termId || !classLevelId || !classArmId || !subjectId) { setScores([]); return; }
    const fetchStudentsAndScores = async () => {
      const [studRes, scoresRes] = await Promise.all([
        supabase.from('students').select('id, full_name, name_en, name_ar, student_uid')
          .eq('class_level_id', classLevelId).eq('class_arm_id', classArmId).eq('status', 'active')
          .order('full_name'),
        supabase.from('term_scores').select('*')
          .eq('term_id', termId).eq('subject_id', subjectId),
      ]);

      const students = studRes.data || [];
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
    fetchStudentsAndScores();
  }, [termId, classLevelId, classArmId, subjectId]);

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
        subject_id: subjectId,
        term_id: termId,
        ca1: s.ca1,
        ca2: s.ca2,
        exam: s.exam,
        total: s.ca1 + s.ca2 + s.exam,
        grade: calculateGrade(s.ca1 + s.ca2 + s.exam),
      }));

      const { error } = await supabase.from('term_scores').upsert(upserts, {
        onConflict: 'student_id,subject_id,term_id',
      });

      if (error) throw error;

      toast({ title: t('Saved!', 'تم الحفظ!'), description: t(`${scores.length} scores saved successfully`, `تم حفظ ${scores.length} درجة بنجاح`) });
      
      // Refresh to get IDs
      const { data } = await supabase.from('term_scores').select('*').eq('term_id', termId).eq('subject_id', subjectId);
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

  const allFiltersSet = sessionId && termId && classLevelId && classArmId && subjectId;
  const selectedTerm = terms.find(t => t.id === termId);
  const isLocked = selectedTerm?.is_locked;

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">{t('Enter Results', 'إدخال النتائج')}</h1>
          <p className="text-muted-foreground">{t('Select filters then enter scores for each student', 'اختر الفلاتر ثم أدخل الدرجات لكل طالب')}</p>
        </div>

        {/* Filters */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-accent" />
              {t('Select Class & Subject', 'اختر الصف والمادة')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label>{t('Session', 'السنة')}</Label>
                <Select value={sessionId} onValueChange={setSessionId}>
                  <SelectTrigger><SelectValue placeholder={t('Select', 'اختر')} /></SelectTrigger>
                  <SelectContent>
                    {sessions.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('Term', 'الفصل')}</Label>
                <Select value={termId} onValueChange={setTermId} disabled={!sessionId}>
                  <SelectTrigger><SelectValue placeholder={t('Select', 'اختر')} /></SelectTrigger>
                  <SelectContent>
                    {terms.map(term => (
                      <SelectItem key={term.id} value={term.id}>
                        {t(term.name_en, term.name_ar)} {term.is_locked ? '🔒' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('Class Level', 'المرحلة')}</Label>
                <Select value={classLevelId} onValueChange={setClassLevelId}>
                  <SelectTrigger><SelectValue placeholder={t('Select', 'اختر')} /></SelectTrigger>
                  <SelectContent>
                    {classLevels.map(c => <SelectItem key={c.id} value={c.id}>{bilingualText(c.name_en, c.name_ar)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('Class Arm', 'الشعبة')}</Label>
                <Select value={classArmId} onValueChange={setClassArmId} disabled={!classLevelId}>
                  <SelectTrigger><SelectValue placeholder={t('Select', 'اختر')} /></SelectTrigger>
                  <SelectContent>
                    {classArms.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('Subject', 'المادة')}</Label>
                <Select value={subjectId} onValueChange={setSubjectId} disabled={!classLevelId}>
                  <SelectTrigger><SelectValue placeholder={t('Select', 'اختر')} /></SelectTrigger>
                  <SelectContent>
                    {subjects.map(s => <SelectItem key={s.id} value={s.id}>{t(s.name, s.name_ar)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Locked warning */}
        {isLocked && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive text-sm">
            {t('⚠ This term is locked. Scores cannot be edited.', '⚠ هذا الفصل مقفل. لا يمكن تعديل الدرجات.')}
          </div>
        )}

        {/* Score entry table */}
        {allFiltersSet && scores.length > 0 && (
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t('Student Scores', 'درجات الطلاب')}</CardTitle>
                <CardDescription>{t(`${scores.length} students`, `${scores.length} طالب`)}</CardDescription>
              </div>
              <Button onClick={handleSave} disabled={saving || isLocked}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {t('Save All', 'حفظ الكل')}
              </Button>
            </CardHeader>
            <CardContent>
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
                            <Input
                              type="number" min={0} max={15} value={s.ca1}
                              onChange={e => updateScore(i, 'ca1', e.target.value)}
                              className="h-8 text-center" disabled={isLocked}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number" min={0} max={15} value={s.ca2}
                              onChange={e => updateScore(i, 'ca2', e.target.value)}
                              className="h-8 text-center" disabled={isLocked}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number" min={0} max={60} value={s.exam}
                              onChange={e => updateScore(i, 'exam', e.target.value)}
                              className="h-8 text-center" disabled={isLocked}
                            />
                          </TableCell>
                          <TableCell className="text-center font-semibold">{total}</TableCell>
                          <TableCell className="text-center">
                            <span className={`inline-block rounded px-2 py-0.5 text-xs font-bold ${
                              grade === 'A' ? 'bg-green-100 text-green-800' :
                              grade === 'B' ? 'bg-blue-100 text-blue-800' :
                              grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                              grade === 'F' ? 'bg-red-100 text-red-800' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              {grade}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {allFiltersSet && scores.length === 0 && (
          <Card className="shadow-card">
            <CardContent className="py-12 text-center text-muted-foreground">
              {t('No students found for the selected class arm.', 'لم يتم العثور على طلاب للشعبة المختارة.')}
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminResults;
