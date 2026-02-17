import { useLanguage } from '@/contexts/LanguageContext';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mockClassLevels, mockClassArms } from '@/data/mockData';
import { Plus } from 'lucide-react';

const AdminClassLevels = () => {
  const { t, bilingualText } = useLanguage();

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t('Class Levels', 'المراحل الدراسية')}</h1>
            <p className="text-muted-foreground">{t('Manage Madrasah class levels', 'إدارة المراحل الدراسية')}</p>
          </div>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            {t('Add Level', 'إضافة مرحلة')}
          </Button>
        </div>

        <Card className="shadow-card">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('Order', 'الترتيب')}</TableHead>
                  <TableHead>{t('Name (English)', 'الاسم (إنجليزي)')}</TableHead>
                  <TableHead>{t('Name (Arabic)', 'الاسم (عربي)')}</TableHead>
                  <TableHead>{t('Arms', 'الشعب')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockClassLevels.map(level => {
                  const arms = mockClassArms.filter(a => a.class_level_id === level.id);
                  return (
                    <TableRow key={level.id}>
                      <TableCell>{level.order}</TableCell>
                      <TableCell className="font-medium">{level.name_en}</TableCell>
                      <TableCell className="font-arabic">{level.name_ar || '—'}</TableCell>
                      <TableCell>{arms.map(a => a.name).join(', ') || '—'}</TableCell>
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

export default AdminClassLevels;
