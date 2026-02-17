import { useLanguage } from '@/contexts/LanguageContext';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Plus, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const AdminClassLevels = () => {
  const { t, bilingualText } = useLanguage();
  const { toast } = useToast();
  const [classLevels, setClassLevels] = useState<any[]>([]);
  const [classArms, setClassArms] = useState<any[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [order, setOrder] = useState(0);

  const fetchData = async () => {
    const [clRes, armsRes] = await Promise.all([
      supabase.from('class_levels').select('*').order('display_order'),
      supabase.from('class_arms').select('*'),
    ]);
    setClassLevels(clRes.data || []);
    setClassArms(armsRes.data || []);
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

  const addLevel = async () => {
    if (!nameEn.trim()) return;
    const autoAr = nameAr.trim() || transliterateToArabic(nameEn.trim());
    const { error } = await supabase.from('class_levels').insert({
      name_en: nameEn.trim(),
      name_ar: autoAr,
      display_order: order,
    });
    if (error) { toast({ title: t('Error', 'خطأ'), description: error.message, variant: 'destructive' }); return; }
    toast({ title: t('Level added', 'تمت إضافة المرحلة') });
    setNameEn(''); setNameAr(''); setOrder(0);
    setAddOpen(false);
    fetchData();
  };

  const deleteLevel = async (id: string) => {
    const { error } = await supabase.from('class_levels').delete().eq('id', id);
    if (error) { toast({ title: t('Error', 'خطأ'), description: error.message, variant: 'destructive' }); return; }
    fetchData();
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t('Class Levels', 'المراحل الدراسية')}</h1>
            <p className="text-muted-foreground">{t('Manage Madrasah class levels', 'إدارة المراحل الدراسية')}</p>
          </div>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="mr-2 h-4 w-4" />{t('Add Level', 'إضافة مرحلة')}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{t('Add Class Level', 'إضافة مرحلة')}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('Name (English)', 'الاسم (إنجليزي)')}</Label>
                  <Input value={nameEn} onChange={e => setNameEn(e.target.value)} placeholder="e.g. Tahfiz 1" />
                </div>
                <div className="space-y-2">
                  <Label>{t('Name (Arabic)', 'الاسم (عربي)')}</Label>
                  <Input value={nameAr} onChange={e => setNameAr(e.target.value)} placeholder={t('Auto-generated if blank', 'يتم توليده تلقائياً إذا ترك فارغاً')} />
                </div>
                <div className="space-y-2">
                  <Label>{t('Display Order', 'الترتيب')}</Label>
                  <Input type="number" value={order} onChange={e => setOrder(Number(e.target.value))} />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">{t('Cancel', 'إلغاء')}</Button></DialogClose>
                <Button onClick={addLevel}>{t('Add', 'إضافة')}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classLevels.map(level => {
                  const arms = classArms.filter(a => a.class_level_id === level.id);
                  return (
                    <TableRow key={level.id}>
                      <TableCell>{level.display_order}</TableCell>
                      <TableCell className="font-medium">{level.name_en}</TableCell>
                      <TableCell>{level.name_ar || '—'}</TableCell>
                      <TableCell>{arms.map(a => a.name).join(', ') || '—'}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => deleteLevel(level.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {classLevels.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">{t('No class levels yet.', 'لا مراحل بعد.')}</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminClassLevels;
