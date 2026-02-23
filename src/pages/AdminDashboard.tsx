import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AdminLayout } from '@/components/AdminLayout';
import { InstallPrompt } from '@/components/InstallPrompt';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// ...existing code...
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Layers, BookOpen, FolderOpen, Calendar, Award, Plus, Trash2, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger } from '@/components/ui/dialog';

const statCards = [
  { key: 'totalStudents', icon: Users, label_en: 'Total Students', label_ar: 'إجمالي الطلاب', color: 'text-primary' },
  { key: 'totalClasses', icon: Layers, label_en: 'Class Levels', label_ar: 'المراحل الدراسية', color: 'text-info' },
  { key: 'totalArms', icon: FolderOpen, label_en: 'Total Arms', label_ar: 'إجمالي الشعب', color: 'text-accent' },
  { key: 'totalSubjects', icon: BookOpen, label_en: 'Subjects', label_ar: 'المواد', color: 'text-success' },
];



import { useAuth } from '@/contexts/AuthContext';
import { MessageSquare, Upload } from 'lucide-react';
import { useRef } from 'react';
// using native textarea to avoid runtime bundling issues

const REMARK_TIERS = [
  { min: 0, max: 44, label: 'Below 45' },
  { min: 45, max: 55, label: '45 - 55' },
  { min: 56, max: 70, label: '56 - 70' },
  { min: 71, max: 100, label: '71 and above' },
];

const AdminDashboard = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user, isTeacher } = useAuth();
  const [teacherStudents, setTeacherStudents] = useState<any[]>([]);
  const [teacherClassArmId, setTeacherClassArmId] = useState<string | null>(null);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [uploadingSig, setUploadingSig] = useState(false);
  const [teacherRemarks, setTeacherRemarks] = useState<Record<string, string>>({});
  const [savingTeacherRemarks, setSavingTeacherRemarks] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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


  // Fetch teacher's assigned class arm, students, signature, and remarks
  useEffect(() => {
    if (!isTeacher || !user) return;
    (async () => {
      // Get teacher's assigned class arm
      const { data: profile } = await supabase.from('profiles').select('class_teacher_class_arm_id, signature_url').eq('user_id', user.id).maybeSingle();
      const armId = profile?.class_teacher_class_arm_id || null;
      setTeacherClassArmId(armId);
      setSignatureUrl(profile?.signature_url || null);
      if (armId) {
        // Get students in this arm
        const { data: students } = await supabase.from('students').select('*').eq('class_arm_id', armId).eq('status', 'active').order('full_name');
        setTeacherStudents(students || []);
        // Get remarks
        const { data: tRemarks } = await supabase.from('tiered_remarks').select('*').eq('role', 'teacher').eq('class_arm_id', armId);
        const map: Record<string, string> = {};
        (tRemarks || []).forEach((r: any) => {
          map[`${r.min_score}-${r.max_score}`] = r.remark_en;
        });
        setTeacherRemarks(map);
      }
    })();
  }, [isTeacher, user]);

  // Signature upload handler
  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingSig(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `signatures/${user.id}.${fileExt}`;
      const { error: uploadErr } = await supabase.storage.from('public').upload(filePath, file, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { data } = supabase.storage.from('public').getPublicUrl(filePath);
      const url = data.publicUrl;
      setSignatureUrl(url);
      // Save to profile
      await supabase.from('profiles').update({ signature_url: url }).eq('user_id', user.id);
      toast({ title: t('Signature uploaded'), description: t('Your signature has been updated.') });
    } catch (err: any) {
      toast({ title: t('Error'), description: err.message || String(err), variant: 'destructive' });
    } finally {
      setUploadingSig(false);
    }
  };

  // Save teacher remarks
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
      toast({ title: t('Saved'), description: t('Teacher remarks saved successfully') });
    } catch (err: any) {
      toast({ title: t('Error'), description: err.message, variant: 'destructive' });
    } finally {
      setSavingTeacherRemarks(false);
    }
  };

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

        {/* Report Settings */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">{t('Report Settings', 'إعدادات التقرير')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-w-lg">
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={includeQr} onChange={e => setIncludeQr(e.target.checked)} />
                <span className="text-sm">{t('Include QR on report', 'إظهار رمز الاستجابة السريعة في التقرير')}</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={remarksEnabled} onChange={e => setRemarksEnabled(e.target.checked)} />
                <span className="text-sm">{t("Enable remarks fields", 'تفعيل حقل الملاحظات')}</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={printDateAuto} onChange={e => setPrintDateAuto(e.target.checked)} />
                <span className="text-sm">{t('Auto set report date on print', 'تعيين تاريخ التقرير تلقائياً عند الطباعة')}</span>
              </label>
              <div className="flex justify-end">
                <Button onClick={saveSettings} disabled={savingSettings} size="sm">
                  {savingSettings ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {t('Save Settings', 'حفظ الإعدادات')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Head Teacher Tiered Remarks (hidden for teachers) */}
        {!isTeacher && (
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

      {/* Teacher Section: Only visible to teachers */}
      {isTeacher && (
        <div className="space-y-8">
          <Card className="shadow-card border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-primary" />
                {t("My Students", "طلابي")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {teacherClassArmId ? (
                teacherStudents.length === 0 ? (
                  <p className="text-muted-foreground">{t('No students found in your class arm.', 'لا يوجد طلاب في شعبتك.')}</p>
                ) : (
                  <div className="overflow-x-auto max-h-[40vh]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>#</TableHead>
                          <TableHead>{t('Student ID', 'رقم الطالب')}</TableHead>
                          <TableHead>{t('Name', 'الاسم')}</TableHead>
                          <TableHead>{t('Gender', 'الجنس')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {teacherStudents.map((student, i) => (
                          <TableRow key={student.id}>
                            <TableCell>{i + 1}</TableCell>
                            <TableCell className="font-mono text-xs">{student.student_uid || '—'}</TableCell>
                            <TableCell>{student.name_en || student.full_name}</TableCell>
                            <TableCell className="capitalize">{student.gender || '—'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )
              ) : (
                <p className="text-muted-foreground">{t('No class arm assigned to you.', 'لم يتم تعيين شعبة لك.')}</p>
              )}
            </CardContent>
          </Card>

          {/* Signature Upload */}
          <Card className="shadow-card border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Upload className="h-5 w-5 text-primary" />
                {t('Upload Signature', 'رفع التوقيع')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                {signatureUrl ? (
                  <img src={signatureUrl} alt="Signature" className="h-12 w-32 object-contain border rounded bg-white" />
                ) : (
                  <span className="text-muted-foreground">{t('No signature uploaded', 'لم يتم رفع توقيع')}</span>
                )}
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleSignatureUpload}
                  disabled={uploadingSig}
                />
                <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploadingSig}>
                  {uploadingSig ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  {t('Upload', 'رفع')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Teacher Remarks Editor */}
          <Card className="shadow-card border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="h-5 w-5 text-primary" />
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
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminDashboard;
