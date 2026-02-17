import { useLanguage } from '@/contexts/LanguageContext';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mockSubjects, mockClassLevels } from '@/data/mockData';
import { Plus } from 'lucide-react';

const AdminSubjects = () => {
  const { t, bilingualText } = useLanguage();

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t('Subjects', 'المواد الدراسية')}</h1>
            <p className="text-muted-foreground">{t('Manage subjects per class level', 'إدارة المواد لكل مرحلة')}</p>
          </div>
          <Button size="sm"><Plus className="mr-2 h-4 w-4" />{t('Add Subject', 'إضافة مادة')}</Button>
        </div>
        <Card className="shadow-card">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('Subject (EN)', 'المادة (إنجليزي)')}</TableHead>
                  <TableHead>{t('Subject (AR)', 'المادة (عربي)')}</TableHead>
                  <TableHead>{t('Class Level', 'المرحلة')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockSubjects.map(sub => {
                  const level = mockClassLevels.find(l => l.id === sub.class_level_id);
                  return (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">{sub.name_en}</TableCell>
                      <TableCell className="font-arabic">{sub.name_ar || '—'}</TableCell>
                      <TableCell>{bilingualText(level?.name_en, level?.name_ar)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminSubjects;
