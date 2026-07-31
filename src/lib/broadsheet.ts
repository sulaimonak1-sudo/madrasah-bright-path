import { calculateGrade } from '@/types';

export interface BroadsheetSubject {
  id: string;
  name_en: string;
  name_ar?: string | null;
}

export interface BroadsheetScoreCell {
  ca1: number | null;
  ca2: number | null;
  exam: number | null;
  total: number | null;
  grade: string | null;
  missing: boolean;
}

export interface BroadsheetRow {
  student_id: string;
  student_uid: string | null;
  name_en: string;
  name_ar?: string | null;
  gender?: string | null;
  cells: Record<string, BroadsheetScoreCell>;
  grandTotal: number;
  obtainable: number;
  average: number;
  grade: string;
  position: number;
  missingCount: number;
  status: 'PASS' | 'FAIL' | 'INCOMPLETE';
}

export const MAX_SUBJECT_SCORE = 100;

/** Mirrors the individual result sheet: average = round(sum(subject totals) / subject count) */
export function buildBroadsheet(
  students: any[],
  subjects: BroadsheetSubject[],
  scores: any[],
  passMark: number,
): BroadsheetRow[] {
  const byStudent = new Map<string, Map<string, any>>();
  for (const sc of scores) {
    if (!byStudent.has(sc.student_id)) byStudent.set(sc.student_id, new Map());
    byStudent.get(sc.student_id)!.set(sc.subject_id, sc);
  }

  const rows: BroadsheetRow[] = students.map(s => {
    const cells: Record<string, BroadsheetScoreCell> = {};
    let grandTotal = 0;
    let scored = 0;
    let missingCount = 0;

    for (const subj of subjects) {
      const sc = byStudent.get(s.id)?.get(subj.id);
      if (!sc) {
        cells[subj.id] = { ca1: null, ca2: null, exam: null, total: null, grade: null, missing: true };
        missingCount++;
        continue;
      }
      const total = Number(sc.total ?? (Number(sc.ca1 || 0) + Number(sc.ca2 || 0) + Number(sc.exam || 0)));
      cells[subj.id] = {
        ca1: Number(sc.ca1 ?? 0),
        ca2: Number(sc.ca2 ?? 0),
        exam: Number(sc.exam ?? 0),
        total,
        grade: sc.grade || calculateGrade(total),
        missing: false,
      };
      grandTotal += total;
      scored++;
    }

    const average = scored > 0 ? Math.round(grandTotal / scored) : 0;
    return {
      student_id: s.id,
      student_uid: s.student_uid ?? null,
      name_en: s.name_en || s.full_name,
      name_ar: s.name_ar,
      gender: s.gender,
      cells,
      grandTotal,
      obtainable: subjects.length * MAX_SUBJECT_SCORE,
      average,
      grade: calculateGrade(average),
      position: 0,
      missingCount,
      status: missingCount > 0 ? 'INCOMPLETE' : average >= passMark ? 'PASS' : 'FAIL',
    };
  });

  // Standard competition ranking (1, 2, 2, 4) on average
  const sorted = [...rows].sort((a, b) => b.average - a.average);
  let lastAvg: number | null = null;
  let lastPos = 0;
  sorted.forEach((r, idx) => {
    if (lastAvg !== null && r.average === lastAvg) {
      r.position = lastPos;
    } else {
      r.position = idx + 1;
      lastPos = r.position;
      lastAvg = r.average;
    }
  });

  return rows;
}

export function ordinal(n: number): string {
  if (!n) return '—';
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function sanitizeFilename(s: string): string {
  return s.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '').slice(0, 120);
}
