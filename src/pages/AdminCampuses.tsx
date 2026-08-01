import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCampus } from '@/contexts/CampusContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Building2, Plus, Pencil, Users, GraduationCap, Grid2x2 } from 'lucide-react';

const emptyForm = { id: '', name: '', code: '', address: '', phone: '', email: '', is_active: true };

const AdminCampuses = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { campuses, refresh, isSuperAdmin, loading } = useCampus();
  const [counts, setCounts] = useState<Record<string, { students: number; staff: number; arms: number }>>({});
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const loadCounts = async () => {
    const [studs, staff, memberships, arms] = await Promise.all([
      supabase.from('students').select('campus_id').neq('status', 'archived'),
      supabase.from('profiles').select('id, campus_id'),
      supabase.from('profile_campuses').select('profile_id, campus_id'),
      supabase.from('class_arms').select('campus_id'),
    ]);
    const map: Record<string, { students: number; staff: number; arms: number }> = {};
    const bump = (id: string | null, key: 'students' | 'staff' | 'arms') => {
      if (!id) return;
      map[id] = map[id] || { students: 0, staff: 0, arms: 0 };
      map[id][key]++;
    };
    (studs.data || []).forEach((r: any) => bump(r.campus_id, 'students'));
    const membershipProfileIds = new Set((memberships.data || []).map((r: any) => r.profile_id));
    (memberships.data || []).forEach((r: any) => bump(r.campus_id, 'staff'));
    (staff.data || []).forEach((r: any) => {
      if (!membershipProfileIds.has(r.id)) bump(r.campus_id, 'staff');
    });
    (arms.data || []).forEach((r: any) => bump(r.campus_id, 'arms'));
    setCounts(map);
  };

  useEffect(() => { loadCounts(); }, [campuses.length]);

  const openNew = () => { setForm({ ...emptyForm }); setOpen(true); };
  const openEdit = (c: any) => {
    setForm({
      id: c.id, name: c.name, code: c.code,
      address: c.address || '', phone: c.phone || '', email: c.email || '',
      is_active: c.is_active,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim() || !form.code.trim()) {
      toast({ title: t('Name and code are required', 'الاسم والرمز مطلوبان'), variant: 'destructive' });
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      address: form.address.trim() || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      is_active: form.is_active,
    };
    const { error } = form.id
      ? await supabase.from('campuses').update(payload).eq('id', form.id)
      : await supabase.from('campuses').insert(payload as any);
    setSaving(false);
    if (error) {
      toast({ title: t('Error', 'خطأ'), description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: form.id ? t('Campus updated', 'تم تحديث الفرع') : t('Campus created', 'تم إنشاء الفرع') });
    setOpen(false);
    await refresh();
    await loadCounts();
  };

  const toggleActive = async (c: any) => {
    const { error } = await supabase.from('campuses').update({ is_active: !c.is_active }).eq('id', c.id);
    if (error) {
      toast({ title: t('Error', 'خطأ'), description: error.message, variant: 'destructive' });
      return;
    }
    await refresh();
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{t('Campus Management', 'إدارة الفروع')}</h1>
            <p className="text-muted-foreground">{t('Manage school campuses and branches', 'إدارة فروع المدرسة')}</p>
          </div>
          {isSuperAdmin && (
            <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />{t('New Campus', 'فرع جديد')}</Button>
          )}
        </div>

        {!isSuperAdmin && (
          <Card><CardContent className="p-4 text-sm text-muted-foreground">
            {t('Only super administrators (admins not assigned to a campus) can manage campuses.', 'فقط المسؤولون العامون يمكنهم إدارة الفروع.')}
          </CardContent></Card>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {campuses.map(c => {
            const k = counts[c.id] || { students: 0, staff: 0, arms: 0 };
            return (
              <Card key={c.id} className="shadow-card">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between gap-2 text-base">
                    <span className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-accent" />{c.name}
                    </span>
                    <Badge variant={c.is_active ? 'default' : 'secondary'}>
                      {c.is_active ? t('Active', 'نشط') : t('Inactive', 'غير نشط')}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="font-mono">{c.code}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div className="rounded-md bg-muted/50 p-2">
                      <GraduationCap className="mx-auto h-4 w-4 text-muted-foreground" />
                      <div className="font-semibold">{k.students}</div>
                      <div className="text-xs text-muted-foreground">{t('Students', 'الطلاب')}</div>
                    </div>
                    <div className="rounded-md bg-muted/50 p-2">
                      <Users className="mx-auto h-4 w-4 text-muted-foreground" />
                      <div className="font-semibold">{k.staff}</div>
                      <div className="text-xs text-muted-foreground">{t('Staff', 'الموظفون')}</div>
                    </div>
                    <div className="rounded-md bg-muted/50 p-2">
                      <Grid2x2 className="mx-auto h-4 w-4 text-muted-foreground" />
                      <div className="font-semibold">{k.arms}</div>
                      <div className="text-xs text-muted-foreground">{t('Classes', 'الفصول')}</div>
                    </div>
                  </div>
                  {(c.address || c.phone || c.email) && (
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      {c.address && <div>{c.address}</div>}
                      {c.phone && <div>{c.phone}</div>}
                      {c.email && <div>{c.email}</div>}
                    </div>
                  )}
                  {isSuperAdmin && (
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <Button variant="outline" size="sm" onClick={() => openEdit(c)}>
                        <Pencil className="mr-2 h-3.5 w-3.5" />{t('Edit', 'تعديل')}
                      </Button>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{t('Active', 'نشط')}</span>
                        <Switch checked={c.is_active} onCheckedChange={() => toggleActive(c)} />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {!loading && campuses.length === 0 && (
          <Card><CardContent className="p-8 text-center text-muted-foreground">{t('No campuses found', 'لا توجد فروع')}</CardContent></Card>
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{form.id ? t('Edit Campus', 'تعديل الفرع') : t('New Campus', 'فرع جديد')}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3">
              <div className="space-y-1.5">
                <Label>{t('Campus name', 'اسم الفرع')}</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} maxLength={100} />
              </div>
              <div className="space-y-1.5">
                <Label>{t('Campus code', 'رمز الفرع')}</Label>
                <Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} maxLength={20} disabled={!!form.id} />
              </div>
              <div className="space-y-1.5">
                <Label>{t('Address', 'العنوان')}</Label>
                <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} maxLength={200} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>{t('Phone', 'الهاتف')}</Label>
                  <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} maxLength={30} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('Email', 'البريد')}</Label>
                  <Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} maxLength={120} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
                <Label>{t('Active', 'نشط')}</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>{t('Cancel', 'إلغاء')}</Button>
              <Button onClick={save} disabled={saving}>{t('Save', 'حفظ')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminCampuses;
