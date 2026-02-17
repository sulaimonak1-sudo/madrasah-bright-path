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
import { Plus, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
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

  const filteredArms = classArms.filter(a => a.class_level_id === classLevelId);

  const filtered = students.filter(s =>
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t('Students', 'الطلاب')}</h1>
            <p className="text-muted-foreground">{t('Manage student records', 'إدارة سجلات الطلاب')}</p>
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
                <div className="space-y-2">
                  <Label>{t('Class Level', 'المرحلة')}</Label>
                  <Select value={classLevelId} onValueChange={(v) => { setClassLevelId(v); setClassArmId(''); }}>
                    <SelectTrigger><SelectValue placeholder={t('Select', 'اختر')} /></SelectTrigger>
                    <SelectContent>
                      {classLevels.map(c => <SelectItem key={c.id} value={c.id}>{bilingualText(c.name_en, c.name_ar)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('Class Arm', 'الشعبة')}</Label>
                  <Select value={classArmId} onValueChange={setClassArmId} disabled={!classLevelId}>
                    <SelectTrigger><SelectValue placeholder={t('Select', 'اختر')} /></SelectTrigger>
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
                <Button onClick={addStudent}>{t('Add', 'إضافة')}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder={t('Search students...', 'البحث عن طالب...')} value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('Student ID', 'رقم الطالب')}</TableHead>
                  <TableHead>{t('Name', 'الاسم')}</TableHead>
                  <TableHead>{t('Class', 'الصف')}</TableHead>
                  <TableHead>{t('Gender', 'الجنس')}</TableHead>
                  <TableHead>{t('Status', 'الحالة')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(student => (
                  <TableRow key={student.id}>
                    <TableCell className="font-mono text-sm">{student.student_uid || '—'}</TableCell>
                    <TableCell className="font-medium">{bilingualText(student.name_en || student.full_name, student.name_ar)}</TableCell>
                    <TableCell>{student.class_level_id ? getClassName(student.class_level_id, student.class_arm_id) : '—'}</TableCell>
                    <TableCell className="capitalize">{student.gender ? t(student.gender, student.gender === 'male' ? 'ذكر' : 'أنثى') : '—'}</TableCell>
                    <TableCell>
                      <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
                        {t(student.status, student.status === 'active' ? 'نشط' : 'غير نشط')}
                      </Badge>
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
    </AdminLayout>
  );
};

export default AdminStudents;
