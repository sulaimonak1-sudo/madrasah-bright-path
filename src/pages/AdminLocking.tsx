import { useLanguage } from '@/contexts/LanguageContext';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Lock, Unlock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const AdminLocking = () => {
  const { t } = useLanguage();
  const { toast } = useToast();

  const [sessions, setSessions] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data: s } = await supabase.from('sessions').select('*').order('name');
        setSessions((s as any[]) || []);
        const { data: termsData } = await supabase.from('terms').select('*');
        setTerms((termsData as any[]) || []);
      } catch (err) {
        toast({ title: t('Error loading data', 'خطأ في تحميل البيانات'), description: String(err) });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleToggleLock = async (term: any) => {
    const newLocked = !term.is_locked;
    try {
      const { error } = await supabase.from('terms').update({ is_locked: newLocked }).eq('id', term.id).eq('session_id', term.session_id);
      if (error) throw error;
      setTerms((prev) => prev.map((p) => (p.id === term.id ? { ...p, is_locked: newLocked } : p)));
      toast({ title: newLocked ? t('Locked', 'مقفل') : t('Unlocked', 'مفتوح') });
    } catch (err) {
      toast({ title: t('Action failed', 'فشل الإجراء'), description: String(err) });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">{t('Result Locking', 'قفل النتائج')}</h1>
          <p className="text-muted-foreground">{t('Lock terms to prevent editing', 'قفل الفصول لمنع التعديل')}</p>
        </div>
        {sessions.map(session => {
          const sessionTerms = terms.filter(tt => tt.session_id === session.id);
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
                    {sessionTerms.map(term => (
                      <TableRow key={term.id}>
                        <TableCell className="font-medium">{t(term.name_en, term.name_ar)}</TableCell>
                        <TableCell>
                          <Badge variant={term.is_locked ? 'destructive' : 'secondary'}>
                            {term.is_locked ? t('Locked', 'مقفل') : t('Open', 'مفتوح')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => handleToggleLock(term)} disabled={loading}>
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
