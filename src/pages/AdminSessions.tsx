import { useLanguage } from '@/contexts/LanguageContext';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Plus, Calendar, Pencil, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCampus } from '@/contexts/CampusContext';

const AdminSessions = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { campusId } = useCampus();
  const [sessions, setSessions] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add session dialog
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState('');

  // Add term dialog
  const [addTermOpen, setAddTermOpen] = useState(false);
  const [termSessionId, setTermSessionId] = useState('');
  const [termNameEn, setTermNameEn] = useState('');
  const [termNameAr, setTermNameAr] = useState('');
  const [termNumber, setTermNumber] = useState(1);

  const fetchData = async () => {
    const [sessRes, termsRes] = await Promise.all([
      supabase.from('sessions').select('*').eq('campus_id', campusId).order('name', { ascending: false }),
      supabase.from('terms').select('*').order('term_number'),
    ]);
    setSessions(sessRes.data || []);
    setTerms(termsRes.data || []);
    setLoading(false);
  };

  useEffect(() => { if (campusId) fetchData(); }, [campusId]);

  const addSession = async () => {
    if (!newName.trim()) return;
    const { error } = await supabase.from('sessions').insert({ name: newName.trim(), campus_id: campusId });
    if (error) { toast({ title: t('Error', 'خطأ'), description: error.message, variant: 'destructive' }); return; }
    toast({ title: t('Session added', 'تمت الإضافة') });
    setNewName('');
    setAddOpen(false);
    fetchData();
  };

  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase.from('sessions').update({ is_active: !current }).eq('id', id).eq('campus_id', campusId);
    if (error) { toast({ title: t('Error', 'خطأ'), description: error.message, variant: 'destructive' }); return; }
    fetchData();
  };

  const deleteSession = async (id: string) => {
    const { error } = await supabase.from('sessions').delete().eq('id', id).eq('campus_id', campusId);
    if (error) { toast({ title: t('Error', 'خطأ'), description: error.message, variant: 'destructive' }); return; }
    toast({ title: t('Deleted', 'تم الحذف') });
    fetchData();
  };

  // Utility: Simple English to Arabic transliteration (same as in students)
  function transliterateToArabic(text: string): string {
    return text
      .replace(/a/gi, 'ا')
      .replace(/b/gi, 'ب')
      .replace(/c/gi, 'ك')
      .replace(/d/gi, 'د')
      .replace(/e/gi, 'ي')
      .replace(/f/gi, 'ف')
      .replace(/g/gi, 'ج')
      .replace(/h/gi, 'ه')
      .replace(/i/gi, 'ي')
      .replace(/j/gi, 'ج')
      .replace(/k/gi, 'ك')
      .replace(/l/gi, 'ل')
      .replace(/m/gi, 'م')
      .replace(/n/gi, 'ن')
      .replace(/o/gi, 'و')
      .replace(/p/gi, 'ب')
      .replace(/q/gi, 'ق')
      .replace(/r/gi, 'ر')
      .replace(/s/gi, 'س')
      .replace(/t/gi, 'ت')
      .replace(/u/gi, 'و')
      .replace(/v/gi, 'ف')
      .replace(/w/gi, 'و')
      .replace(/x/gi, 'كس')
      .replace(/y/gi, 'ي')
      .replace(/z/gi, 'ز');
  }

  const addTerm = async () => {
    if (!termNameEn.trim() || !termSessionId) return;
    const autoAr = termNameAr.trim() || transliterateToArabic(termNameEn.trim());
    const { error } = await supabase.from('terms').insert({
      session_id: termSessionId,
      name_en: termNameEn.trim(),
      name_ar: autoAr,
      term_number: termNumber,
    });
    if (error) { toast({ title: t('Error', 'خطأ'), description: error.message, variant: 'destructive' }); return; }
    toast({ title: t('Term added', 'تمت إضافة الفصل') });
    setTermNameEn(''); setTermNameAr(''); setTermNumber(1);
    setAddTermOpen(false);
    fetchData();
  };

  const deleteTerm = async (id: string) => {
    const { error } = await supabase.from('terms').delete().eq('id', id);
    if (error) { toast({ title: t('Error', 'خطأ'), description: error.message, variant: 'destructive' }); return; }
    fetchData();
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t('Sessions & Terms', 'السنوات والفصول')}</h1>
            <p className="text-muted-foreground">{t('Manage academic sessions and terms', 'إدارة السنوات والفصول الدراسية')}</p>
          </div>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="mr-2 h-4 w-4" />{t('New Session', 'سنة جديدة')}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{t('Add Session', 'إضافة سنة')}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('Session Name', 'اسم السنة')}</Label>
                  <Input placeholder="e.g. 2025/2026" value={newName} onChange={e => setNewName(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">{t('Cancel', 'إلغاء')}</Button></DialogClose>
                <Button onClick={addSession}>{t('Add', 'إضافة')}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          {sessions.map(session => {
            const sessionTerms = terms.filter(t => t.session_id === session.id);
            return (
              <Card key={session.id} className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-lg">
                      <Calendar className="h-5 w-5 text-accent" />
                      {session.name}
                      {session.is_active && <Badge>{t('Active', 'نشط')}</Badge>}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => toggleActive(session.id, session.is_active)}>
                        {session.is_active ? t('Deactivate', 'تعطيل') : t('Activate', 'تفعيل')}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => {
                        setTermSessionId(session.id);
                        setTermNumber(sessionTerms.length + 1);
                        setAddTermOpen(true);
                      }}>
                        <Plus className="mr-1 h-3 w-3" />{t('Add Term', 'إضافة فصل')}
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteSession(session.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {sessionTerms.map(term => (
                      <div key={term.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <span className="font-medium">{t(term.name_en, term.name_ar)}</span>
                          <Badge variant={term.is_locked ? 'destructive' : 'secondary'} className="ml-2">
                            {term.is_locked ? t('Locked', 'مقفل') : t('Open', 'مفتوح')}
                          </Badge>
                        </div>
                        <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => deleteTerm(term.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    {sessionTerms.length === 0 && (
                      <p className="text-sm text-muted-foreground col-span-3">{t('No terms yet', 'لا فصول بعد')}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {sessions.length === 0 && !loading && (
            <Card><CardContent className="py-12 text-center text-muted-foreground">{t('No sessions yet.', 'لا سنوات بعد.')}</CardContent></Card>
          )}
        </div>

        {/* Add Term Dialog */}
        <Dialog open={addTermOpen} onOpenChange={setAddTermOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>{t('Add Term', 'إضافة فصل')}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t('Name (English)', 'الاسم (إنجليزي)')}</Label>
                <Input placeholder="e.g. 1st Term" value={termNameEn} onChange={e => setTermNameEn(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t('Name (Arabic)', 'الاسم (عربي)')}</Label>
                <Input placeholder={t('Auto-generated if blank', 'يتم توليده تلقائياً إذا ترك فارغاً')} value={termNameAr} onChange={e => setTermNameAr(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t('Term Number', 'رقم الفصل')}</Label>
                <Input type="number" min={1} max={4} value={termNumber} onChange={e => setTermNumber(Number(e.target.value))} />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">{t('Cancel', 'إلغاء')}</Button></DialogClose>
              <Button onClick={addTerm}>{t('Add', 'إضافة')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminSessions;
