import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AdminLayout } from '@/components/AdminLayout';
import { InstallPrompt } from '@/components/InstallPrompt';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Users, Layers, BookOpen, FolderOpen, Calendar, Award, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
// using native textarea to avoid runtime bundling issues

const statCards = [
  { key: 'totalStudents', icon: Users, label_en: 'Total Students', label_ar: 'إجمالي الطلاب', color: 'text-primary' },
  { key: 'totalClasses', icon: Layers, label_en: 'Class Levels', label_ar: 'المراحل الدراسية', color: 'text-[hsl(var(--info))]' },
  { key: 'totalArms', icon: FolderOpen, label_en: 'Total Arms', label_ar: 'إجمالي الشعب', color: 'text-accent' },
  { key: 'totalSubjects', icon: BookOpen, label_en: 'Subjects', label_ar: 'المواد', color: 'text-[hsl(var(--success))]' },
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
          supabase.from('students').select('id', { count: 'exact' }),
          supabase.from('class_levels').select('id', { count: 'exact' }),
          supabase.from('class_arms').select('id', { count: 'exact' }),
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
          const { data: rows } = await supabase.from('term_scores').select('student_id,total').eq('term_id', currentTermId);
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
  }, []);


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
        <div>
          <h1 className="text-2xl font-bold">{t('Dashboard', 'لوحة التحكم')}</h1>
          <p className="text-muted-foreground">{t('Overview of your Madrasah result portal', 'نظرة عامة على بوابة نتائج المدرسة')}</p>
        </div>

        {/* Install PWA Prompt */}
        <InstallPrompt />

        {/* Stats */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map(card => (
            <Card key={card.key} className="shadow-card rounded-2xl touch-auto transition-transform duration-200 active:scale-95 hover:shadow-lg">
              <CardContent className="flex items-center gap-4 p-6 md:p-5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-muted">
                  <card.icon className={`h-7 w-7 ${card.color}`} />
                </div>
                <div>
                  <p className="text-sm md:text-xs text-muted-foreground">{t(card.label_en, card.label_ar)}</p>
                  <p className="text-2xl md:text-xl font-bold">{(stats as any)[card.key]}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Info */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="shadow-card rounded-2xl transition-transform duration-200 active:scale-95">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-accent" />
                {t('Current Session', 'السنة الدراسية الحالية')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('Session', 'السنة')}</span>
                <span className="font-semibold">{stats.activeSession}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('Current Term', 'الفصل الحالي')}</span>
                <span className="font-semibold">{stats.currentTerm}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card rounded-2xl transition-transform duration-200 active:scale-95">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Award className="h-5 w-5 text-accent" />
                {t('Performance', 'الأداء')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('Avg. Score', 'متوسط الدرجات')}</span>
                <span className="font-semibold">{stats.averageScore}%</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Head Teacher Tiered Remarks (admin only) */}
        {isAdmin && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">{t("Head Teacher's Tiered Remarks", 'ملاحظات مدير المدرسة حسب الدرجة')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-w-lg">
                {REMARK_TIERS.map(tier => (
                  <div key={tier.label} className="space-y-1">
                    <Label className="text-xs font-semibold">{tier.label} ({tier.min}–{tier.max}%)</Label>
                    <textarea
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={headRemarks[`${tier.min}-${tier.max}`] || ''}
                      onChange={e => setHeadRemarks(prev => ({ ...prev, [`${tier.min}-${tier.max}`]: e.target.value }))}
                      rows={2}
                      placeholder={t(`Remark for students scoring ${tier.label}`, `ملاحظة للطلاب بدرجة ${tier.label}`)}
                    />
                  </div>
                ))}
                <div className="flex justify-end">
                  <Button onClick={saveHeadRemarks} disabled={savingRemarks} size="sm">
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
