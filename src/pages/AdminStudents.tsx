import { useLanguage } from '@/contexts/LanguageContext';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { mockStudents, mockClassLevels, mockClassArms } from '@/data/mockData';
import { Plus, Upload, Search } from 'lucide-react';
import { useState } from 'react';

const AdminStudents = () => {
  const { t, bilingualText } = useLanguage();
  const [search, setSearch] = useState('');

  const filtered = mockStudents.filter(s =>
    s.name_en.toLowerCase().includes(search.toLowerCase()) ||
    s.student_id.toLowerCase().includes(search.toLowerCase()) ||
    (s.name_ar && s.name_ar.includes(search))
  );

  const getClassName = (levelId: string, armId: string) => {
    const level = mockClassLevels.find(c => c.id === levelId);
    const arm = mockClassArms.find(a => a.id === armId);
    return `${bilingualText(level?.name_en, level?.name_ar)} ${arm?.name || ''}`;
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t('Students', 'الطلاب')}</h1>
            <p className="text-muted-foreground">{t('Manage student records', 'إدارة سجلات الطلاب')}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Upload className="mr-2 h-4 w-4" />
              {t('Import CSV', 'استيراد CSV')}
            </Button>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              {t('Add Student', 'إضافة طالب')}
            </Button>
          </div>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder={t('Search students...', 'البحث عن طالب...')}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('Student ID', 'رقم الطالب')}</TableHead>
                  <TableHead>{t('Name', 'الاسم')}</TableHead>
                  <TableHead>{t('Class', 'الصف')}</TableHead>
                  <TableHead>{t('Gender', 'الجنس')}</TableHead>
                  <TableHead>{t('Status', 'الحالة')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(student => (
                  <TableRow key={student.id}>
                    <TableCell className="font-mono text-sm">{student.student_id}</TableCell>
                    <TableCell className="font-medium">{bilingualText(student.name_en, student.name_ar)}</TableCell>
                    <TableCell>{getClassName(student.class_level_id, student.class_arm_id)}</TableCell>
                    <TableCell className="capitalize">{t(student.gender, student.gender === 'male' ? 'ذكر' : 'أنثى')}</TableCell>
                    <TableCell>
                      <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
                        {t(student.status, student.status === 'active' ? 'نشط' : 'غير نشط')}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminStudents;
