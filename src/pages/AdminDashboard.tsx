import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboardStats } from '@/data/mockData';
import { Users, Layers, BookOpen, TrendingUp, Calendar, FolderOpen, Award, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const statCards = [
  { key: 'totalStudents', icon: Users, label_en: 'Total Students', label_ar: 'إجمالي الطلاب', color: 'text-primary' },
  { key: 'totalClasses', icon: Layers, label_en: 'Class Levels', label_ar: 'المراحل الدراسية', color: 'text-info' },
  { key: 'totalArms', icon: FolderOpen, label_en: 'Total Arms', label_ar: 'إجمالي الشعب', color: 'text-accent' },
  { key: 'totalSubjects', icon: BookOpen, label_en: 'Subjects', label_ar: 'المواد', color: 'text-success' },
];

const AdminDashboard = () => {
  const { t } = useLanguage();

  // PIN generation section state
  const [pinStudentId, setPinStudentId] = useState('');
  const [pinTermId, setPinTermId] = useState('');
  const [generatedPin, setGeneratedPin] = useState('');
  const [loadingPin, setLoadingPin] = useState(false);
  const [pinError, setPinError] = useState('');

  // Report settings
  const [includeQr, setIncludeQr] = useState(true);
  const [remarksEnabled, setRemarksEnabled] = useState(true);
  const [printDateAuto, setPrintDateAuto] = useState(true);
  const [defaultTeacherRemark, setDefaultTeacherRemark] = useState('');
  const [defaultHeadRemark, setDefaultHeadRemark] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await supabase.from('school_settings').select('*');
        const map: Record<string, string> = {};
        (data || []).forEach((r: any) => { map[r.key] = r.value; });
        setIncludeQr(map['report.include_qr'] !== 'false');
        setRemarksEnabled(map['report.remarks_enabled'] !== 'false');
        setPrintDateAuto(map['report.print_date_auto'] !== 'false');
        setDefaultTeacherRemark(map['report.default_teacher_remark'] || '');
        setDefaultHeadRemark(map['report.default_head_remark'] || '');
      } catch (err) {
        // ignore
      }
    };
    fetchSettings();
  }, []);

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      const payload = [
        { key: 'report.include_qr', value: includeQr ? 'true' : 'false' },
        { key: 'report.remarks_enabled', value: remarksEnabled ? 'true' : 'false' },
        { key: 'report.print_date_auto', value: printDateAuto ? 'true' : 'false' },
        { key: 'report.default_teacher_remark', value: defaultTeacherRemark || '' },
        { key: 'report.default_head_remark', value: defaultHeadRemark || '' },
      ];
      await supabase.from('school_settings').upsert(payload, { onConflict: 'key' });
      toast({ title: 'Saved', description: 'Report settings saved.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || String(err), variant: 'destructive' });
    } finally {
      setSavingSettings(false);
    }
  };

  // Example: Generate random 6-digit PIN
  function randomPin() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Handler for generating PIN
  async function handleGeneratePin(e: React.FormEvent) {
    e.preventDefault();
    setLoadingPin(true);
    setPinError('');
    // Simulate API call
    setTimeout(() => {
      setGeneratedPin(randomPin());
      setLoadingPin(false);
    }, 800);
  }

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">{t('Dashboard', 'لوحة التحكم')}</h1>
          <p className="text-muted-foreground">{t('Overview of your Madrasah result portal', 'نظرة عامة على بوابة نتائج المدرسة')}</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map(card => (
            <Card key={card.key} className="shadow-card">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted">
                  <card.icon className={`h-6 w-6 ${card.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t(card.label_en, card.label_ar)}</p>
                  <p className="text-2xl font-bold">{(dashboardStats as any)[card.key]}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Info */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-accent" />
                {t('Current Session', 'السنة الدراسية الحالية')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('Session', 'السنة')}</span>
                <span className="font-semibold">{dashboardStats.activeSession}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('Current Term', 'الفصل الحالي')}</span>
                <span className="font-semibold">{dashboardStats.currentTerm}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Award className="h-5 w-5 text-accent" />
                {t('Performance', 'الأداء')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('Promotion Rate', 'معدل الترقية')}</span>
                <span className="font-semibold text-success">{dashboardStats.promotionRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('Avg. Score', 'متوسط الدرجات')}</span>
                <span className="font-semibold">{dashboardStats.averageScore}%</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* PIN Generation Section */}
        <Card className="shadow-card max-w-xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5 text-accent" />
              {t('PIN Generation', 'توليد الرقم السري')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGeneratePin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">{t('Student ID', 'رقم الطالب')}</label>
                <input
                  className="input border rounded px-3 py-2 w-full"
                  value={pinStudentId}
                  onChange={e => setPinStudentId(e.target.value)}
                  placeholder={t('Enter Student ID', 'أدخل رقم الطالب')}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">{t('Term ID', 'رقم الفصل')}</label>
                <input
                  className="input border rounded px-3 py-2 w-full"
                  value={pinTermId}
                  onChange={e => setPinTermId(e.target.value)}
                  placeholder={t('Enter Term ID', 'أدخل رقم الفصل')}
                  required
                />
              </div>
              <button
                type="submit"
                className="btn bg-primary text-white px-4 py-2 rounded w-full"
                disabled={loadingPin}
              >
                {loadingPin ? t('Generating...', 'جاري التوليد...') : t('Generate PIN', 'توليد الرقم السري')}
              </button>
            </form>
            {generatedPin && (
              <div className="mt-4 p-3 bg-muted rounded text-center">
                <span className="font-semibold text-lg">{t('Generated PIN:', 'الرقم السري المُولد:')} {generatedPin}</span>
              </div>
            )}
            {pinError && (
              <div className="mt-2 text-destructive text-sm text-center">{pinError}</div>
            )}
          </CardContent>
        </Card>
        {/* Report Settings */}
        <Card className="shadow-card max-w-xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">{t('Report Settings', 'إعدادات التقرير')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
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

              <div>
                <label className="text-sm text-muted-foreground">{t("Default Class Teacher's Remark", 'ملاحظة معلم الفصل الافتراضية')}</label>
                <textarea className="w-full border rounded px-2 py-1 mt-1" value={defaultTeacherRemark} onChange={e => setDefaultTeacherRemark(e.target.value)} rows={2} />
              </div>

              <div>
                <label className="text-sm text-muted-foreground">{t("Default Head Teacher's Remark", 'ملاحظة مدير المدرسة الافتراضية')}</label>
                <textarea className="w-full border rounded px-2 py-1 mt-1" value={defaultHeadRemark} onChange={e => setDefaultHeadRemark(e.target.value)} rows={2} />
              </div>

              <div className="flex justify-end">
                <button className="btn bg-primary text-white px-4 py-2 rounded" onClick={saveSettings} disabled={savingSettings}>
                  {savingSettings ? t('Saving...', 'جارٍ الحفظ...') : t('Save Settings', 'حفظ الإعدادات')}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
