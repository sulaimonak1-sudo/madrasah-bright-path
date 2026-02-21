import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Users, Search, Edit, Trash2, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface StaffMember {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  class_teacher_class_arm_id: string | null;
  class_teacher_class_level_id: string | null;
  role: string;
}

const AdminStaff = () => {
  const { t } = useLanguage();
  const { toast } = useToast();

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [classLevels, setClassLevels] = useState<any[]>([]);
  const [classArms, setClassArms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editStaff, setEditStaff] = useState<StaffMember | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editClassId, setEditClassId] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteStaff, setDeleteStaff] = useState<StaffMember | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profilesRes, rolesRes, levelsRes, armsRes] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('user_roles').select('*'),
        supabase.from('class_levels').select('*').order('display_order'),
        supabase.from('class_arms').select('*').order('name'),
      ]);

      setClassLevels(levelsRes.data || []);
      setClassArms(armsRes.data || []);

      const roles = rolesRes.data || [];
      const profiles = profilesRes.data || [];

      const merged: StaffMember[] = profiles.map(p => {
        const roleRow = roles.find(r => r.user_id === p.user_id);
        return {
          id: p.id,
          user_id: p.user_id,
          full_name: p.full_name,
          phone: p.phone,
          class_teacher_class_arm_id: p.class_teacher_class_arm_id,
          class_teacher_class_level_id: (p as any).class_teacher_class_level_id || null,
          role: roleRow?.role || 'unknown',
        };
      });
      setStaff(merged);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const getClassName = (armId: string | null, levelId: string | null) => {
    if (armId) {
      const arm = classArms.find(a => a.id === armId);
      if (arm) {
        const level = classLevels.find(l => l.id === arm.class_level_id);
        return `${level?.name_en || ''} - ${arm.name}`;
      }
    }
    if (levelId) {
      const level = classLevels.find(l => l.id === levelId);
      return level?.name_en || '';
    }
    return t('Not assigned', 'غير معين');
  };

  // Build class options for assignment
  const classOptions = classLevels.map(level => {
    const armsForLevel = classArms.filter(arm => arm.class_level_id === level.id);
    if (armsForLevel.length === 0) {
      return [{ id: `level-${level.id}`, label: level.name_en }];
    }
    return armsForLevel.map(arm => ({ id: arm.id, label: `${level.name_en} - ${arm.name}` }));
  }).flat();

  const openEdit = (s: StaffMember) => {
    setEditStaff(s);
    setEditName(s.full_name);
    setEditPhone(s.phone || '');
    if (s.class_teacher_class_arm_id) {
      setEditClassId(s.class_teacher_class_arm_id);
    } else if (s.class_teacher_class_level_id) {
      setEditClassId(`level-${s.class_teacher_class_level_id}`);
    } else {
      setEditClassId('');
    }
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!editStaff) return;
    setSaving(true);
    try {
      let classTeacherArmId: string | null = null;
      let classTeacherLevelId: string | null = null;
      if (editClassId) {
        if (editClassId.startsWith('level-')) {
          classTeacherLevelId = editClassId.replace('level-', '');
        } else {
          classTeacherArmId = editClassId;
        }
      }

      const { error } = await supabase.from('profiles').update({
        full_name: editName.trim(),
        phone: editPhone.trim() || null,
        class_teacher_class_arm_id: classTeacherArmId,
        class_teacher_class_level_id: classTeacherLevelId,
      }).eq('id', editStaff.id);

      if (error) throw error;
      toast({ title: t('Saved', 'تم الحفظ'), description: t('Staff updated successfully', 'تم تحديث بيانات الموظف') });
      setEditOpen(false);
      fetchData();
    } catch (err: any) {
      toast({ title: t('Error', 'خطأ'), description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteStaff) return;
    setDeleting(true);
    try {
      // Delete role and profile
      await supabase.from('user_roles').delete().eq('user_id', deleteStaff.user_id);
      const { error } = await supabase.from('profiles').delete().eq('id', deleteStaff.id);
      if (error) throw error;
      toast({ title: t('Deleted', 'تم الحذف'), description: t('Staff removed', 'تم حذف الموظف') });
      setDeleteOpen(false);
      fetchData();
    } catch (err: any) {
      toast({ title: t('Error', 'خطأ'), description: err.message, variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  const filtered = staff.filter(s =>
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    s.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">{t('Staff Management', 'إدارة الموظفين')}</h1>
          <p className="text-muted-foreground">{t('Manage all staff members, assign classes', 'إدارة جميع الموظفين، تعيين الفصول')}</p>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-primary" />
                {t('All Staff', 'جميع الموظفين')} ({filtered.length})
              </CardTitle>
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('Search staff...', 'بحث عن موظف...')}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">{t('No staff found', 'لم يتم العثور على موظفين')}</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>{t('Name', 'الاسم')}</TableHead>
                      <TableHead>{t('Role', 'الدور')}</TableHead>
                      <TableHead>{t('Phone', 'الهاتف')}</TableHead>
                      <TableHead>{t('Assigned Class', 'الفصل المعين')}</TableHead>
                      <TableHead className="text-right">{t('Actions', 'الإجراءات')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((s, i) => (
                      <TableRow key={s.id}>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell className="font-medium">{s.full_name}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${s.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-accent/50 text-accent-foreground'}`}>
                            {s.role}
                          </span>
                        </TableCell>
                        <TableCell>{s.phone || '—'}</TableCell>
                        <TableCell>{getClassName(s.class_teacher_class_arm_id, s.class_teacher_class_level_id)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" onClick={() => openEdit(s)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="text-destructive" onClick={() => { setDeleteStaff(s); setDeleteOpen(true); }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Edit Staff', 'تعديل الموظف')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('Full Name', 'الاسم الكامل')}</Label>
              <Input value={editName} onChange={e => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t('Phone', 'الهاتف')}</Label>
              <Input value={editPhone} onChange={e => setEditPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t('Assigned Class', 'الفصل المعين')}</Label>
              <Select value={editClassId} onValueChange={setEditClassId}>
                <SelectTrigger><SelectValue placeholder={t('Select class...', 'اختر الفصل...')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('Not assigned', 'غير معين')}</SelectItem>
                  {classOptions.map(opt => (
                    <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t('Cancel', 'إلغاء')}</Button>
            </DialogClose>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {t('Save', 'حفظ')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Delete Staff', 'حذف الموظف')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t(`Are you sure you want to remove "${deleteStaff?.full_name}"? This will delete their profile and role.`,
              `هل أنت متأكد من حذف "${deleteStaff?.full_name}"؟ سيتم حذف ملفهم الشخصي ودورهم.`)}
          </p>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t('Cancel', 'إلغاء')}</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              {t('Delete', 'حذف')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminStaff;
