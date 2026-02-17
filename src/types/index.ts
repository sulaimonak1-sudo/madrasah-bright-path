export interface Student {
  id: string;
  student_id: string;
  name_en: string;
  name_ar?: string;
  class_level_id: string;
  class_arm_id: string;
  gender: 'male' | 'female';
  date_of_birth?: string;
  guardian_name?: string;
  guardian_phone?: string;
  status: 'active' | 'graduated' | 'withdrawn';
  created_at: string;
}

export interface ClassLevel {
  id: string;
  name_en: string;
  name_ar?: string;
  order: number;
}

export interface ClassArm {
  id: string;
  class_level_id: string;
  name: string; // A, B, C, etc.
}

export interface Subject {
  id: string;
  name_en: string;
  name_ar?: string;
  class_level_id: string;
}

export interface Session {
  id: string;
  name: string; // e.g., "2024/2025"
  is_active: boolean;
}

export interface Term {
  id: string;
  session_id: string;
  name_en: string;
  name_ar?: string;
  term_number: 1 | 2 | 3;
  is_locked: boolean;
}

export interface TermScore {
  id: string;
  student_id: string;
  subject_id: string;
  term_id: string;
  ca1: number;
  ca2: number;
  exam: number;
  total: number; // auto: ca1 + ca2 + exam
  grade: string; // auto-calculated
}

export interface PromotionRecord {
  id: string;
  student_id: string;
  session_id: string;
  from_class_level_id: string;
  to_class_level_id?: string;
  from_arm_id: string;
  to_arm_id?: string;
  status: 'PROMOTED' | 'RETAINED' | 'INCOMPLETE';
  cumulative_average: number;
  promoted_at: string;
  promoted_by: string;
}

export interface Pin {
  id: string;
  student_id: string;
  term_id: string;
  pin: string;
  is_active: boolean;
}

export type UserRole = 'super_admin' | 'admin' | 'teacher';

export interface GradeConfig {
  min: number;
  max: number;
  grade: string;
  remark_en: string;
  remark_ar: string;
}

export const GRADE_CONFIG: GradeConfig[] = [
  { min: 70, max: 100, grade: 'A', remark_en: 'Excellent', remark_ar: 'ممتاز' },
  { min: 60, max: 69, grade: 'B', remark_en: 'Very Good', remark_ar: 'جيد جداً' },
  { min: 50, max: 59, grade: 'C', remark_en: 'Good', remark_ar: 'جيد' },
  { min: 45, max: 49, grade: 'D', remark_en: 'Fair', remark_ar: 'مقبول' },
  { min: 40, max: 44, grade: 'E', remark_en: 'Poor', remark_ar: 'ضعيف' },
  { min: 0, max: 39, grade: 'F', remark_en: 'Fail', remark_ar: 'راسب' },
];

export function calculateGrade(score: number): string {
  const config = GRADE_CONFIG.find(g => score >= g.min && score <= g.max);
  return config?.grade || 'F';
}
