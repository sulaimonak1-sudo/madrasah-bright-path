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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const AdminPromotion = () => {
  const { t, bilingualText } = useLanguage();
  const { toast } = useToast();
  const [sessionId, setSessionId] = useState('');
  const [classId, setClassId] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [classLevels, setClassLevels] = useState<any[]>([]);
  const [promotionPreview, setPromotionPreview] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: s } = await supabase.from('sessions').select('*').order('name');
        setSessions((s as any[]) || []);
        const { data: cl } = await supabase.from('class_levels').select('*').order('display_order');
        setClassLevels((cl as any[]) || []);
      } catch (err) {
        toast({ title: t('Error loading data', 'خطأ في تحميل البيانات'), description: String(err) });
      }
    };
    load();
  }, []);

  // Build promotion preview using real data
  const buildPromotionPreview = async () => {
    if (!sessionId || !classId) return;
    setLoading(true);
    try {
      // fetch students in class level
      const { data: students } = await supabase.from('students').select('*').eq('class_level_id', classId);

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
      setShowPreview(true);
    } catch (err) {
      toast({ title: t('Failed to build preview', 'فشل في إنشاء المعاينة'), description: String(err) });
    } finally {
      setLoading(false);
    }
  };

  const commitPromotion = async () => {
    if (!sessionId || !classId) return;
    setLoading(true);
    const toInsert: any[] = [];
    const toUpdateStudents: any[] = [];
    try {
      // load class levels to find next
      const { data: cl } = await supabase.from('class_levels').select('*').order('display_order');
      const ordered = (cl || []) as any[];
      const currentIndex = ordered.findIndex((c) => c.id === classId);

      for (const s of promotionPreview) {
        const promoted = s.status === 'PROMOTED';
        const nextLevel = promoted && currentIndex >= 0 && currentIndex < ordered.length - 1 ? ordered[currentIndex + 1] : null;

        toInsert.push({
          student_id: s.id,
          session_id: sessionId,
          from_class_level_id: classId,
          to_class_level_id: nextLevel?.id || null,
          cumulative_average: s.cumulativeAvg || 0,
          status: s.status,
          promoted_at: new Date().toISOString(),
        });

        if (promoted && nextLevel) {
          toUpdateStudents.push({ id: s.id, class_level_id: nextLevel.id });
        }
      }

      // insert promotion_records
      if (toInsert.length) {
        const { error: insertErr } = await supabase.from('promotion_records').insert(toInsert as any[]);
        if (insertErr) throw insertErr;
      }

      // batch update students
      for (const u of toUpdateStudents) {
        const { error: updErr } = await supabase.from('students').update({ class_level_id: u.class_level_id }).eq('id', u.id);
        if (updErr) throw updErr;
      }

      toast({ title: t('Promotion committed', 'تم تأكيد الترقية') });
    } catch (err) {
      toast({ title: t('Failed to commit', 'فشل في التأكيد'), description: String(err) });
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
                    <TableHead>{t('Student ID', 'رقم الطالب')}</TableHead>
                    <TableHead>{t('Name', 'الاسم')}</TableHead>
                    <TableHead>{t('Cumulative Avg', 'المتوسط التراكمي')}</TableHead>
                    <TableHead>{t('Status', 'الحالة')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promotionPreview.map(s => (
                    <TableRow key={s.id}>
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
              <Button className="w-full" onClick={commitPromotion} disabled={loading}>{t('Commit Promotion', 'تأكيد الترقية')}</Button>
            </div>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminPromotion;
