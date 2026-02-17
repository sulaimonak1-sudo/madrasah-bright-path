import { Student, ClassLevel, ClassArm, Subject, Session, Term, TermScore } from '@/types';

export const mockClassLevels: ClassLevel[] = [
  { id: 'cl1', name_en: 'Tahfiz 1', name_ar: 'تحفيظ ١', order: 1 },
  { id: 'cl2', name_en: 'Tahfiz 2', name_ar: 'تحفيظ ٢', order: 2 },
  { id: 'cl3', name_en: 'Tahfiz 3', name_ar: 'تحفيظ ٣', order: 3 },
  { id: 'cl4', name_en: 'Tahfiz 4', name_ar: 'تحفيظ ٤', order: 4 },
  { id: 'cl5', name_en: 'Tahfiz 5', name_ar: 'تحفيظ ٥', order: 5 },
  { id: 'cl6', name_en: 'Tahfiz 6', name_ar: 'تحفيظ ٦', order: 6 },
];

export const mockClassArms: ClassArm[] = [
  { id: 'ca1', class_level_id: 'cl1', name: 'A' },
  { id: 'ca2', class_level_id: 'cl1', name: 'B' },
  { id: 'ca3', class_level_id: 'cl2', name: 'A' },
  { id: 'ca4', class_level_id: 'cl2', name: 'B' },
  { id: 'ca5', class_level_id: 'cl2', name: 'C' },
  { id: 'ca6', class_level_id: 'cl3', name: 'A' },
];

export const mockSubjects: Subject[] = [
  { id: 's1', name_en: 'Quran Memorization', name_ar: 'حفظ القرآن', class_level_id: 'cl1' },
  { id: 's2', name_en: 'Arabic Language', name_ar: 'اللغة العربية', class_level_id: 'cl1' },
  { id: 's3', name_en: 'Islamic Studies', name_ar: 'الدراسات الإسلامية', class_level_id: 'cl1' },
  { id: 's4', name_en: 'Fiqh', name_ar: 'الفقه', class_level_id: 'cl1' },
  { id: 's5', name_en: 'Hadith', name_ar: 'الحديث', class_level_id: 'cl1' },
  { id: 's6', name_en: 'Tajweed', name_ar: 'التجويد', class_level_id: 'cl1' },
  { id: 's7', name_en: 'Mathematics', name_ar: 'الرياضيات', class_level_id: 'cl1' },
  { id: 's8', name_en: 'English Language', name_ar: 'اللغة الإنجليزية', class_level_id: 'cl1' },
];

export const mockSessions: Session[] = [
  { id: 'ss1', name: '2023/2024', is_active: false },
  { id: 'ss2', name: '2024/2025', is_active: true },
];

export const mockTerms: Term[] = [
  { id: 't1', session_id: 'ss2', name_en: '1st Term', name_ar: 'الفصل الأول', term_number: 1, is_locked: true },
  { id: 't2', session_id: 'ss2', name_en: '2nd Term', name_ar: 'الفصل الثاني', term_number: 2, is_locked: true },
  { id: 't3', session_id: 'ss2', name_en: '3rd Term', name_ar: 'الفصل الثالث', term_number: 3, is_locked: false },
];

export const mockStudents: Student[] = [
  { id: 'st1', student_id: 'ABS-001', name_en: 'Ahmad Ibrahim', name_ar: 'أحمد إبراهيم', class_level_id: 'cl1', class_arm_id: 'ca1', gender: 'male', guardian_name: 'Ibrahim Musa', guardian_phone: '08012345678', status: 'active', created_at: '2024-01-15' },
  { id: 'st2', student_id: 'ABS-002', name_en: 'Fatima Abdullahi', name_ar: 'فاطمة عبد الله', class_level_id: 'cl1', class_arm_id: 'ca1', gender: 'female', guardian_name: 'Abdullahi Yusuf', guardian_phone: '08098765432', status: 'active', created_at: '2024-01-15' },
  { id: 'st3', student_id: 'ABS-003', name_en: 'Yusuf Bello', name_ar: 'يوسف بلو', class_level_id: 'cl1', class_arm_id: 'ca2', gender: 'male', guardian_name: 'Bello Abubakar', guardian_phone: '08055555555', status: 'active', created_at: '2024-01-15' },
  { id: 'st4', student_id: 'ABS-004', name_en: 'Aisha Mohammed', name_ar: 'عائشة محمد', class_level_id: 'cl2', class_arm_id: 'ca3', gender: 'female', guardian_name: 'Mohammed Ali', guardian_phone: '08011111111', status: 'active', created_at: '2024-01-15' },
  { id: 'st5', student_id: 'ABS-005', name_en: 'Omar Suleiman', name_ar: 'عمر سليمان', class_level_id: 'cl2', class_arm_id: 'ca4', gender: 'male', guardian_name: 'Suleiman Daud', guardian_phone: '08022222222', status: 'active', created_at: '2024-01-15' },
];

export const mockTermScores: TermScore[] = [
  // Student 1, Term 1
  { id: 'ts1', student_id: 'st1', subject_id: 's1', term_id: 't1', ca1: 12, ca2: 13, exam: 55, total: 80, grade: 'A' },
  { id: 'ts2', student_id: 'st1', subject_id: 's2', term_id: 't1', ca1: 10, ca2: 11, exam: 45, total: 66, grade: 'B' },
  { id: 'ts3', student_id: 'st1', subject_id: 's3', term_id: 't1', ca1: 14, ca2: 12, exam: 50, total: 76, grade: 'A' },
  { id: 'ts4', student_id: 'st1', subject_id: 's4', term_id: 't1', ca1: 8, ca2: 10, exam: 40, total: 58, grade: 'C' },
  { id: 'ts5', student_id: 'st1', subject_id: 's5', term_id: 't1', ca1: 13, ca2: 14, exam: 52, total: 79, grade: 'A' },
  { id: 'ts6', student_id: 'st1', subject_id: 's6', term_id: 't1', ca1: 11, ca2: 12, exam: 48, total: 71, grade: 'A' },
  { id: 'ts7', student_id: 'st1', subject_id: 's7', term_id: 't1', ca1: 9, ca2: 8, exam: 35, total: 52, grade: 'C' },
  { id: 'ts8', student_id: 'st1', subject_id: 's8', term_id: 't1', ca1: 10, ca2: 10, exam: 42, total: 62, grade: 'B' },
  // Student 1, Term 2
  { id: 'ts9', student_id: 'st1', subject_id: 's1', term_id: 't2', ca1: 13, ca2: 14, exam: 56, total: 83, grade: 'A' },
  { id: 'ts10', student_id: 'st1', subject_id: 's2', term_id: 't2', ca1: 11, ca2: 12, exam: 47, total: 70, grade: 'A' },
  { id: 'ts11', student_id: 'st1', subject_id: 's3', term_id: 't2', ca1: 13, ca2: 13, exam: 52, total: 78, grade: 'A' },
  { id: 'ts12', student_id: 'st1', subject_id: 's4', term_id: 't2', ca1: 9, ca2: 11, exam: 42, total: 62, grade: 'B' },
  { id: 'ts13', student_id: 'st1', subject_id: 's5', term_id: 't2', ca1: 14, ca2: 13, exam: 50, total: 77, grade: 'A' },
  { id: 'ts14', student_id: 'st1', subject_id: 's6', term_id: 't2', ca1: 12, ca2: 13, exam: 50, total: 75, grade: 'A' },
  { id: 'ts15', student_id: 'st1', subject_id: 's7', term_id: 't2', ca1: 10, ca2: 9, exam: 38, total: 57, grade: 'C' },
  { id: 'ts16', student_id: 'st1', subject_id: 's8', term_id: 't2', ca1: 11, ca2: 11, exam: 44, total: 66, grade: 'B' },
  // Student 1, Term 3
  { id: 'ts17', student_id: 'st1', subject_id: 's1', term_id: 't3', ca1: 14, ca2: 14, exam: 58, total: 86, grade: 'A' },
  { id: 'ts18', student_id: 'st1', subject_id: 's2', term_id: 't3', ca1: 12, ca2: 13, exam: 48, total: 73, grade: 'A' },
  { id: 'ts19', student_id: 'st1', subject_id: 's3', term_id: 't3', ca1: 14, ca2: 14, exam: 54, total: 82, grade: 'A' },
  { id: 'ts20', student_id: 'st1', subject_id: 's4', term_id: 't3', ca1: 10, ca2: 12, exam: 44, total: 66, grade: 'B' },
  { id: 'ts21', student_id: 'st1', subject_id: 's5', term_id: 't3', ca1: 14, ca2: 14, exam: 54, total: 82, grade: 'A' },
  { id: 'ts22', student_id: 'st1', subject_id: 's6', term_id: 't3', ca1: 13, ca2: 13, exam: 52, total: 78, grade: 'A' },
  { id: 'ts23', student_id: 'st1', subject_id: 's7', term_id: 't3', ca1: 11, ca2: 10, exam: 40, total: 61, grade: 'B' },
  { id: 'ts24', student_id: 'st1', subject_id: 's8', term_id: 't3', ca1: 12, ca2: 12, exam: 46, total: 70, grade: 'A' },
];

export const dashboardStats = {
  totalStudents: 245,
  totalClasses: 6,
  totalArms: 14,
  totalSubjects: 24,
  activeSession: '2024/2025',
  currentTerm: '3rd Term',
  promotionRate: 87,
  averageScore: 64.5,
};
