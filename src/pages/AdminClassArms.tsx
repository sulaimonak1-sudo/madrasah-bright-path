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
import { useCampus } from '@/contexts/CampusContext';

const AdminClassArms = () => {
  const { t, bilingualText } = useLanguage();
  const { toast } = useToast();
  const { campusId } = useCampus();
  const [classArms, setClassArms] = useState<any[]>([]);
  const [classLevels, setClassLevels] = useState<any[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [classLevelId, setClassLevelId] = useState('');

  const fetchData = async () => {
    const [armsRes, clRes] = await Promise.all([
      supabase.from('class_arms').select('*').eq('campus_id', campusId).order('name'),
      supabase.from('class_levels').select('*').eq('campus_id', campusId).order('display_order'),
    ]);
    setClassArms(armsRes.data || []);
    setClassLevels(clRes.data || []);
  };

  useEffect(() => { if (campusId) fetchData(); }, [campusId]);

  const addArm = async () => {
    if (!name.trim() || !classLevelId) return;
    const { error } = await supabase.from('class_arms').insert({
      name: name.trim(),
      class_level_id: classLevelId,
      campus_id: campusId,
    });
    if (error) { toast({ title: t('Error', 'خطأ'), description: error.message, variant: 'destructive' }); return; }
    toast({ title: t('Arm added', 'تمت إضافة الشعبة') });
    setName(''); setClassLevelId('');
    setAddOpen(false);
    fetchData();
  };

  const deleteArm = async (id: string) => {
    const { error } = await supabase.from('class_arms').delete().eq('id', id).eq('campus_id', campusId);
    if (error) { toast({ title: t('Error', 'خطأ'), description: error.message, variant: 'destructive' }); return; }
    fetchData();
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t('Class Arms', 'الشعب')}</h1>
            <p className="text-muted-foreground">{t('Manage class arms per level', 'إدارة الشعب لكل مرحلة')}</p>
          </div>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="mr-2 h-4 w-4" />{t('Add Arm', 'إضافة شعبة')}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{t('Add Class Arm', 'إضافة شعبة')}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('Class Level', 'المرحلة')}</Label>
                  <Select value={classLevelId} onValueChange={setClassLevelId}>
                    <SelectTrigger><SelectValue placeholder={t('Select', 'اختر')} /></SelectTrigger>
                    <SelectContent>
                      {classLevels.map(c => <SelectItem key={c.id} value={c.id}>{bilingualText(c.name_en, c.name_ar)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('Arm Name', 'اسم الشعبة')}</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. A, B, C" />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">{t('Cancel', 'إلغاء')}</Button></DialogClose>
                <Button onClick={addArm}>{t('Add', 'إضافة')}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <Card className="shadow-card">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('Class Level', 'المرحلة')}</TableHead>
                  <TableHead>{t('Arm', 'الشعبة')}</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classArms.map(arm => {
                  const level = classLevels.find(l => l.id === arm.class_level_id);
                  return (
                    <TableRow key={arm.id}>
                      <TableCell>{bilingualText(level?.name_en, level?.name_ar)}</TableCell>
                      <TableCell className="font-medium">{arm.name}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => deleteArm(arm.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {classArms.length === 0 && (
                  <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">{t('No class arms yet.', 'لا شعب بعد.')}</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminClassArms;
