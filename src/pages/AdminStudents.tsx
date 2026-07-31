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
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Search, Pencil, Trash2, Users, ChevronRight, ArrowLeft, Download, Printer } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCampus } from '@/contexts/CampusContext';

const AdminStudents = () => {
  const { t, bilingualText } = useLanguage();
  const { toast } = useToast();
  const { role, user } = useAuth();
  const { campusId } = useCampus();
  const [students, setStudents] = useState<any[]>([]);
  const [classLevels, setClassLevels] = useState<any[]>([]);
  const [classArms, setClassArms] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [step, setStep] = useState<'classes' | 'students'>('classes');
  const [selectedClassLevel, setSelectedClassLevel] = useState<any>(null);
  const [selectedClassArm, setSelectedClassArm] = useState<any>(null);
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
    }).eq('id', selectedStudent.id).eq('campus_id', campusId);
    if (error) {
      toast({ title: t('Error', 'خطأ'), description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: t('Student updated', 'تم تحديث الطالب') });
    setEditOpen(false);
    setSelectedStudent(null);
    fetchData();
  };

  const openDelete = (student: any) => {
    setSelectedStudent(student);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedStudent) return;
    const { error } = await supabase.from('students').delete().eq('id', selectedStudent.id).eq('campus_id', campusId);
    if (error) {
      toast({ title: t('Error', 'خطأ'), description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: t('Student deleted', 'تم حذف الطالب') });
    setDeleteOpen(false);
    setSelectedStudent(null);
    fetchData();
  };

  const [fullName, setFullName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [studentUid, setStudentUid] = useState('');

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

  function transliterateToArabic(text: string): string {
    return text
      .replace(/a/gi, 'ا').replace(/b/gi, 'ب').replace(/c/gi, 'ك').replace(/d/gi, 'د')
      .replace(/e/gi, 'ي').replace(/f/gi, 'ف').replace(/g/gi, 'ج').replace(/h/gi, 'ه')
      .replace(/i/gi, 'ي').replace(/j/gi, 'ج').replace(/k/gi, 'ك').replace(/l/gi, 'ل')
      .replace(/m/gi, 'م').replace(/n/gi, 'ن').replace(/o/gi, 'و').replace(/p/gi, 'ب')
      .replace(/q/gi, 'ق').replace(/r/gi, 'ر').replace(/s/gi, 'س').replace(/t/gi, 'ت')
      .replace(/u/gi, 'و').replace(/v/gi, 'ف').replace(/w/gi, 'و').replace(/x/gi, 'كس')
      .replace(/y/gi, 'ي').replace(/z/gi, 'ز');
  }

  const [gender, setGender] = useState('');
  const [classLevelId, setClassLevelId] = useState('');
  const [classArmId, setClassArmId] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const fetchData = async () => {
    const [studRes, clRes, armsRes] = await Promise.all([
      supabase.from('students').select('*').eq('campus_id', campusId).order('full_name'),
      supabase.from('class_levels').select('*').eq('campus_id', campusId).order('display_order'),
      supabase.from('class_arms').select('*').eq('campus_id', campusId),
    ]);
    let studentsData = studRes.data || [];
    let levels = clRes.data || [];
    const arms = armsRes.data || [];

    // If current user is a teacher, limit view to their assigned class level
    if (role === 'teacher' && user) {
      try {
        const { data: profile } = await supabase.from('profiles').select('class_teacher_class_level_id').eq('user_id', user.id).maybeSingle();
        const assignedLevelId = profile?.class_teacher_class_level_id;
        if (assignedLevelId) {
          studentsData = studentsData.filter(s => s.class_level_id === assignedLevelId);
          levels = levels.filter(l => l.id === assignedLevelId);
        }
      } catch (err) {
        // ignore and fall back to full data
      }
    }

    setStudents(studentsData);
    setClassLevels(levels);
    if (role === 'teacher' && levels.length > 0) {
      setSelectedClassLevel(levels[0]);
    }
    setClassArms(arms);
  };

  useEffect(() => { if (campusId) fetchData(); }, [campusId]);

  const handleAddOpenChange = (open: boolean) => {
    setAddOpen(open);
    if (open) {
      setClassLevelId(selectedClassLevel?.id || '');
      setClassArmId(selectedClassArm?.id || '');
      setFullName(''); setNameEn(''); setNameAr(''); setStudentUid('');
      setGender(''); setGuardianName(''); setGuardianPhone('');
      setPhotoFile(null); setPhotoPreview(null);
    } else {
      setClassLevelId(''); setClassArmId('');
    }
  };

  const filteredArms = useMemo(() => classArms.filter(a => a.class_level_id === classLevelId), [classArms, classLevelId]);

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
    if (!armId) return bilingualText(level.name_en, level.name_ar);
    const arm = classArms.find(a => a.id === armId);
    return `${bilingualText(level.name_en, level.name_ar)}${arm ? ' - ' + arm.name : ''}`;
  };

  const addStudent = async (levelId: string = '', armId: string = '') => {
    if (!fullName.trim()) return;
    // Only allow staff (admin or teacher) to add students
    if (role !== 'admin' && role !== 'teacher') {
      toast({ title: t('Permission denied', 'تم رفض الإذن'), description: t('Only staff can add students', 'فقط الموظفين يمكنهم إضافة الطلاب'), variant: 'destructive' });
      return;
    }
    const autoId = studentUid.trim() ? studentUid.trim() : generateStudentId();
    const autoAr = nameAr.trim() ? nameAr.trim() : transliterateToArabic(nameEn.trim() || fullName.trim());
    const finalLevelId = levelId || classLevelId || null;
    const finalArmId = armId || classArmId || null;

    if (!finalLevelId) {
      toast({ title: t('Error', 'خطأ'), description: t('Please select a class level', 'الرجاء تحديد مستوى الفئة'), variant: 'destructive' });
      return;
    }

    const { error: insertErr } = await supabase.from('students').insert({
      full_name: fullName.trim(),
      name_en: nameEn.trim() || fullName.trim(),
      name_ar: autoAr,
      student_uid: autoId,
      gender: gender || null,
      status: 'active',
      class_level_id: finalLevelId,
      class_arm_id: finalArmId,
      guardian_name: guardianName.trim() || null,
      guardian_phone: guardianPhone.trim() || null,
      campus_id: campusId,
    }).select().maybeSingle();
    if (insertErr) { toast({ title: t('Error', 'خطأ'), description: insertErr.message, variant: 'destructive' }); return; }

    toast({ title: t('Student added', 'تمت إضافة الطالب') });
    setFullName(''); setNameEn(''); setNameAr(''); setStudentUid('');
    setGender(''); setClassLevelId(''); setClassArmId('');
    setGuardianName(''); setGuardianPhone('');
    setPhotoFile(null); setPhotoPreview(null);
    setAddOpen(false);
    fetchData();
  };

  // Master student list print
  const printMasterList = () => {
    const allStudents = students.filter(s => s.status === 'active');
    const rows = allStudents.map((s, i) => {
      const level = classLevels.find(c => c.id === s.class_level_id);
      const arm = classArms.find(a => a.id === s.class_arm_id);
      return `<tr>
        <td>${i + 1}</td>
        <td>${s.student_uid || '—'}</td>
        <td>${s.name_en || s.full_name}</td>
        <td>${s.name_ar || '—'}</td>
        <td>${level?.name_en || '—'}</td>
        <td>${arm?.name || '—'}</td>
        <td>${s.gender || '—'}</td>
      </tr>`;
    });

    const html = `<html><head><title>Master Student List</title>
    <style>
      @page { size: A4 landscape; margin: 15mm; }
      body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; }
      .header { text-align: center; margin-bottom: 20px; }
      .header img { width: 50px; height: 50px; object-fit: contain; }
      .header h1 { font-size: 20px; margin: 5px 0; text-transform: uppercase; }
      .header p { font-size: 12px; color: #666; }
      table { width: 100%; border-collapse: collapse; font-size: 11px; }
      th { background: #047857; color: white; padding: 8px 6px; text-align: left; font-weight: 700; }
      td { padding: 6px; border: 1px solid #d1d5db; }
      tr:nth-child(even) { background: #f9fafb; }
      .footer { margin-top: 20px; text-align: center; font-size: 10px; color: #888; }
    </style></head><body>
    <div class="header">
      <img src="${window.location.origin}/images/school-logo.png" alt="Logo" onerror="this.style.display='none'" />
      <h1>AL-BARI GROUP OF SCHOOLS</h1>
      <p>Madrasah Section — Master Student List</p>
      <p>Total Students: ${allStudents.length} | Generated: ${new Date().toLocaleDateString()}</p>
    </div>
    <table>
      <thead><tr><th>#</th><th>Student ID</th><th>Name (EN)</th><th>Name (AR)</th><th>Class</th><th>Arm</th><th>Gender</th></tr></thead>
      <tbody>${rows.join('')}</tbody>
    </table>
    <div class="footer">Al-Bari Group of Schools — Master Student List</div>
    </body></html>`;

    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => { w.focus(); w.print(); }, 400); }
  };

  // Master CSV export
  const exportMasterCSV = () => {
    const allStudents = students.filter(s => s.status === 'active');
    const rows = allStudents.map(s => {
      const level = classLevels.find(c => c.id === s.class_level_id);
      const arm = classArms.find(a => a.id === s.class_arm_id);
      return {
        'Student ID': s.student_uid || '',
        'Name (EN)': s.name_en || s.full_name,
        'Name (AR)': s.name_ar || '',
        'Class': level?.name_en || '',
        'Arm': arm?.name || '',
        'Gender': s.gender || '',
        'Guardian': s.guardian_name || '',
        'Phone': s.guardian_phone || '',
      };
    });
    const headers = Object.keys(rows[0] || {});
    const csv = [headers.join(','), ...rows.map(r => headers.map(h => `"${(r as any)[h] || ''}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'master-student-list.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        {step === 'classes' && (
          <div>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h1 className="text-2xl font-bold">{t('Students', 'الطلاب')}</h1>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={exportMasterCSV}>
                  <Download className="mr-2 h-4 w-4" />
                  {t('Export Master List', 'تصدير قائمة رئيسية')}
                </Button>
                <Button size="sm" variant="outline" onClick={printMasterList}>
                  <Printer className="mr-2 h-4 w-4" />
                  {t('Print Master List', 'طباعة قائمة رئيسية')}
                </Button>
              </div>
            </div>
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
                        <Button variant="outline" className="w-full justify-between"
                          onClick={() => { setSelectedClassLevel(level); setSelectedClassArm(null); setStep('students'); }}>
                          <span className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            {bilingualText(level.name_en, level.name_ar)}
                          </span>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      ) : (
                        arms.map(arm => (
                          <Button key={arm.id} variant="outline" className="w-full justify-between"
                            onClick={() => { setSelectedClassLevel(level); setSelectedClassArm(arm); setStep('students'); }}>
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
            <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" placeholder={t('Search students...', 'البحث عن طالب...')} value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => {
                  const rows = filtered.map(s => ({
                    'Student ID': s.student_uid || '',
                    'Name (EN)': s.name_en || s.full_name,
                    'Name (AR)': s.name_ar || '',
                    'Gender': s.gender || '',
                    'Class': getClassName(s.class_level_id, s.class_arm_id),
                    'Guardian': s.guardian_name || '',
                    'Phone': s.guardian_phone || '',
                    'Status': s.status,
                  }));
                  const headers = Object.keys(rows[0] || {});
                  const csv = [headers.join(','), ...rows.map(r => headers.map(h => `"${(r as any)[h] || ''}"`).join(','))].join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a'); a.href = url; a.download = `students-${selectedClassLevel?.name_en || 'all'}.csv`; a.click();
                  URL.revokeObjectURL(url);
                }}>
                  <Download className="mr-2 h-4 w-4" />
                  {t('Export CSV', 'تصدير CSV')}
                </Button>
                <Button size="sm" variant="outline" onClick={() => {
                  const printHtml = `<html><head><title>Students</title><style>body{font-family:Arial;} table{width:100%;border-collapse:collapse;} th,td{border:1px solid #ccc;padding:6px 8px;text-align:left;font-size:12px;} th{background:#047857;color:white;}</style></head><body>
                  <h2>${selectedClassLevel?.name_en || ''}${selectedClassArm ? ' - ' + selectedClassArm.name : ''}</h2>
                  <table><thead><tr><th>#</th><th>Student ID</th><th>Name</th><th>Gender</th><th>Guardian</th><th>Phone</th></tr></thead><tbody>
                  ${filtered.map((s, i) => `<tr><td>${i+1}</td><td>${s.student_uid||''}</td><td>${s.name_en||s.full_name}</td><td>${s.gender||''}</td><td>${s.guardian_name||''}</td><td>${s.guardian_phone||''}</td></tr>`).join('')}
                  </tbody></table></body></html>`;
                  const w = window.open('', '_blank');
                  if (w) { w.document.write(printHtml); w.document.close(); setTimeout(() => { w.focus(); w.print(); }, 300); }
                }}>
                  <Printer className="mr-2 h-4 w-4" />
                  {t('Print List', 'طباعة القائمة')}
                </Button>
                <Dialog open={addOpen} onOpenChange={handleAddOpenChange}>
                  <DialogTrigger asChild>
                    <Button size="sm"><Plus className="mr-2 h-4 w-4" />{t('Add Student', 'إضافة طالب')}</Button>
                  </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader><DialogTitle>{t('Add Student', 'إضافة طالب')}</DialogTitle></DialogHeader>
                  <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2">
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
                      <Input value={nameAr} onChange={e => setNameAr(e.target.value)} placeholder={t('Auto-generated if blank', 'يتم توليده تلقائياً')} />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('Student ID', 'رقم الطالب')}</Label>
                      <Input value={studentUid} onChange={e => setStudentUid(e.target.value)} placeholder={t('Auto-generated if blank', 'يتم توليده تلقائياً')} />
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
                    <div className="space-y-2">
                      <Label>{t('Class Level', 'المرحلة')}</Label>
                      <Select value={classLevelId} onValueChange={v => { setClassLevelId(v); setClassArmId(''); }}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {classLevels.map(c => <SelectItem key={c.id} value={c.id}>{bilingualText(c.name_en, c.name_ar)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{t('Arm', 'الشعبة')}</Label>
                      <Select value={classArmId} onValueChange={setClassArmId} disabled={!classLevelId}>
                        <SelectTrigger><SelectValue placeholder={t('None', 'لا يوجد')} /></SelectTrigger>
                        <SelectContent>
                          {filteredArms.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{t('Guardian Name', 'اسم ولي الأمر')}</Label>
                      <Input value={guardianName} onChange={e => setGuardianName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('Guardian Phone', 'هاتف ولي الأمر')}</Label>
                      <Input value={guardianPhone} onChange={e => setGuardianPhone(e.target.value)} />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild><Button variant="outline">{t('Cancel', 'إلغاء')}</Button></DialogClose>
                    <Button onClick={() => addStudent()} disabled={!fullName.trim()}>
                      <Plus className="mr-2 h-4 w-4" />
                      {t('Add', 'إضافة')}
                    </Button>
                  </DialogFooter>
                </DialogContent>
                </Dialog>
              </div>
            </div>

            <Card className="shadow-card mt-2">
              <CardContent className="p-0">
                <div className="overflow-y-auto max-h-[60vh]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8">#</TableHead>
                        <TableHead>{t('Student ID', 'رقم الطالب')}</TableHead>
                        <TableHead>{t('Name', 'الاسم')}</TableHead>
                        <TableHead>{t('Gender', 'الجنس')}</TableHead>
                        <TableHead>{t('Status', 'الحالة')}</TableHead>
                        <TableHead className="text-right">{t('Actions', 'إجراءات')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            {t('No students found', 'لا يوجد طلاب')}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filtered.map((student, i) => (
                          <TableRow key={student.id}>
                            <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                            <TableCell className="font-mono text-sm">{student.student_uid || '—'}</TableCell>
                            <TableCell>
                              <div className="font-medium">{student.name_en || student.full_name}</div>
                              {student.name_ar && <div className="text-xs text-muted-foreground" dir="rtl">{student.name_ar}</div>}
                            </TableCell>
                            <TableCell className="capitalize">{student.gender || '—'}</TableCell>
                            <TableCell>
                              <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
                                {student.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button size="icon" variant="ghost" onClick={() => openEdit(student)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <AlertDialog open={deleteOpen && selectedStudent?.id === student.id} onOpenChange={open => { if (!open) setDeleteOpen(false); }}>
                                  <AlertDialogTrigger asChild>
                                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => openDelete(student)}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>{t('Delete Student', 'حذف الطالب')}</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        {t('Are you sure? This action cannot be undone.', 'هل أنت متأكد؟ لا يمكن التراجع عن هذا الإجراء.')}
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>{t('Cancel', 'إلغاء')}</AlertDialogCancel>
                                      <AlertDialogAction onClick={confirmDelete}>{t('Delete', 'حذف')}</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Edit Student Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{t('Edit Student', 'تعديل الطالب')}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="space-y-2 col-span-2">
                <Label>{t('Full Name', 'الاسم الكامل')}</Label>
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
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">{t('Male', 'ذكر')}</SelectItem>
                    <SelectItem value="female">{t('Female', 'أنثى')}</SelectItem>
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
              <div className="space-y-2">
                <Label>{t('Status', 'الحالة')}</Label>
                <Select value={editFields.status || 'active'} onValueChange={v => handleEditChange('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t('Active', 'نشط')}</SelectItem>
                    <SelectItem value="graduated">{t('Graduated', 'متخرج')}</SelectItem>
                    <SelectItem value="transferred">{t('Transferred', 'منقول')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">{t('Cancel', 'إلغاء')}</Button></DialogClose>
              <Button onClick={saveEdit}>{t('Save', 'حفظ')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminStudents;
