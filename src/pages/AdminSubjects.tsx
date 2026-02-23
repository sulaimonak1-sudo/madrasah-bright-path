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
import React from 'react';
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
  const [selectedClassLevels, setSelectedClassLevels] = useState<string[]>([]);
  const [allClasses, setAllClasses] = useState(false);
  const [activeGroup, setActiveGroup] = useState<any | null>(null);
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);

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
    if (!name.trim() || (!allClasses && selectedClassLevels.length === 0)) return;
    const autoAr = nameAr.trim() || transliterateToArabic(name.trim());
    let classIds = allClasses ? classLevels.map(c => c.id) : selectedClassLevels;
    let errors = [];
    for (const clId of classIds) {
      const { error } = await supabase.from('subjects').insert({
        name: name.trim(),
        name_ar: autoAr,
        class_level_id: clId,
      });
      if (error) errors.push(error.message);
    }
    if (errors.length) {
      toast({ title: t('Error', 'خطأ'), description: errors.join(', '), variant: 'destructive' });
    } else {
      toast({ title: t('Subject added', 'تمت إضافة المادة') });
    }
    setName(''); setNameAr(''); setSelectedClassLevels([]); setAllClasses(false);
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
                  <Label>{t('Class Levels', 'المراحل الدراسية')}</Label>
                  <div className="flex items-center gap-2 mb-2">
                    <input type="checkbox" id="allClasses" checked={allClasses} onChange={e => setAllClasses(e.target.checked)} />
                    <label htmlFor="allClasses" className="text-sm">{t('All Classes', 'كل المراحل')}</label>
                  </div>
                  {!allClasses && (
                    <div className="grid grid-cols-2 gap-2">
                      {classLevels.map(c => (
                        <label key={c.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedClassLevels.includes(c.id)}
                            onChange={e => {
                              if (e.target.checked) setSelectedClassLevels([...selectedClassLevels, c.id]);
                              else setSelectedClassLevels(selectedClassLevels.filter(id => id !== c.id));
                            }}
                          />
                          <span>{bilingualText(c.name_en, c.name_ar)}</span>
                        </label>
                      ))}
                    </div>
                  )}
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
                  <TableHead>{t('Assigned Classes', 'الشُعب المعينة')}</TableHead>
                  <TableHead className="w-40"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(() => {
                  if (subjects.length === 0) return (
                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">{t('No subjects yet.', 'لا مواد بعد.')}</TableCell></TableRow>
                  );

                  // Group subjects by name (a subject may have multiple rows for different class levels)
                  const grouped: Record<string, { name: string; name_ar?: string; mappings: any[] }> = {};
                  subjects.forEach(s => {
                    const key = `${s.name}||${s.name_ar || ''}`;
                    if (!grouped[key]) grouped[key] = { name: s.name, name_ar: s.name_ar, mappings: [] };
                    grouped[key].mappings.push(s);
                  });

                  return Object.keys(grouped).map((k) => {
                    const g = grouped[k];
                    return (
                      <TableRow key={k} className="cursor-pointer">
                        <TableCell className="font-medium" onClick={() => { setActiveGroup(g); setSubjectDialogOpen(true); }}>{g.name}</TableCell>
                        <TableCell onClick={() => { setActiveGroup(g); setSubjectDialogOpen(true); }}>{g.name_ar || '—'}</TableCell>
                        <TableCell onClick={() => { setActiveGroup(g); setSubjectDialogOpen(true); }}>{g.mappings.length} {t('class(es)', 'شعبة')}</TableCell>
                        <TableCell className="flex justify-end gap-2">
                          <Button size="sm" onClick={() => { setActiveGroup(g); setSubjectDialogOpen(true); }}>{t('View', 'عرض')}</Button>
                        </TableCell>
                      </TableRow>
                    );
                  });
                })()}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        {/* Controlled dialog for subject details */}
        <Dialog open={subjectDialogOpen} onOpenChange={setSubjectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{activeGroup ? `${activeGroup.name} — ${activeGroup.name_ar || ''}` : ''}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              {activeGroup?.mappings?.map((m: any) => {
                const level = classLevels.find((l: any) => l.id === m.class_level_id);
                return (
                  <div key={m.id} className="flex items-center justify-between">
                    <div>{bilingualText(level?.name_en, level?.name_ar) || t('Unknown', 'غير معروف')}</div>
                    <div>
                      <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={async () => { await deleteSubject(m.id); fetchData(); setActiveGroup((ag:any) => ({ ...ag, mappings: (ag?.mappings || []).filter((mm:any) => mm.id !== m.id) })); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">{t('Close', 'إغلاق')}</Button></DialogClose>
              <Button variant="destructive" onClick={async () => { const ids = activeGroup?.mappings?.map((m:any) => m.id) || []; for (const id of ids) await deleteSubject(id); fetchData(); setSubjectDialogOpen(false); }}>{t('Delete All', 'حذف الكل')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminSubjects;
