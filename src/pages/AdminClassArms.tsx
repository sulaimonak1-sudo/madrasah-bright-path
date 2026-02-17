import { useLanguage } from '@/contexts/LanguageContext';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mockClassArms, mockClassLevels } from '@/data/mockData';
import { Plus } from 'lucide-react';

const AdminClassArms = () => {
  const { t, bilingualText } = useLanguage();

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t('Class Arms', 'الشعب')}</h1>
            <p className="text-muted-foreground">{t('Manage class arms (unlimited per level)', 'إدارة الشعب (غير محدودة لكل مرحلة)')}</p>
          </div>
          <Button size="sm"><Plus className="mr-2 h-4 w-4" />{t('Add Arm', 'إضافة شعبة')}</Button>
        </div>
        <Card className="shadow-card">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('Class Level', 'المرحلة')}</TableHead>
                  <TableHead>{t('Arm', 'الشعبة')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockClassArms.map(arm => {
                  const level = mockClassLevels.find(l => l.id === arm.class_level_id);
                  return (
                    <TableRow key={arm.id}>
                      <TableCell>{bilingualText(level?.name_en, level?.name_ar)}</TableCell>
                      <TableCell className="font-medium">{arm.name}</TableCell>
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

export default AdminClassArms;
