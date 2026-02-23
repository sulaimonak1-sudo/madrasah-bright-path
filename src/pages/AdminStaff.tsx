import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AddStudentForm } from '@/components/AddStudentForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Search, Edit, Trash2, Save, Loader2, UserPlus, Upload, Image as ImageIcon, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface StaffMember {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  class_teacher_class_arm_id: string | null;
  class_teacher_class_level_id: string | null;
  signature_url: string | null;
  role: string;
}

const AdminStaff = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user: authUser, isAdmin } = useAuth();

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [classLevels, setClassLevels] = useState<any[]>([]);
  const [classArms, setClassArms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('list');

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

  // Add staff
  const [addEmail, setAddEmail] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addName, setAddName] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addClassId, setAddClassId] = useState('');
  const [addRole, setAddRole] = useState<'teacher' | 'admin'>('teacher');
  const [adding, setAdding] = useState(false);

  // Signature upload
  const [sigUploading, setSigUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          signature_url: (p as any).signature_url || null,
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
    return null;
  };

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
      if (editClassId && editClassId !== 'none') {
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
      } as any).eq('id', editStaff.id);

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

  const handleAddStaff = async () => {
    if (!addEmail.trim() || !addPassword.trim() || !addName.trim()) {
      toast({ title: t('Error', 'خطأ'), description: t('Please fill in all required fields', 'يرجى ملء جميع الحقول المطلوبة'), variant: 'destructive' });
      return;
    }
    if (addPassword.length < 6) {
      toast({ title: t('Error', 'خطأ'), description: t('Password must be at least 6 characters', 'يجب أن تكون كلمة المرور 6 أحرف على الأقل'), variant: 'destructive' });
      return;
    }
    setAdding(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: addEmail.trim(),
        password: addPassword.trim(),
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      if (!data.user) throw new Error('Failed to create user');

      let classTeacherArmId: string | null = null;
      let classTeacherLevelId: string | null = null;
      if (addClassId && addClassId !== 'none') {
        if (addClassId.startsWith('level-')) {
          classTeacherLevelId = addClassId.replace('level-', '');
        } else {
          classTeacherArmId = addClassId;
        }
      }

      await supabase.from('profiles').upsert({
        user_id: data.user.id,
        full_name: addName.trim(),
        phone: addPhone.trim() || null,
        class_teacher_class_arm_id: classTeacherArmId,
        class_teacher_class_level_id: classTeacherLevelId,
      } as any, { onConflict: 'user_id' });

      await supabase.from('user_roles').insert({
        user_id: data.user.id,
        role: addRole,
      });

      toast({ title: t('Staff Added', 'تمت الإضافة'), description: t('New staff member created successfully', 'تم إنشاء الموظف الجديد بنجاح') });
      setAddEmail(''); setAddPassword(''); setAddName(''); setAddPhone(''); setAddClassId(''); setAddRole('teacher');
      setActiveTab('list');
      fetchData();
    } catch (err: any) {
      toast({ title: t('Error', 'خطأ'), description: err.message, variant: 'destructive' });
    } finally {
      setAdding(false);
    }
  };

  // Signature upload for current teacher
  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !authUser) return;
    setSigUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${authUser.id}/signature.${ext}`;
      const { error: upErr } = await supabase.storage.from('signatures').upload(path, file, { upsert: true });
      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage.from('signatures').getPublicUrl(path);
      const sigUrl = urlData.publicUrl + '?t=' + Date.now();

      await supabase.from('profiles').update({ signature_url: sigUrl } as any).eq('user_id', authUser.id);
      toast({ title: t('Uploaded', 'تم الرفع'), description: t('Signature uploaded successfully', 'تم رفع التوقيع بنجاح') });
      fetchData();
    } catch (err: any) {
      toast({ title: t('Error', 'خطأ'), description: err.message, variant: 'destructive' });
    } finally {
      setSigUploading(false);
    }
  };

  // Find current user's profile
  const myProfile = staff.find(s => s.user_id === authUser?.id);

  const filtered = staff.filter(s =>
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    s.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">{t('Staff Management', 'إدارة الموظفين')}</h1>
          <p className="text-muted-foreground text-sm">{t('Manage staff members, assign classes, and upload signatures', 'إدارة الموظفين، تعيين الفصول، ورفع التوقيعات')}</p>
        </div>

        {/* Staff Add Student Section */}
        {myProfile && (myProfile.role === 'teacher' || myProfile.role === 'admin') && (
          <Card className="shadow-card border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-primary" />
                {t('Add Student to My Class', 'إضافة طالب إلى فصلي')}
              </CardTitle>
              <CardDescription className="text-xs">
                {t('Add a new student directly to your assigned class.', 'أضف طالبًا جديدًا مباشرة إلى الفصل المعين لك.')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Simple form for adding student */}
              <AddStudentForm
                classLevels={classLevels}
                classArms={classArms}
                assignedLevelId={myProfile.class_teacher_class_level_id}
                assignedArmId={myProfile.class_teacher_class_arm_id}
              />
            </CardContent>
          </Card>
        )}

        {/* My Signature Upload section (for any staff) */}
        {myProfile && (
          <Card className="shadow-card border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-primary" />
                {t('My Signature', 'توقيعي')}
              </CardTitle>
              <CardDescription className="text-xs">
                {t('Upload your signature image for use on student report sheets', 'قم برفع صورة توقيعك لاستخدامها في كشوف تقارير الطلاب')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                {myProfile.signature_url ? (
                  <div className="border rounded-lg p-2 bg-muted/50 w-32 h-16 flex items-center justify-center">
                    <img src={myProfile.signature_url} alt="Signature" className="max-h-full max-w-full object-contain" />
                  </div>
                ) : (
                  <div className="border border-dashed rounded-lg p-4 bg-muted/30 w-32 h-16 flex items-center justify-center text-muted-foreground text-xs">
                    {t('No signature', 'لا يوجد توقيع')}
                  </div>
                )}
                <div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleSignatureUpload} />
                  <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={sigUploading}>
                    {sigUploading ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Upload className="mr-2 h-3 w-3" />}
                    {myProfile.signature_url ? t('Replace', 'استبدال') : t('Upload', 'رفع')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Admin-only tabs: List + Add */}
        {isAdmin ? (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="list" className="gap-1.5">
                <Users className="h-3.5 w-3.5" />
                {t('All Staff', 'جميع الموظفين')}
              </TabsTrigger>
              <TabsTrigger value="add" className="gap-1.5">
                <UserPlus className="h-3.5 w-3.5" />
                {t('Add Staff', 'إضافة موظف')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="mt-4">
              <Card className="shadow-card">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <CardTitle className="text-base">
                      {t('Staff List', 'قائمة الموظفين')} ({filtered.length})
                    </CardTitle>
                    <div className="relative max-w-xs w-full">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={t('Search staff...', 'بحث عن موظف...')}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9 h-9"
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
                    <p className="text-center text-muted-foreground py-8 text-sm">{t('No staff found', 'لم يتم العثور على موظفين')}</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-10">#</TableHead>
                            <TableHead>{t('Name', 'الاسم')}</TableHead>
                            <TableHead>{t('Role', 'الدور')}</TableHead>
                            <TableHead>{t('Phone', 'الهاتف')}</TableHead>
                            <TableHead>{t('Assigned Class', 'الفصل المعين')}</TableHead>
                            <TableHead>{t('Signature', 'التوقيع')}</TableHead>
                            <TableHead className="text-right">{t('Actions', 'الإجراءات')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filtered.map((s, i) => (
                            <TableRow key={s.id}>
                              <TableCell className="text-muted-foreground text-xs">{i + 1}</TableCell>
                              <TableCell className="font-medium">{s.full_name}</TableCell>
                              <TableCell>
                                <Badge variant={s.role === 'admin' ? 'default' : 'secondary'} className="text-[10px]">
                                  {s.role}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm">{s.phone || '—'}</TableCell>
                              <TableCell className="text-sm">
                                {getClassName(s.class_teacher_class_arm_id, s.class_teacher_class_level_id) || (
                                  <span className="text-muted-foreground italic text-xs">{t('Not assigned', 'غير معين')}</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {s.signature_url ? (
                                  <img src={s.signature_url} alt="Sig" className="h-6 w-12 object-contain" />
                                ) : (
                                  <span className="text-muted-foreground text-xs">—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(s)}>
                                    <Edit className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => { setDeleteStaff(s); setDeleteOpen(true); }}>
                                    <Trash2 className="h-3.5 w-3.5" />
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
            </TabsContent>

            <TabsContent value="add" className="mt-4">
              <Card className="shadow-card max-w-lg">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-primary" />
                    {t('Add New Staff', 'إضافة موظف جديد')}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {t('Create an account for a new staff member', 'إنشاء حساب لموظف جديد')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t('Full Name', 'الاسم الكامل')} *</Label>
                      <Input value={addName} onChange={e => setAddName(e.target.value)} placeholder={t('Enter full name', 'أدخل الاسم الكامل')} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t('Phone', 'الهاتف')}</Label>
                      <Input value={addPhone} onChange={e => setAddPhone(e.target.value)} placeholder="08012345678" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t('Email', 'البريد الإلكتروني')} *</Label>
                      <Input type="email" value={addEmail} onChange={e => setAddEmail(e.target.value)} placeholder="staff@example.com" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t('Password', 'كلمة المرور')} *</Label>
                      <Input type="password" value={addPassword} onChange={e => setAddPassword(e.target.value)} placeholder="••••••••" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t('Role', 'الدور')}</Label>
                      <Select value={addRole} onValueChange={(v: 'teacher' | 'admin') => setAddRole(v)}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="teacher">{t('Teacher', 'معلم')}</SelectItem>
                          <SelectItem value="admin">{t('Admin', 'مدير')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t('Assign Class', 'تعيين الفصل')}</Label>
                      <Select value={addClassId} onValueChange={setAddClassId}>
                        <SelectTrigger className="h-9"><SelectValue placeholder={t('Optional', 'اختياري')} /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">{t('Not assigned', 'غير معين')}</SelectItem>
                          {classOptions.map(opt => (
                            <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button onClick={handleAddStaff} disabled={adding}>
                      {adding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                      {t('Create Staff', 'إنشاء الموظف')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          /* Non-admin view - just show basic info */
          <Card className="shadow-card">
            <CardContent className="py-8 text-center text-muted-foreground text-sm">
              {t('Staff management is available to administrators only.', 'إدارة الموظفين متاحة للمسؤولين فقط.')}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Edit Staff', 'تعديل الموظف')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">{t('Full Name', 'الاسم الكامل')}</Label>
              <Input value={editName} onChange={e => setEditName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t('Phone', 'الهاتف')}</Label>
              <Input value={editPhone} onChange={e => setEditPhone(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t('Assigned Class', 'الفصل المعين')}</Label>
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
              <Button variant="outline" size="sm">{t('Cancel', 'إلغاء')}</Button>
            </DialogClose>
            <Button onClick={handleSave} disabled={saving} size="sm">
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
            {t(`Are you sure you want to remove "${deleteStaff?.full_name}"?`, `هل أنت متأكد من حذف "${deleteStaff?.full_name}"؟`)}
          </p>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" size="sm">{t('Cancel', 'إلغاء')}</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting} size="sm">
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
