import { useLanguage } from '@/contexts/LanguageContext';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { mockSessions, mockTerms, mockClassLevels } from '@/data/mockData';
import { FileText, Printer, Download } from 'lucide-react';
import { useState } from 'react';

const AdminReports = () => {
  const { t, bilingualText } = useLanguage();
  const [sessionId, setSessionId] = useState('');
  const [termId, setTermId] = useState('');
  const [classId, setClassId] = useState('');

  const terms = mockTerms.filter(t => t.session_id === sessionId);

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">{t('Reports', 'التقارير')}</h1>
          <p className="text-muted-foreground">{t('Generate and print academic reports', 'إنشاء وطباعة التقارير الأكاديمية')}</p>
        </div>

        <Card className="shadow-card max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-accent" />
              {t('Generate Report', 'إنشاء تقرير')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t('Session', 'السنة')}</Label>
              <Select value={sessionId} onValueChange={setSessionId}>
                <SelectTrigger><SelectValue placeholder={t('Select session', 'اختر السنة')} /></SelectTrigger>
                <SelectContent>{mockSessions.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('Term', 'الفصل')}</Label>
              <Select value={termId} onValueChange={setTermId} disabled={!sessionId}>
                <SelectTrigger><SelectValue placeholder={t('Select term', 'اختر الفصل')} /></SelectTrigger>
                <SelectContent>{terms.map(term => <SelectItem key={term.id} value={term.id}>{t(term.name_en, term.name_ar)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('Class Level', 'المرحلة')}</Label>
              <Select value={classId} onValueChange={setClassId}>
                <SelectTrigger><SelectValue placeholder={t('Select class', 'اختر الصف')} /></SelectTrigger>
                <SelectContent>{mockClassLevels.map(c => <SelectItem key={c.id} value={c.id}>{bilingualText(c.name_en, c.name_ar)}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="flex gap-3">
              <Button className="flex-1" disabled={!sessionId || !termId || !classId}>
                <Printer className="mr-2 h-4 w-4" />
                {t('Print All', 'طباعة الكل')}
              </Button>
              <Button variant="outline" className="flex-1" disabled={!sessionId || !termId || !classId}>
                <Download className="mr-2 h-4 w-4" />
                {t('Export PDF', 'تصدير PDF')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminReports;
