import { useLanguage } from '@/contexts/LanguageContext';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mockSessions, mockClassLevels, mockStudents } from '@/data/mockData';
import { TrendingUp, Play, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

const AdminPromotion = () => {
  const { t, bilingualText } = useLanguage();
  const [sessionId, setSessionId] = useState('');
  const [classId, setClassId] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Mock promotion preview
  const promotionPreview = mockStudents
    .filter(s => s.class_level_id === classId)
    .map(s => ({
      ...s,
      cumulativeAvg: Math.floor(Math.random() * 40) + 40,
      status: Math.random() > 0.15 ? 'PROMOTED' as const : 'RETAINED' as const,
    }));

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
                    {mockSessions.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('Class Level', 'المرحلة')}</Label>
                <Select value={classId} onValueChange={setClassId}>
                  <SelectTrigger><SelectValue placeholder={t('Select class', 'اختر الصف')} /></SelectTrigger>
                  <SelectContent>
                    {mockClassLevels.map(c => <SelectItem key={c.id} value={c.id}>{bilingualText(c.name_en, c.name_ar)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={() => setShowPreview(true)} disabled={!sessionId || !classId} className="w-full">
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
                      <TableCell className="font-mono text-sm">{s.student_id}</TableCell>
                      <TableCell>{bilingualText(s.name_en, s.name_ar)}</TableCell>
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
              <Button className="w-full">{t('Commit Promotion', 'تأكيد الترقية')}</Button>
            </div>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminPromotion;
