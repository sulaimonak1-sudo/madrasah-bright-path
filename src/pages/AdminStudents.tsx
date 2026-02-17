import { useLanguage } from '@/contexts/LanguageContext';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const AdminStudents = () => {
  const { t, bilingualText } = useLanguage();
  const { toast } = useToast();
  const [students, setStudents] = useState<any[]>([]);
  const [classLevels, setClassLevels] = useState<any[]>([]);
  const [classArms, setClassArms] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  // Step navigation
  const [step, setStep] = useState<'classes' | 'students'>('classes');
  const [selectedClassLevel, setSelectedClassLevel] = useState<any>(null);
  const [selectedClassArm, setSelectedClassArm] = useState<any>(null);
  // Edit student state
  const [editFields, setEditFields] = useState<any>({});

  const openEdit = (student: any) => {
    setSelectedStudent(student);
    setEditFields({ ...student });
    setEditOpen(true);
  };

  const handleEditChange = (field: string, value: any) => {
    setEditFields((prev: any) => ({ ...prev, [field]: value }));
  };

  const saveEdit = async () => {
    if (!editFields.full_name?.trim()) return;
    const { error } = await supabase.from('students').update({
      ...editFields,
      name_en: editFields.name_en || editFields.full_name,
      name_ar: editFields.name_ar || transliterateToArabic(editFields.name_en || editFields.full_name),
    }).eq('id', selectedStudent.id);
    if (error) {
      toast({ title: t('Error', 'خطأ'), description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: t('Student updated', 'تم تحديث الطالب') });
    setEditOpen(false);
    setSelectedStudent(null);
    fetchData();
  };

  // Delete student
  const openDelete = (student: any) => {
    setSelectedStudent(student);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedStudent) return;
    const { error } = await supabase.from('students').delete().eq('id', selectedStudent.id);
    if (error) {
      toast({ title: t('Error', 'خطأ'), description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: t('Student deleted', 'تم حذف الطالب') });
    setDeleteOpen(false);
    setSelectedStudent(null);
    fetchData();
  };

  // Form fields
  const [fullName, setFullName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [studentUid, setStudentUid] = useState('');

  // Utility: Generate next student ID (e.g. ABS-001, ABS-002...)
  function generateStudentId() {
    const prefix = 'ABS-';
    const nums = students
      .map(s => s.student_uid)
      .filter(Boolean)
      .map(id => parseInt((id || '').replace(/\D/g, '')))
      .filter(n => !isNaN(n));
    const next = (nums.length ? Math.max(...nums) : 0) + 1;
    return `${prefix}${String(next).padStart(3, '0')}`;
  }

  // Utility: Simple English to Arabic transliteration (placeholder)
  function transliterateToArabic(text: string): string {
    // This is a placeholder. For real use, integrate a proper transliteration or translation API.
    // Here, just return the English text in Arabic letters for demo purposes.
    // You can replace this with a real library or API call.
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
  const [gender, setGender] = useState('');
  const [classLevelId, setClassLevelId] = useState('');
  const [classArmId, setClassArmId] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');

  const fetchData = async () => {
    const [studRes, clRes, armsRes] = await Promise.all([
      supabase.from('students').select('*').order('full_name'),
      supabase.from('class_levels').select('*').order('display_order'),
      supabase.from('class_arms').select('*'),
    ]);
    setStudents(studRes.data || []);
    setClassLevels(clRes.data || []);
    setClassArms(armsRes.data || []);
  };

  useEffect(() => { fetchData(); }, []);

  const filteredArms = useMemo(() => classArms.filter(a => a.class_level_id === classLevelId), [classArms, classLevelId]);

  // Students filtered by selected class
  const studentsInSelectedClass = useMemo(() => {
    if (!selectedClassLevel) return [];
    return students.filter(s =>
      s.class_level_id === selectedClassLevel.id &&
      (selectedClassArm ? s.class_arm_id === selectedClassArm.id : !s.class_arm_id)
    );
  }, [students, selectedClassLevel, selectedClassArm]);

  const filtered = studentsInSelectedClass.filter(s =>
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (s.student_uid && s.student_uid.toLowerCase().includes(search.toLowerCase())) ||
    (s.name_en && s.name_en.toLowerCase().includes(search.toLowerCase()))
  );

  const getClassName = (levelId: string, armId: string) => {
    const level = classLevels.find(c => c.id === levelId);
    if (!level) return '';
    if (!armId) {
      // No arm assigned, just show class level
      return bilingualText(level.name_en, level.name_ar);
    }
    const arm = classArms.find(a => a.id === armId);
    return `${bilingualText(level.name_en, level.name_ar)}${arm ? ' - ' + arm.name : ''}`;
  };

  const addStudent = async () => {
    if (!fullName.trim()) return;
    // Auto-generate student ID if not provided
    const autoId = studentUid.trim() ? studentUid.trim() : generateStudentId();
    // Auto-generate Arabic name if not provided
    const autoAr = nameAr.trim() ? nameAr.trim() : transliterateToArabic(nameEn.trim() || fullName.trim());
    const { error } = await supabase.from('students').insert({
      full_name: fullName.trim(),
      name_en: nameEn.trim() || fullName.trim(),
      name_ar: autoAr,
      student_uid: autoId,
      gender: gender || null,
      class_level_id: classLevelId || null,
      class_arm_id: classArmId || null,
      guardian_name: guardianName.trim() || null,
      guardian_phone: guardianPhone.trim() || null,
    });
    if (error) { toast({ title: t('Error', 'خطأ'), description: error.message, variant: 'destructive' }); return; }
    toast({ title: t('Student added', 'تمت إضافة الطالب') });
    setFullName(''); setNameEn(''); setNameAr(''); setStudentUid('');
    setGender(''); setClassLevelId(''); setClassArmId('');
    setGuardianName(''); setGuardianPhone('');
    setAddOpen(false);
    fetchData();
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Step 1: Show classes */}
        {step === 'classes' && (
          <div>
            <h1 className="text-2xl font-bold mb-4">{t('Students', 'الطلاب')}</h1>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {classLevels.map(level => {
                const arms = classArms.filter(a => a.class_level_id === level.id);
                return (
                  <Card key={level.id} className="shadow-card">
                    <CardHeader className="pb-3">
                      <span className="font-semibold">{bilingualText(level.name_en, level.name_ar)}</span>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {arms.length === 0 ? (
                        <Button
                          variant="outline"
                          className="w-full justify-between"
                          onClick={() => { setSelectedClassLevel(level); setSelectedClassArm(null); setStep('students'); }}
                        >
                          <span className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            {bilingualText(level.name_en, level.name_ar)}
                          </span>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      ) : (
                        arms.map(arm => (
                          <Button
                            key={arm.id}
                            variant="outline"
                            className="w-full justify-between"
                            onClick={() => { setSelectedClassLevel(level); setSelectedClassArm(arm); setStep('students'); }}
                          >
                            <span className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              {bilingualText(level.name_en, level.name_ar)} - {arm.name}
                            </span>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        ))
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Show students in selected class */}
        {step === 'students' && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Button variant="ghost" size="icon" onClick={() => setStep('classes')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-bold">
                {bilingualText(selectedClassLevel?.name_en, selectedClassLevel?.name_ar)}
                {selectedClassArm ? ` - ${selectedClassArm.name}` : ''}
              </h1>
            </div>
            <div className="flex items-center justify-between mb-2">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" placeholder={t('Search students...', 'البحث عن طالب...')} value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="mr-2 h-4 w-4" />{t('Add Student', 'إضافة طالب')}</Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader><DialogTitle>{t('Add Student', 'إضافة طالب')}</DialogTitle></DialogHeader>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2">
                      <Label>{t('Full Name', 'الاسم الكامل')} *</Label>
                      <Input value={fullName} onChange={e => setFullName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('Name (English)', 'الاسم (إنجليزي)')}</Label>
                      <Input value={nameEn} onChange={e => setNameEn(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('Name (Arabic)', 'الاسم (عربي)')}</Label>
                      <Input value={nameAr} onChange={e => setNameAr(e.target.value)} placeholder={t('Auto-generated if blank', 'يتم توليده تلقائياً إذا ترك فارغاً')} />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('Student ID', 'رقم الطالب')}</Label>
                      <Input value={studentUid} onChange={e => setStudentUid(e.target.value)} placeholder={t('Auto-generated if blank', 'يتم توليده تلقائياً إذا ترك فارغاً')} />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('Gender', 'الجنس')}</Label>
                      <Select value={gender} onValueChange={setGender}>
                        <SelectTrigger><SelectValue placeholder={t('Select', 'اختر')} /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">{t('Male', 'ذكر')}</SelectItem>
                          <SelectItem value="female">{t('Female', 'أنثى')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Class Level and Arm are fixed for this context */}
                    <div className="space-y-2 col-span-2">
                      <Label>{t('Guardian Name', 'اسم ولي الأمر')}</Label>
                      <Input value={guardianName} onChange={e => setGuardianName(e.target.value)} />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label>{t('Guardian Phone', 'هاتف ولي الأمر')}</Label>
                      <Input value={guardianPhone} onChange={e => setGuardianPhone(e.target.value)} />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild><Button variant="outline">{t('Cancel', 'إلغاء')}</Button></DialogClose>
                    <Button onClick={() => {
                      // Set class level/arm for add
                      setClassLevelId(selectedClassLevel?.id || '');
                      setClassArmId(selectedClassArm?.id || '');
                      addStudent();
                    }}>{t('Add', 'إضافة')}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <Card className="shadow-card">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('Student ID', 'رقم الطالب')}</TableHead>
                      <TableHead>{t('Name', 'الاسم')}</TableHead>
                      <TableHead>{t('Gender', 'الجنس')}</TableHead>
                      <TableHead>{t('Status', 'الحالة')}</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(student => (
                      <TableRow key={student.id}>
                        <TableCell className="font-mono text-sm">{student.student_uid || '—'}</TableCell>
                        <TableCell className="font-medium">{bilingualText(student.name_en || student.full_name, student.name_ar)}</TableCell>
                        <TableCell className="capitalize">{student.gender ? t(student.gender, student.gender === 'male' ? 'ذكر' : 'أنثى') : '—'}</TableCell>
                        <TableCell>
                          <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
                            {t(student.status, student.status === 'active' ? 'نشط' : 'غير نشط')}
                          </Badge>
                        </TableCell>
                        <TableCell className="flex gap-2">
                          <Button size="icon" variant="ghost" onClick={() => openEdit(student)}><Pencil className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => openDelete(student)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filtered.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">{t('No students found.', 'لا طلاب.')}</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Edit and Delete dialogs remain unchanged */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{t('Edit Student', 'تعديل طالب')}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>{t('Full Name', 'الاسم الكامل')} *</Label>
                <Input value={editFields.full_name || ''} onChange={e => handleEditChange('full_name', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t('Name (English)', 'الاسم (إنجليزي)')}</Label>
                <Input value={editFields.name_en || ''} onChange={e => handleEditChange('name_en', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t('Name (Arabic)', 'الاسم (عربي)')}</Label>
                <Input value={editFields.name_ar || ''} onChange={e => handleEditChange('name_ar', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t('Student ID', 'رقم الطالب')}</Label>
                <Input value={editFields.student_uid || ''} onChange={e => handleEditChange('student_uid', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t('Gender', 'الجنس')}</Label>
                <Select value={editFields.gender || ''} onValueChange={v => handleEditChange('gender', v)}>
                  <SelectTrigger><SelectValue placeholder={t('Select', 'اختر')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">{t('Male', 'ذكر')}</SelectItem>
                    <SelectItem value="female">{t('Female', 'أنثى')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('Class Level', 'المرحلة')}</Label>
                <Select value={editFields.class_level_id || ''} onValueChange={v => { handleEditChange('class_level_id', v); handleEditChange('class_arm_id', ''); }}>
                  <SelectTrigger><SelectValue placeholder={t('Select', 'اختر')} /></SelectTrigger>
                  <SelectContent>
                    {classLevels.map(c => <SelectItem key={c.id} value={c.id}>{bilingualText(c.name_en, c.name_ar)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('Class Arm', 'الشعبة')}</Label>
                <Select value={editFields.class_arm_id || ''} onValueChange={v => handleEditChange('class_arm_id', v)} disabled={!editFields.class_level_id}>
                  <SelectTrigger><SelectValue placeholder={t('Select', 'اختر')} /></SelectTrigger>
                  <SelectContent>
                    {classArms.filter(a => a.class_level_id === editFields.class_level_id).map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('Guardian Name', 'اسم ولي الأمر')}</Label>
                <Input value={editFields.guardian_name || ''} onChange={e => handleEditChange('guardian_name', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t('Guardian Phone', 'هاتف ولي الأمر')}</Label>
                <Input value={editFields.guardian_phone || ''} onChange={e => handleEditChange('guardian_phone', e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">{t('Cancel', 'إلغاء')}</Button></DialogClose>
              <Button onClick={saveEdit}>{t('Save', 'حفظ')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogTrigger asChild></AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('Delete Student', 'حذف الطالب')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('Are you sure you want to delete this student? This action cannot be undone.', 'هل أنت متأكد أنك تريد حذف هذا الطالب؟ لا يمكن التراجع عن هذا الإجراء.')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('Cancel', 'إلغاء')}</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>{t('Delete', 'حذف')}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

export default AdminStudents;
