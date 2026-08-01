import { useLanguage } from '@/contexts/LanguageContext';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, Play, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCampus } from '@/contexts/CampusContext';

const AdminPromotion = () => {
  const { t, bilingualText } = useLanguage();
  const { toast } = useToast();
  const { campusId } = useCampus();
  const [sessionId, setSessionId] = useState('');
  const [classId, setClassId] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [classLevels, setClassLevels] = useState<any[]>([]);
  const [promotionPreview, setPromotionPreview] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [targetLevelId, setTargetLevelId] = useState('');
  const [targetArmId, setTargetArmId] = useState('');
  const [targetArms, setTargetArms] = useState<any[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!targetLevelId) { setTargetArms([]); setTargetArmId(''); return; }
    supabase.from('class_arms').select('*').eq('campus_id', campusId).eq('class_level_id', targetLevelId).order('name')
      .then(({ data }) => setTargetArms(data || []));
    setTargetArmId('');
  }, [campusId, targetLevelId]);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: s } = await supabase.from('sessions').select('*').order('name');
        setSessions((s as any[]) || []);
        const { data: cl } = await supabase.from('class_levels').select('*').eq('campus_id', campusId).order('display_order');
        setClassLevels((cl as any[]) || []);
      } catch (err) {
        toast({ title: t('Error loading data', 'خطأ في تحميل البيانات'), description: String(err) });
      }
    };
    load();
  }, [campusId]);

  // Build promotion preview using real data
  const buildPromotionPreview = async () => {
    if (!sessionId || !classId) return;
    setLoading(true);
    try {
      // fetch students in class level
      const { data: students } = await supabase.from('students').select('*').eq('campus_id', campusId).eq('class_level_id', classId).eq('status', 'active');

      // fetch terms for session
      const { data: terms } = await supabase.from('terms').select('id').eq('session_id', sessionId);
      const termIds = (terms || []).map((t: any) => t.id);

      // fetch term_scores for these students and terms
      const studentIds = (students || []).map((s: any) => s.id);
      const { data: scores } = await supabase
        .from('term_scores')
        .select('student_id,total')
        .in('student_id', studentIds)
        .in('term_id', termIds as any[]);

      const scoresByStudent: Record<string, number[]> = {};
      (scores || []).forEach((sc: any) => {
        scoresByStudent[sc.student_id] = scoresByStudent[sc.student_id] || [];
        if (typeof sc.total === 'number') scoresByStudent[sc.student_id].push(sc.total);
      });

      const preview = (students || []).map((s: any) => {
        const arr = scoresByStudent[s.id] || [];
        const cumulativeAvg = arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
        const status = cumulativeAvg >= 50 ? 'PROMOTED' : 'RETAINED';
        return { ...s, cumulativeAvg, status };
      });

      setPromotionPreview(preview);
      setSelected(Object.fromEntries(preview.map((p: any) => [p.id, p.status === 'PROMOTED'])));
      setShowPreview(true);
    } catch (err) {
      toast({ title: t('Failed to build preview', 'فشل في إنشاء المعاينة'), description: String(err) });
    } finally {
      setLoading(false);
    }
  };

  const commitPromotion = async () => {
    if (!sessionId || !classId) return;
    const chosen = promotionPreview.filter(s => selected[s.id]);
    if (!chosen.length) {
      toast({ title: t('Select at least one student', 'اختر طالبًا واحدًا على الأقل'), variant: 'destructive' });
      return;
    }
    if (!targetLevelId) {
      toast({ title: t('Select the class to promote to', 'اختر الصف المراد الترقية إليه'), variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const records = chosen.map((s: any) => ({
        student_id: s.id,
        session_id: sessionId,
        from_class_level_id: classId,
        to_class_level_id: targetLevelId,
        from_arm_id: s.class_arm_id || null,
        to_arm_id: targetArmId || null,
        cumulative_average: s.cumulativeAvg || 0,
        status: 'PROMOTED',
        promoted_at: new Date().toISOString(),
      }));

      const { error: insertErr } = await supabase.from('promotion_records').insert(records as any[]);
      if (insertErr) throw insertErr;

      const { error: updErr } = await supabase
        .from('students')
        .update({ class_level_id: targetLevelId, class_arm_id: targetArmId || null })
        .in('id', chosen.map((s: any) => s.id)).eq('campus_id', campusId);
      if (updErr) throw updErr;

      toast({ title: t('Promotion committed', 'تم تأكيد الترقية'), description: `${chosen.length}` });
      setShowPreview(false);
      setPromotionPreview([]);
    } catch (err: any) {
      toast({ title: t('Failed to commit', 'فشل في التأكيد'), description: err?.message || String(err), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">{t('Promotion Manager', 'إدارة الترقية')}</h1>
          <p className="text-muted-foreground">{t('Run promotion after locking 3rd term results', 'تشغيل الترقية بعد قفل نتائج الفصل الثالث')}</p>
        </div>

        <Card className="shadow-card max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-accent" />
              {t('Run Promotion', 'تشغيل الترقية')}
            </CardTitle>
            <CardDescription>{t('≥50% cumulative average = PROMOTED, <50% = RETAINED', '≥50% متوسط تراكمي = ناجح، <50% = باقٍ')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('Session', 'السنة')}</Label>
                <Select value={sessionId} onValueChange={setSessionId}>
                  <SelectTrigger><SelectValue placeholder={t('Select session', 'اختر السنة')} /></SelectTrigger>
                  <SelectContent>
                    {sessions.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('Class Level', 'المرحلة')}</Label>
                <Select value={classId} onValueChange={setClassId}>
                  <SelectTrigger><SelectValue placeholder={t('Select class', 'اختر الصف')} /></SelectTrigger>
                  <SelectContent>
                    {classLevels.map(c => <SelectItem key={c.id} value={c.id}>{bilingualText(c.name_en, c.name_ar)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('Promote to Class Level', 'الترقية إلى المرحلة')}</Label>
                <Select value={targetLevelId} onValueChange={setTargetLevelId}>
                  <SelectTrigger><SelectValue placeholder={t('Select target class', 'اختر الصف الهدف')} /></SelectTrigger>
                  <SelectContent>
                    {classLevels.map(c => <SelectItem key={c.id} value={c.id}>{bilingualText(c.name_en, c.name_ar)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('Promote to Arm', 'الترقية إلى الشعبة')}</Label>
                <Select value={targetArmId} onValueChange={setTargetArmId} disabled={!targetLevelId || targetArms.length === 0}>
                  <SelectTrigger><SelectValue placeholder={targetArms.length ? t('Select arm', 'اختر الشعبة') : t('No arms', 'لا توجد شعب')} /></SelectTrigger>
                  <SelectContent>
                    {targetArms.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={buildPromotionPreview} disabled={!sessionId || !classId || loading} className="w-full">
              <Play className="mr-2 h-4 w-4" />
              {t('Preview Promotion', 'معاينة الترقية')}
            </Button>
          </CardContent>
        </Card>

        {showPreview && promotionPreview.length > 0 && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>{t('Promotion Preview', 'معاينة الترقية')}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>{t('Student ID', 'رقم الطالب')}</TableHead>
                    <TableHead>{t('Name', 'الاسم')}</TableHead>
                    <TableHead>{t('Cumulative Avg', 'المتوسط التراكمي')}</TableHead>
                    <TableHead>{t('Status', 'الحالة')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promotionPreview.map(s => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <Checkbox checked={!!selected[s.id]} onCheckedChange={(v) => setSelected(prev => ({ ...prev, [s.id]: !!v }))} />
                      </TableCell>
                      <TableCell className="font-mono text-sm">{s.student_uid || s.id}</TableCell>
                      <TableCell>{bilingualText(s.name_en || s.full_name, s.name_ar)}</TableCell>
                      <TableCell className="font-semibold">{s.cumulativeAvg}%</TableCell>
                      <TableCell>
                        <Badge variant={s.status === 'PROMOTED' ? 'default' : 'destructive'} className="gap-1">
                          {s.status === 'PROMOTED' ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                          {s.status === 'PROMOTED' ? t('Promoted', 'ناجح') : t('Retained', 'باقٍ')}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <div className="p-4 border-t">
              <Button className="w-full" onClick={commitPromotion} disabled={loading}>{t('Commit Promotion for Selected Students', 'تأكيد ترقية الطلاب المحددين')}</Button>
            </div>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminPromotion;
