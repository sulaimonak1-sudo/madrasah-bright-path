import { useLanguage } from '@/contexts/LanguageContext';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { mockSessions, mockTerms, mockClassLevels } from '@/data/mockData';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { useState } from 'react';

const AdminResults = () => {
  const { t, bilingualText } = useLanguage();
  const [sessionId, setSessionId] = useState('');
  const [termId, setTermId] = useState('');
  const [classId, setClassId] = useState('');

  const terms = mockTerms.filter(t => t.session_id === sessionId);

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">{t('Upload Results', 'رفع النتائج')}</h1>
          <p className="text-muted-foreground">{t('Upload student results via CSV/Excel', 'رفع نتائج الطلاب عبر CSV/Excel')}</p>
        </div>

        <Card className="shadow-card max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-accent" />
              {t('Upload Results File', 'رفع ملف النتائج')}
            </CardTitle>
            <CardDescription>{t('Select the session, term, and class before uploading', 'اختر السنة والفصل والصف قبل الرفع')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
              <Label>{t('Term', 'الفصل')}</Label>
              <Select value={termId} onValueChange={setTermId} disabled={!sessionId}>
                <SelectTrigger><SelectValue placeholder={t('Select term', 'اختر الفصل')} /></SelectTrigger>
                <SelectContent>
                  {terms.map(term => <SelectItem key={term.id} value={term.id}>{t(term.name_en, term.name_ar)}</SelectItem>)}
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

            <div className="rounded-lg border-2 border-dashed p-8 text-center">
              <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">
                {t('Drag and drop your CSV/Excel file here, or click to browse', 'اسحب وأفلت ملف CSV/Excel هنا، أو انقر للتصفح')}
              </p>
              <Button variant="outline" className="mt-3" size="sm">
                {t('Browse Files', 'تصفح الملفات')}
              </Button>
            </div>

            <Button className="w-full" disabled={!sessionId || !termId || !classId}>
              <Upload className="mr-2 h-4 w-4" />
              {t('Upload & Process', 'رفع ومعالجة')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminResults;
