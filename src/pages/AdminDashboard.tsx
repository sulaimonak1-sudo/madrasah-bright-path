import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AdminLayout } from '@/components/AdminLayout';
import { InstallPrompt } from '@/components/InstallPrompt';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { GraduationCap, Rows3, BookText, Grid2x2, CalendarRange, TrendingUp, Save, Loader2, ArrowUpRight, ClipboardPen, Users, Settings2, LockKeyhole, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useCampus } from '@/contexts/CampusContext';
// using native textarea to avoid runtime bundling issues

const statCards = [
  { key: 'totalStudents', icon: GraduationCap, label_en: 'Total Students', label_ar: 'إجمالي الطلاب', color: 'text-primary', tint: 'bg-primary/10' },
  { key: 'totalClasses', icon: Rows3, label_en: 'Class Levels', label_ar: 'المراحل الدراسية', color: 'text-[hsl(var(--info))]', tint: 'bg-[hsl(var(--info)/0.12)]' },
  { key: 'totalArms', icon: Grid2x2, label_en: 'Total Arms', label_ar: 'إجمالي الشعب', color: 'text-accent-foreground', tint: 'bg-accent/25' },
  { key: 'totalSubjects', icon: BookText, label_en: 'Subjects', label_ar: 'المواد', color: 'text-[hsl(var(--success))]', tint: 'bg-[hsl(var(--success)/0.12)]' },
];

const REMARK_TIERS = [
  { min: 0, max: 44, label: 'Below 45' },
  { min: 45, max: 55, label: '45 - 55' },
  { min: 56, max: 70, label: '56 - 70' },
  { min: 71, max: 100, label: '71 and above' },
];

const quickActions = [
  { to: '/admin/results', icon: ClipboardPen, label_en: 'Enter results', label_ar: 'إدخال النتائج', detail_en: 'Update marks for a class', detail_ar: 'تحديث درجات فصل' },
  { to: '/admin/students', icon: Users, label_en: 'Manage students', label_ar: 'إدارة الطلاب', detail_en: 'View your student directory', detail_ar: 'عرض دليل الطلاب' },
  { to: '/admin/reports', icon: ArrowUpRight, label_en: 'Open reports', label_ar: 'فتح التقارير', detail_en: 'Review term performance', detail_ar: 'مراجعة أداء الفصل' },
];

const AdminDashboard = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user, isTeacher, isAdmin } = useAuth();
  const { campusId } = useCampus();

  // Report settings
  const [includeQr, setIncludeQr] = useState(true);
  const [remarksEnabled, setRemarksEnabled] = useState(true);
  const [printDateAuto, setPrintDateAuto] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  // Tiered head teacher remarks
  const [headRemarks, setHeadRemarks] = useState<Record<string, string>>({});
  const [savingRemarks, setSavingRemarks] = useState(false);

  const [stats, setStats] = useState({
    totalStudents: 0,
    totalClasses: 0,
    totalArms: 0,
    totalSubjects: 0,
    activeSession: '',
    currentTerm: '',
    averageScore: 0,
  });


  // Fetch overall dashboard stats (counts, active session/term, average score)
  useEffect(() => {
    (async () => {
      try {
        const [studentsRes, classesRes, armsRes, subjectsRes] = await Promise.all([
          supabase.from('students').select('id', { count: 'exact' }).eq('campus_id', campusId),
          supabase.from('class_levels').select('id', { count: 'exact' }).eq('campus_id', campusId),
          supabase.from('class_arms').select('id', { count: 'exact' }).eq('campus_id', campusId),
          supabase.from('subjects').select('id', { count: 'exact' }),
        ]);

        const activeSessionRes = await supabase.from('sessions').select('id,name').eq('is_active', true).maybeSingle();
        let currentTermName = '';
        let currentTermId: string | null = null;
        if (activeSessionRes.data?.id) {
          const termRes = await supabase.from('terms').select('*').eq('session_id', activeSessionRes.data.id).order('term_number', { ascending: false }).limit(1).maybeSingle();
          if (termRes.data) {
            currentTermName = termRes.data.name_en || termRes.data.name_ar || '';
            currentTermId = termRes.data.id;
          }
        }

        // Compute average score for current term (if available)
        let avgScore = 0;
        if (currentTermId) {
          const { data: campusStudents } = await supabase.from('students').select('id').eq('campus_id', campusId);
          const { data: rows } = await supabase.from('term_scores').select('student_id,total').eq('term_id', currentTermId).in('student_id', (campusStudents || []).map(s => s.id));
          if (rows && rows.length > 0) {
            const byStudent: Record<string, number[]> = {};
            rows.forEach((r: any) => {
              if (r.total == null) return;
              byStudent[r.student_id] = byStudent[r.student_id] || [];
              byStudent[r.student_id].push(r.total);
            });
            const studentAverages = Object.values(byStudent).map(arr => arr.reduce((a, b) => a + b, 0) / arr.length);
            if (studentAverages.length > 0) {
              avgScore = Math.round(studentAverages.reduce((a, b) => a + b, 0) / studentAverages.length);
            }
          }
        }

        setStats({
          totalStudents: Number(studentsRes.count || 0),
          totalClasses: Number(classesRes.count || 0),
          totalArms: Number(armsRes.count || 0),
          totalSubjects: Number(subjectsRes.count || 0),
          activeSession: activeSessionRes.data?.name || '',
          currentTerm: currentTermName,
          averageScore: avgScore,
        });
      } catch (err) {
        // silently ignore dashboard stat errors
      }
    })();
  }, [campusId]);


  // Load settings + tiered remarks
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.from('school_settings').select('*');
        const map: Record<string, string> = {};
        (data || []).forEach((r: any) => { map[r.key] = r.value; });
        setIncludeQr(map['report.include_qr'] !== 'false');
        setRemarksEnabled(map['report.remarks_enabled'] !== 'false');
        setPrintDateAuto(map['report.print_date_auto'] !== 'false');
      } catch (err) {}
    })();

    // Load head teacher tiered remarks
    (async () => {
      const { data } = await supabase.from('tiered_remarks').select('*').eq('role', 'head').is('class_arm_id', null);
      const map: Record<string, string> = {};
      (data || []).forEach((r: any) => {
        map[`${r.min_score}-${r.max_score}`] = r.remark_en;
      });
      setHeadRemarks(map);
    })();
  }, []);

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      const payload = [
        { key: 'report.include_qr', value: includeQr ? 'true' : 'false' },
        { key: 'report.remarks_enabled', value: remarksEnabled ? 'true' : 'false' },
        { key: 'report.print_date_auto', value: printDateAuto ? 'true' : 'false' },
      ];
      await supabase.from('school_settings').upsert(payload, { onConflict: 'key' });
      toast({ title: 'Saved', description: 'Report settings saved.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || String(err), variant: 'destructive' });
    } finally {
      setSavingSettings(false);
    }
  };

  const saveHeadRemarks = async () => {
    setSavingRemarks(true);
    try {
      // Delete existing head remarks (global, no class_arm_id)
      await supabase.from('tiered_remarks').delete().eq('role', 'head').is('class_arm_id', null);
      // Insert new ones
      const inserts = REMARK_TIERS.map(tier => ({
        role: 'head' as const,
        class_arm_id: null,
        min_score: tier.min,
        max_score: tier.max,
        remark_en: headRemarks[`${tier.min}-${tier.max}`] || '',
        remark_ar: '',
      })).filter(r => r.remark_en.trim());
      if (inserts.length > 0) {
        await supabase.from('tiered_remarks').insert(inserts);
      }
      toast({ title: 'Saved', description: 'Head teacher remarks saved.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSavingRemarks(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in pb-20 md:pb-0">
        {/* Page heading — hidden on mobile since header shows title */}
        <div className="hidden items-end justify-between gap-4 md:flex">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{t('School operations', 'عمليات المدرسة')}</p>
            <h1 className="font-display text-3xl font-extrabold tracking-tight">{t('Dashboard overview', 'نظرة عامة على لوحة التحكم')}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t('Monitor academic activity and keep your records moving.', 'راقب النشاط الأكاديمي وحافظ على تحديث سجلاتك.')}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden rounded-xl border border-border bg-card px-3 py-2 text-right lg:block">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{t('Active term', 'الفصل النشط')}</p>
              <p className="mt-1 text-sm font-bold text-foreground">{stats.currentTerm || '—'}</p>
            </div>
            <Link to="/admin/results" className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">
              <Plus className="h-4 w-4" />
              {t('Enter results', 'إدخال النتائج')}
            </Link>
          </div>
        </div>

        <InstallPrompt />

        <div className="grid gap-5 xl:grid-cols-[1.35fr_0.85fr]">
          <Card className="overflow-hidden border border-border/70 bg-card shadow-card rounded-2xl">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col justify-between gap-8 md:flex-row md:items-center">
                <div>
                  <div className="mb-5 flex items-center gap-2 text-primary">
                    <TrendingUp className="h-4 w-4" strokeWidth={2} />
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em]">{t('Performance overview', 'نظرة عامة على الأداء')}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{t('Average student score', 'متوسط درجات الطلاب')}</p>
                  <div className="mt-2 flex items-end gap-3">
                    <span className="font-display text-6xl font-extrabold tracking-tight text-foreground">{stats.averageScore}</span>
                    <span className="mb-2 text-lg font-semibold text-muted-foreground">%</span>
                  </div>
                  <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">{t('Average across recorded subject scores for the active term.', 'المتوسط عبر درجات المواد المسجلة للفصل النشط.')}</p>
                </div>
                <div className="w-full max-w-[230px]">
                  <div className="mb-2 flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <span>{t('Score index', 'مؤشر الدرجات')}</span><span>{stats.averageScore}%</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary transition-all duration-1000" style={{ width: `${Math.min(stats.averageScore, 100)}%` }} />
                  </div>
                  <div className="mt-3 flex justify-between text-[10px] text-muted-foreground"><span>0</span><span>50</span><span>100</span></div>
                </div>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-3 border-t border-border pt-5 md:grid-cols-3">
                <div><p className="text-[10px] uppercase tracking-widest text-muted-foreground">{t('Session', 'السنة')}</p><p className="mt-1 truncate text-sm font-bold">{stats.activeSession || '—'}</p></div>
                <div><p className="text-[10px] uppercase tracking-widest text-muted-foreground">{t('Term', 'الفصل')}</p><p className="mt-1 truncate text-sm font-bold">{stats.currentTerm || '—'}</p></div>
                <div className="hidden md:block"><p className="text-[10px] uppercase tracking-widest text-muted-foreground">{t('Status', 'الحالة')}</p><p className="mt-1 flex items-center gap-1.5 text-sm font-bold"><span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--success))]" />{t('Active', 'نشط')}</p></div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/70 bg-card shadow-card rounded-2xl">
            <CardHeader className="flex-row items-start justify-between space-y-0 pb-3">
              <div><CardTitle className="font-display text-lg font-extrabold">{t('Work queue', 'قائمة العمل')}</CardTitle><CardDescription className="mt-1">{t('Common tasks for today', 'المهام الشائعة اليوم')}</CardDescription></div>
              <LockKeyhole className="h-5 w-5 text-muted-foreground" strokeWidth={1.8} />
            </CardHeader>
            <CardContent className="space-y-2">
              {quickActions.map(action => (
                <Link key={action.to} to={action.to} className="group flex items-center gap-3 rounded-2xl border border-transparent p-3 transition-colors hover:border-border hover:bg-muted/60">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><action.icon className="h-4 w-4" /></div>
                  <div className="min-w-0 flex-1"><p className="text-sm font-bold">{t(action.label_en, action.label_ar)}</p><p className="truncate text-xs text-muted-foreground">{t(action.detail_en, action.detail_ar)}</p></div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Operational inventory */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {statCards.map(card => (
            <Card key={card.key} className="group overflow-hidden border border-border/60 surface-panel rounded-2xl card-interactive animate-scale-in">
              <CardContent className="relative p-5">
                <div className={`relative mb-7 flex h-11 w-11 items-center justify-center rounded-xl ${card.tint}`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} strokeWidth={1.8} />
                </div>
                <p className="text-xs text-muted-foreground leading-none">{t(card.label_en, card.label_ar)}</p>
                <p className="mt-1 font-display text-3xl font-extrabold tracking-tight md:text-4xl">{(stats as any)[card.key]}</p>
                <span className="pointer-events-none absolute inset-x-5 bottom-0 h-px bg-accent/30 opacity-0 transition-opacity group-hover:opacity-100" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-dashed border-border bg-card/60 px-4 py-3">
          <div className="flex items-center gap-3"><CalendarRange className="h-4 w-4 text-primary" /><span className="text-sm font-semibold">{t('Academic cycle', 'الدورة الأكاديمية')}</span><span className="hidden text-xs text-muted-foreground sm:inline">{stats.activeSession || '—'} · {stats.currentTerm || '—'}</span></div>
          <Link to="/admin/sessions" className="text-xs font-bold text-primary hover:underline">{t('Manage', 'إدارة')}</Link>
        </div>

        {/* Head Teacher Tiered Remarks (admin only) */}
        {isAdmin && (
          <Card className="border border-border/70 bg-card shadow-card rounded-2xl">
            <CardHeader className="flex-row items-start justify-between space-y-0 pb-3">
              <div><CardTitle className="text-base font-semibold">{t("Head Teacher's Tiered Remarks", 'ملاحظات مدير المدرسة حسب الدرجة')}</CardTitle><CardDescription className="mt-1">{t('Personalize feedback that appears on student reports.', 'تخصيص الملاحظات التي تظهر في تقارير الطلاب.')}</CardDescription></div>
              <Settings2 className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-w-lg">
                {REMARK_TIERS.map(tier => (
                  <div key={tier.label} className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">{tier.label} ({tier.min}–{tier.max}%)</Label>
                    <textarea
                      className="flex min-h-[72px] w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={headRemarks[`${tier.min}-${tier.max}`] || ''}
                      onChange={e => setHeadRemarks(prev => ({ ...prev, [`${tier.min}-${tier.max}`]: e.target.value }))}
                      rows={2}
                      placeholder={t(`Remark for students scoring ${tier.label}`, `ملاحظة للطلاب بدرجة ${tier.label}`)}
                    />
                  </div>
                ))}
                <div className="flex justify-end pt-1">
                  <Button onClick={saveHeadRemarks} disabled={savingRemarks} size="sm" className="rounded-xl">
                    {savingRemarks ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {t('Save Remarks', 'حفظ الملاحظات')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
