import { useLanguage } from '@/contexts/LanguageContext';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Plus, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const AdminSubjects = () => {
  const { t, bilingualText } = useLanguage();
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classLevels, setClassLevels] = useState<any[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [classLevelId, setClassLevelId] = useState('');

  const fetchData = async () => {
    const [subRes, clRes] = await Promise.all([
      supabase.from('subjects').select('*').order('name'),
      supabase.from('class_levels').select('*').order('display_order'),
    ]);
    setSubjects(subRes.data || []);
    setClassLevels(clRes.data || []);
  };

  useEffect(() => { fetchData(); }, []);

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

  const addSubject = async () => {
    if (!name.trim() || !classLevelId) return;
    const autoAr = nameAr.trim() || transliterateToArabic(name.trim());
    const { error } = await supabase.from('subjects').insert({
      name: name.trim(),
      name_ar: autoAr,
      class_level_id: classLevelId,
    });
    if (error) { toast({ title: t('Error', 'خطأ'), description: error.message, variant: 'destructive' }); return; }
    toast({ title: t('Subject added', 'تمت إضافة المادة') });
    setName(''); setNameAr(''); setClassLevelId('');
    setAddOpen(false);
    fetchData();
  };

  const deleteSubject = async (id: string) => {
    const { error } = await supabase.from('subjects').delete().eq('id', id);
    if (error) { toast({ title: t('Error', 'خطأ'), description: error.message, variant: 'destructive' }); return; }
    fetchData();
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t('Subjects', 'المواد الدراسية')}</h1>
            <p className="text-muted-foreground">{t('Manage subjects per class level', 'إدارة المواد لكل مرحلة')}</p>
          </div>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="mr-2 h-4 w-4" />{t('Add Subject', 'إضافة مادة')}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{t('Add Subject', 'إضافة مادة')}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('Name (English)', 'الاسم (إنجليزي)')}</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Mathematics" />
                </div>
                <div className="space-y-2">
                  <Label>{t('Name (Arabic)', 'الاسم (عربي)')}</Label>
                  <Input value={nameAr} onChange={e => setNameAr(e.target.value)} placeholder={t('Auto-generated if blank', 'يتم توليده تلقائياً إذا ترك فارغاً')} />
                </div>
                <div className="space-y-2">
                  <Label>{t('Class Level', 'المرحلة')}</Label>
                  <Select value={classLevelId} onValueChange={setClassLevelId}>
                    <SelectTrigger><SelectValue placeholder={t('Select', 'اختر')} /></SelectTrigger>
                    <SelectContent>
                      {classLevels.map(c => <SelectItem key={c.id} value={c.id}>{bilingualText(c.name_en, c.name_ar)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">{t('Cancel', 'إلغاء')}</Button></DialogClose>
                <Button onClick={addSubject}>{t('Add', 'إضافة')}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <Card className="shadow-card">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('Subject (EN)', 'المادة (إنجليزي)')}</TableHead>
                  <TableHead>{t('Subject (AR)', 'المادة (عربي)')}</TableHead>
                  <TableHead>{t('Class Level', 'المرحلة')}</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjects.map(sub => {
                  const level = classLevels.find(l => l.id === sub.class_level_id);
                  return (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">{sub.name}</TableCell>
                      <TableCell>{sub.name_ar || '—'}</TableCell>
                      <TableCell>{bilingualText(level?.name_en, level?.name_ar)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => deleteSubject(sub.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {subjects.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">{t('No subjects yet.', 'لا مواد بعد.')}</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminSubjects;
