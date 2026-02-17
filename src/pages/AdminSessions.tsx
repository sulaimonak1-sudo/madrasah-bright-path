import { useLanguage } from '@/contexts/LanguageContext';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mockSessions, mockTerms } from '@/data/mockData';
import { Plus, Calendar } from 'lucide-react';

const AdminSessions = () => {
  const { t } = useLanguage();

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t('Sessions & Terms', 'السنوات والفصول')}</h1>
            <p className="text-muted-foreground">{t('Manage academic sessions and terms', 'إدارة السنوات والفصول الدراسية')}</p>
          </div>
          <Button size="sm"><Plus className="mr-2 h-4 w-4" />{t('New Session', 'سنة جديدة')}</Button>
        </div>

        <div className="space-y-4">
          {mockSessions.map(session => {
            const terms = mockTerms.filter(t => t.session_id === session.id);
            return (
              <Card key={session.id} className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <Calendar className="h-5 w-5 text-accent" />
                    {session.name}
                    {session.is_active && <Badge>{t('Active', 'نشط')}</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {terms.map(term => (
                      <div key={term.id} className="flex items-center justify-between rounded-lg border p-3">
                        <span className="font-medium">{t(term.name_en, term.name_ar)}</span>
                        <Badge variant={term.is_locked ? 'destructive' : 'secondary'}>
                          {term.is_locked ? t('Locked', 'مقفل') : t('Open', 'مفتوح')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSessions;
