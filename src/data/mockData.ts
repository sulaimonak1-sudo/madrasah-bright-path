import { Student, ClassLevel, ClassArm, Subject, Session, Term, TermScore } from '@/types';

export const mockClassLevels: ClassLevel[] = [
  { id: 'cl1', name_en: 'Raodoh', name_ar: 'روضة', order: 1 },
];

export const mockClassArms: ClassArm[] = [
  { id: 'ca1', class_level_id: 'cl1', name: 'A' },
];

export const mockSubjects: Subject[] = [
  { id: 's1', name_en: 'Quran Memorization', name_ar: 'حفظ القرآن', class_level_id: 'cl1' },
  { id: 's2', name_en: 'Arabic Language', name_ar: 'اللغة العربية', class_level_id: 'cl1' },
];

export const mockSessions: Session[] = [
  { id: 'ss3', name: '2025/2026', is_active: true },
];

export const mockTerms: Term[] = [
  { id: 't1', session_id: 'ss3', name_en: '1st Term', name_ar: 'الفصل الأول', term_number: 1, is_locked: false },
];

export const mockStudents: Student[] = [
  { id: 'st1', student_id: 'ABS-001', name_en: 'Ahmad Ibrahim', name_ar: 'أحمد إبراهيم', class_level_id: 'cl1', class_arm_id: 'ca1', gender: 'male', guardian_name: 'Ibrahim Musa', guardian_phone: '08012345678', status: 'active', created_at: '2025-01-15' },
  { id: 'st2', student_id: 'ABS-002', name_en: 'Fatima Abdullahi', name_ar: 'فاطمة عبد الله', class_level_id: 'cl1', class_arm_id: 'ca1', gender: 'female', guardian_name: 'Abdullahi Yusuf', guardian_phone: '08098765432', status: 'active', created_at: '2025-01-15' },
];

export const mockTermScores: TermScore[] = [
  // Student 1, 1st Term
  { id: 'ts1', student_id: 'st1', subject_id: 's1', term_id: 't1', ca1: 12, ca2: 13, exam: 55, total: 80, grade: 'A' },
  { id: 'ts2', student_id: 'st1', subject_id: 's2', term_id: 't1', ca1: 10, ca2: 11, exam: 45, total: 66, grade: 'B' },
  { id: 'ts3', student_id: 'st2', subject_id: 's1', term_id: 't1', ca1: 14, ca2: 12, exam: 50, total: 76, grade: 'A' },
  { id: 'ts4', student_id: 'st2', subject_id: 's2', term_id: 't1', ca1: 8, ca2: 10, exam: 40, total: 58, grade: 'C' },
];

export const dashboardStats = {
  totalStudents: 2,
  totalClasses: 1,
  totalArms: 1,
  totalSubjects: 2,
  activeSession: '2025/2026',
  currentTerm: '1st Term',
  promotionRate: 100,
  averageScore: 73,
};
