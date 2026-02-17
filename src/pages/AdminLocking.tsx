import { useLanguage } from '@/contexts/LanguageContext';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mockSessions, mockTerms } from '@/data/mockData';
import { Lock, Unlock } from 'lucide-react';

const AdminLocking = () => {
  const { t } = useLanguage();

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">{t('Result Locking', 'قفل النتائج')}</h1>
          <p className="text-muted-foreground">{t('Lock terms to prevent editing', 'قفل الفصول لمنع التعديل')}</p>
        </div>

        {mockSessions.map(session => {
          const terms = mockTerms.filter(t => t.session_id === session.id);
          return (
            <Card key={session.id} className="shadow-card">
              <CardHeader>
                <CardTitle>{session.name}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('Term', 'الفصل')}</TableHead>
                      <TableHead>{t('Status', 'الحالة')}</TableHead>
                      <TableHead className="text-right">{t('Action', 'إجراء')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {terms.map(term => (
                      <TableRow key={term.id}>
                        <TableCell className="font-medium">{t(term.name_en, term.name_ar)}</TableCell>
                        <TableCell>
                          <Badge variant={term.is_locked ? 'destructive' : 'secondary'}>
                            {term.is_locked ? t('Locked', 'مقفل') : t('Open', 'مفتوح')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm">
                            {term.is_locked ? <><Unlock className="mr-2 h-3 w-3" />{t('Unlock', 'فتح')}</> : <><Lock className="mr-2 h-3 w-3" />{t('Lock', 'قفل')}</>}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AdminLayout>
  );
};

export default AdminLocking;
