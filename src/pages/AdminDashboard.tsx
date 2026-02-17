import { useLanguage } from '@/contexts/LanguageContext';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboardStats } from '@/data/mockData';
import { Users, Layers, BookOpen, TrendingUp, Calendar, FolderOpen, Award, BarChart3 } from 'lucide-react';

const statCards = [
  { key: 'totalStudents', icon: Users, label_en: 'Total Students', label_ar: 'إجمالي الطلاب', color: 'text-primary' },
  { key: 'totalClasses', icon: Layers, label_en: 'Class Levels', label_ar: 'المراحل الدراسية', color: 'text-info' },
  { key: 'totalArms', icon: FolderOpen, label_en: 'Total Arms', label_ar: 'إجمالي الشعب', color: 'text-accent' },
  { key: 'totalSubjects', icon: BookOpen, label_en: 'Subjects', label_ar: 'المواد', color: 'text-success' },
];

const AdminDashboard = () => {
  const { t } = useLanguage();

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
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
