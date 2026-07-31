import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AdminLayout } from '@/components/AdminLayout';
import { InstallPrompt } from '@/components/InstallPrompt';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { GraduationCap, Rows3, BookText, Grid2x2, CalendarRange, TrendingUp, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useCampus } from '@/contexts/CampusContext';
// using native textarea to avoid runtime bundling issues

const statCards = [
  { key: 'totalStudents', icon: GraduationCap, label_en: 'Total Students', label_ar: 'إجمالي الطلاب', color: 'text-primary' },
  { key: 'totalClasses', icon: Rows3, label_en: 'Class Levels', label_ar: 'المراحل الدراسية', color: 'text-[hsl(var(--info))]' },
  { key: 'totalArms', icon: Grid2x2, label_en: 'Total Arms', label_ar: 'إجمالي الشعب', color: 'text-accent' },
  { key: 'totalSubjects', icon: BookText, label_en: 'Subjects', label_ar: 'المواد', color: 'text-[hsl(var(--success))]' },
];

const REMARK_TIERS = [
  { min: 0, max: 44, label: 'Below 45' },
  { min: 45, max: 55, label: '45 - 55' },
  { min: 56, max: 70, label: '56 - 70' },
  { min: 71, max: 100, label: '71 and above' },
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
        <div className="hidden md:flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary/70">{t('Today at Al-Bari', 'اليوم في البارئ')}</p>
            <h1 className="font-display text-3xl font-extrabold tracking-tight">{t('Good morning, let’s make progress.', 'صباح الخير، لننجز المزيد.')}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t('A quick view of your academic operations.', 'نظرة سريعة على العمليات الأكاديمية.')}</p>
          </div>
          <div className="hidden rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3 text-right lg:block">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-accent-foreground/60">{t('Active term', 'الفصل النشط')}</p>
            <p className="mt-1 text-sm font-bold text-accent-foreground">{stats.currentTerm || '—'}</p>
          </div>
        </div>

        <InstallPrompt />

        {/* Stats — 2‑col grid on mobile, 4‑col on desktop */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {statCards.map(card => (
            <Card key={card.key} className="group overflow-hidden border border-border/70 bg-card shadow-card rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-card-lg">
              <CardContent className="relative p-5">
                <div className="absolute right-4 top-4 h-16 w-16 rounded-full bg-primary/[0.04] transition-transform duration-500 group-hover:scale-125" />
                <div className="relative mb-7 flex h-10 w-10 items-center justify-center rounded-xl bg-muted/80">
                  <card.icon className={`h-5 w-5 ${card.color}`} strokeWidth={1.8} />
                </div>
                <p className="text-xs text-muted-foreground leading-none">{t(card.label_en, card.label_ar)}</p>
                <p className="mt-1 font-display text-3xl font-extrabold tracking-tight">{(stats as any)[card.key]}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Info — session & performance */}
        <div className="grid gap-3 md:grid-cols-2">
          <Card className="border border-border/70 bg-card shadow-card rounded-2xl">
            <CardContent className="p-4 md:p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15">
                  <CalendarRange className="h-4 w-4 text-accent" strokeWidth={1.8} />
                </div>
                <h3 className="text-sm font-semibold">{t('Current Session', 'السنة الدراسية الحالية')}</h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('Session', 'السنة')}</span>
                  <span className="font-medium">{stats.activeSession || '—'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('Current Term', 'الفصل الحالي')}</span>
                  <span className="font-medium">{stats.currentTerm || '—'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/70 bg-card shadow-card rounded-2xl">
            <CardContent className="p-4 md:p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <TrendingUp className="h-4 w-4 text-primary" strokeWidth={1.8} />
                </div>
                <h3 className="text-sm font-semibold">{t('Performance', 'الأداء')}</h3>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('Avg. Score', 'متوسط الدرجات')}</span>
                <span className="font-display text-3xl font-extrabold">{stats.averageScore}%</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Head Teacher Tiered Remarks (admin only) */}
        {isAdmin && (
          <Card className="border border-border/70 bg-card shadow-card rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">{t("Head Teacher's Tiered Remarks", 'ملاحظات مدير المدرسة حسب الدرجة')}</CardTitle>
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
