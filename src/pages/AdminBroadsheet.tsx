import { useEffect, useMemo, useRef, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCampus } from '@/contexts/CampusContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CampusSwitcher } from '@/components/CampusSwitcher';
import { AlertTriangle, Download, FileSpreadsheet, Loader2, Printer, Search, Table2 } from 'lucide-react';
import { buildBroadsheet, BroadsheetRow, BroadsheetSubject, ordinal, sanitizeFilename, MAX_SUBJECT_SCORE } from '@/lib/broadsheet';
import * as XLSX from 'xlsx';

const SCHOOL_NAME = 'AL-BARI GROUP OF SCHOOLS';

type SortKey = 'position' | 'name' | 'uid' | 'total' | 'average';

const AdminBroadsheet = () => {
  const { t, bilingualText } = useLanguage();
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();
  const { campusId, campus, campuses } = useCampus();

  const [sessions, setSessions] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [classLevels, setClassLevels] = useState<any[]>([]);
  const [arms, setArms] = useState<any[]>([]);
  const [teacherClassArmId, setTeacherClassArmId] = useState<string | null>(null);

  const [sessionId, setSessionId] = useState('');
  const [termId, setTermId] = useState('');
  const [levelId, setLevelId] = useState('');
  const [armId, setArmId] = useState('');
  const [detailed, setDetailed] = useState(false);

  const [passMark, setPassMark] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generated, setGenerated] = useState(false);
  const [rows, setRows] = useState<BroadsheetRow[]>([]);
  const [subjects, setSubjects] = useState<BroadsheetSubject[]>([]);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('position');
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const [s, cl, st, allArms] = await Promise.all([
        supabase.from('sessions').select('*').order('name', { ascending: false }),
        supabase.from('class_levels').select('*').eq('campus_id', campusId).order('display_order'),
        supabase.from('school_settings').select('*'),
        supabase.from('class_arms').select('id, class_level_id').eq('campus_id', campusId),
      ]);
      let assignedLevelId: string | null = null;
      let assignedArmId: string | null = null;
      if (!isAdmin && user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('class_teacher_class_level_id, class_teacher_class_arm_id')
          .eq('user_id', user.id)
          .maybeSingle();
        assignedLevelId = profile?.class_teacher_class_level_id || null;
        assignedArmId = profile?.class_teacher_class_arm_id || null;
      }
      if (!assignedLevelId && assignedArmId) {
        assignedLevelId = (allArms.data || []).find(arm => arm.id === assignedArmId)?.class_level_id || null;
      }
      setTeacherClassArmId(assignedArmId);
      setSessions(s.data || []);
      setClassLevels((cl.data || []).filter(level =>
        isAdmin || (!assignedLevelId || level.id === assignedLevelId)
      ));
      const pm = (st.data || []).find((r: any) => r.key === 'grading.pass_mark');
      if (pm && !isNaN(Number(pm.value))) setPassMark(Number(pm.value));
    })();
  }, [campusId, isAdmin, user]);

  useEffect(() => {
    if (!sessionId) { setTerms([]); setTermId(''); return; }
    supabase.from('terms').select('*').eq('session_id', sessionId).order('term_number')
      .then(({ data }) => setTerms(data || []));
    setTermId('');
  }, [sessionId]);

  // Campus-scoped arms
  useEffect(() => {
    if (!campusId || !levelId) { setArms([]); setArmId(''); return; }
    supabase.from('class_arms').select('*').eq('campus_id', campusId).eq('class_level_id', levelId).order('name')
      .then(({ data }) => setArms((data || []).filter(arm => isAdmin || !teacherClassArmId || arm.id === teacherClassArmId)));
    setArmId('');
  }, [campusId, isAdmin, levelId, teacherClassArmId]);

  useEffect(() => { setGenerated(false); }, [campusId, sessionId, termId, levelId, armId]);

  const selectedSession = sessions.find(s => s.id === sessionId);
  const selectedTerm = terms.find(x => x.id === termId);
  const selectedLevel = classLevels.find(c => c.id === levelId);
  const selectedArm = arms.find(a => a.id === armId);
  const canGenerate = !!(campusId && sessionId && termId && levelId);

  const className = `${selectedLevel?.name_en || ''}${selectedArm ? ` ${selectedArm.name}` : ''}`;

  const generate = async () => {
    if (!canGenerate) return;
    setLoading(true);
    setError('');
    try {
      // Campus filtering happens at the database level
      let sq = supabase
        .from('students')
        .select('id, full_name, name_en, name_ar, student_uid, gender, class_arm_id, campus_id')
        .eq('campus_id', campusId)
        .eq('class_level_id', levelId)
        .eq('status', 'active')
        .order('full_name');
      sq = armId ? sq.eq('class_arm_id', armId) : sq.is('class_arm_id', null);

      const [studRes, subjRes] = await Promise.all([
        sq,
        supabase.from('subjects').select('id, name_en:name, name_ar').eq('class_level_id', levelId).order('name'),
      ]);
      if (studRes.error) throw studRes.error;
      if (subjRes.error) throw subjRes.error;

      const students = studRes.data || [];
      const subjectList = (subjRes.data as any[]) || [];

      let scores: any[] = [];
      if (students.length && subjectList.length) {
        const { data, error: scErr } = await supabase
          .from('term_scores')
          .select('student_id, subject_id, ca1, ca2, exam, total, grade')
          .eq('term_id', termId)
          .in('student_id', students.map(s => s.id));
        if (scErr) throw scErr;
        scores = data || [];
      }

      setSubjects(subjectList);
      setRows(buildBroadsheet(students, subjectList, scores, passMark));
      setGenerated(true);
    } catch (e: any) {
      setError(t('Unable to generate the broadsheet. Please check your selection and try again.', 'تعذر إنشاء كشف الدرجات.'));
      toast({ title: t('Error', 'خطأ'), description: e?.message || '', variant: 'destructive' });
      setGenerated(false);
    } finally {
      setLoading(false);
    }
  };

  const visibleRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = q
      ? rows.filter(r => r.name_en?.toLowerCase().includes(q) || (r.student_uid || '').toLowerCase().includes(q))
      : [...rows];
    list.sort((a, b) => {
      switch (sortKey) {
        case 'name': return (a.name_en || '').localeCompare(b.name_en || '');
        case 'uid': return (a.student_uid || '').localeCompare(b.student_uid || '');
        case 'total': return b.grandTotal - a.grandTotal;
        case 'average': return b.average - a.average;
        default: return a.position - b.position;
      }
    });
    return list;
  }, [rows, search, sortKey]);

  const summary = useMemo(() => {
    if (!rows.length) return null;
    const avgs = rows.map(r => r.average);
    const subjectStats = subjects.map(s => {
      const vals = rows.map(r => r.cells[s.id]?.total).filter((v): v is number => typeof v === 'number');
      return {
        id: s.id,
        name: s.name_en,
        average: vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0,
        highest: vals.length ? Math.max(...vals) : 0,
        lowest: vals.length ? Math.min(...vals) : 0,
        passed: vals.filter(v => v >= passMark).length,
        failed: vals.filter(v => v < passMark).length,
      };
    });
    return {
      count: rows.length,
      male: rows.filter(r => r.gender === 'male').length,
      female: rows.filter(r => r.gender === 'female').length,
      classAverage: Math.round(avgs.reduce((a, b) => a + b, 0) / rows.length),
      highest: Math.max(...avgs),
      lowest: Math.min(...avgs),
      passed: rows.filter(r => r.average >= passMark).length,
      failed: rows.filter(r => r.average < passMark).length,
      incomplete: rows.filter(r => r.missingCount > 0).length,
      subjectStats,
    };
  }, [rows, subjects, passMark]);

  const fileBase = sanitizeFilename(
    `Broadsheet_${campus?.name || 'Campus'}_${className || 'Class'}_${selectedTerm?.name_en || ''}_${selectedSession?.name || ''}`
  );

  /* ───────── Print / PDF ───────── */
  const buildPrintHtml = () => {
    const wide = subjects.length > 8 || detailed;
    const subjHeader = detailed
      ? subjects.map(s => `<th colspan="3">${s.name_en}</th>`).join('')
      : subjects.map(s => `<th>${s.name_en}</th>`).join('');
    const subHeader = detailed
      ? `<tr>${subjects.map(() => '<th>CA</th><th>EX</th><th>T</th>').join('')}<th></th><th></th><th></th><th></th><th></th></tr>`
      : '';

    const ordered = [...rows].sort((a, b) => a.position - b.position);

    const body = ordered.map((r, i) => {
      const cells = subjects.map(s => {
        const c = r.cells[s.id];
        if (!c || c.missing) return detailed ? '<td>—</td><td>—</td><td>—</td>' : '<td>—</td>';
        return detailed
          ? `<td>${(c.ca1 || 0) + (c.ca2 || 0)}</td><td>${c.exam}</td><td><b>${c.total}</b></td>`
          : `<td>${c.total}</td>`;
      }).join('');
      return `<tr>
        <td>${i + 1}</td>
        <td>${r.student_uid || '—'}</td>
        <td class="nm">${r.name_en}</td>
        ${cells}
        <td><b>${r.grandTotal}</b></td>
        <td>${r.obtainable}</td>
        <td><b>${r.average}%</b></td>
        <td>${r.grade}</td>
        <td>${ordinal(r.position)}</td>
        <td>${r.status}</td>
      </tr>`;
    }).join('');

    return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>${fileBase}</title>
<style>
  @page { size: ${wide ? 'A3' : 'A4'} landscape; margin: 8mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #000; font-size: ${wide ? '8.5px' : '10px'}; margin: 0; }
  .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 8px; }
  .logo { width: 46px; height: 46px; margin: 0 auto 4px; }
  .logo img { width: 100%; height: 100%; object-fit: contain; }
  .school { font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
  .campus { font-size: 12px; font-weight: 700; margin-top: 2px; }
  .title { font-size: 13px; font-weight: 700; text-transform: uppercase; margin-top: 4px; }
  .meta { font-size: 10px; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #000; padding: 2px 3px; text-align: center; }
  thead { display: table-header-group; }
  tr { page-break-inside: avoid; }
  th { background: #e5e7eb; font-weight: 700; }
  td.nm { text-align: left; white-space: nowrap; font-weight: 600; }
  .summary { margin-top: 10px; font-size: 9.5px; page-break-inside: avoid; }
  .summary table { width: auto; }
  .sigs { margin-top: 24px; display: flex; justify-content: space-between; font-size: 10px; }
  .sig { width: 40%; border-top: 1px solid #000; text-align: center; padding-top: 3px; }
</style></head><body>
<div class="header">
  <div class="logo"><img src="${window.location.origin}/images/school-logo.png" onerror="this.style.display='none'"/></div>
  <div class="school">${SCHOOL_NAME}</div>
  <div class="campus">${campus?.name || ''}</div>
  <div class="title">Class Broadsheet</div>
  <div class="meta">Session: ${selectedSession?.name || ''} &nbsp;|&nbsp; Term: ${selectedTerm?.name_en || ''} &nbsp;|&nbsp; Class: ${className} &nbsp;|&nbsp; Generated: ${new Date().toLocaleDateString()}</div>
</div>
<table>
  <thead>
    <tr>
      <th ${detailed ? 'rowspan="2"' : ''}>S/N</th>
      <th ${detailed ? 'rowspan="2"' : ''}>Adm. No</th>
      <th ${detailed ? 'rowspan="2"' : ''}>Student Name</th>
      ${subjHeader}
      <th ${detailed ? 'rowspan="2"' : ''}>Total</th>
      <th ${detailed ? 'rowspan="2"' : ''}>Obt.</th>
      <th ${detailed ? 'rowspan="2"' : ''}>Avg</th>
      <th ${detailed ? 'rowspan="2"' : ''}>Grade</th>
      <th ${detailed ? 'rowspan="2"' : ''}>Pos</th>
      <th ${detailed ? 'rowspan="2"' : ''}>Status</th>
    </tr>
    ${detailed ? `<tr>${subjects.map(() => '<th>CA</th><th>EX</th><th>T</th>').join('')}</tr>` : ''}
  </thead>
  <tbody>${body}</tbody>
</table>
${summary ? `<div class="summary">
  <b>Summary:</b> Students: ${summary.count} &nbsp;|&nbsp; Male: ${summary.male} &nbsp;|&nbsp; Female: ${summary.female}
  &nbsp;|&nbsp; Class Average: ${summary.classAverage}% &nbsp;|&nbsp; Highest: ${summary.highest}% &nbsp;|&nbsp; Lowest: ${summary.lowest}%
  &nbsp;|&nbsp; Passed: ${summary.passed} &nbsp;|&nbsp; Failed: ${summary.failed} &nbsp;|&nbsp; Incomplete: ${summary.incomplete}
</div>` : ''}
<div class="sigs"><div class="sig">Class Teacher</div><div class="sig">Head Teacher / Administrator</div></div>
</body></html>`;
  };

  const openPrintWindow = (autoPrint: boolean) => {
    const w = window.open('', '_blank', 'width=1200,height=800');
    if (!w) {
      toast({ title: t('Please allow pop-ups to print', 'يرجى السماح بالنوافذ المنبثقة'), variant: 'destructive' });
      return;
    }
    w.document.write(buildPrintHtml());
    w.document.close();
    if (autoPrint) setTimeout(() => { w.focus(); w.print(); }, 500);
  };

  const exportExcel = () => {
    const header: any[] = ['S/N', 'Adm. No', 'Student Name'];
    subjects.forEach(s => {
      if (detailed) header.push(`${s.name_en} CA`, `${s.name_en} Exam`, `${s.name_en} Total`);
      else header.push(s.name_en);
    });
    header.push('Grand Total', 'Obtainable', 'Average %', 'Grade', 'Position', 'Status');

    const ordered = [...rows].sort((a, b) => a.position - b.position);
    const data: any[][] = [
      [SCHOOL_NAME],
      [`Campus: ${campus?.name || ''}`],
      [`Session: ${selectedSession?.name || ''}`, `Term: ${selectedTerm?.name_en || ''}`, `Class: ${className}`],
      [`Generated: ${new Date().toLocaleString()}`],
      [],
      header,
    ];

    ordered.forEach((r, i) => {
      const row: any[] = [i + 1, r.student_uid || '', r.name_en];
      subjects.forEach(s => {
        const c = r.cells[s.id];
        if (detailed) {
          row.push(
            c && !c.missing ? (c.ca1 || 0) + (c.ca2 || 0) : '',
            c && !c.missing ? c.exam : '',
            c && !c.missing ? c.total : '',
          );
        } else {
          row.push(c && !c.missing ? c.total : '');
        }
      });
      row.push(r.grandTotal, r.obtainable, r.average, r.grade, r.position, r.status);
      data.push(row);
    });

    if (summary) {
      data.push([], ['SUMMARY']);
      data.push(['Students', summary.count], ['Male', summary.male], ['Female', summary.female]);
      data.push(['Class Average (%)', summary.classAverage], ['Highest Average (%)', summary.highest], ['Lowest Average (%)', summary.lowest]);
      data.push(['Passed', summary.passed], ['Failed', summary.failed], ['Incomplete', summary.incomplete]);
      data.push([], ['SUBJECT STATISTICS'], ['Subject', 'Average', 'Highest', 'Lowest', 'Passed', 'Failed']);
      summary.subjectStats.forEach(s => data.push([s.name, s.average, s.highest, s.lowest, s.passed, s.failed]));
    }

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [{ wch: 6 }, { wch: 14 }, { wch: 28 }, ...header.slice(3).map(() => ({ wch: 12 }))];
    ws['!freeze'] = { xSplit: 3, ySplit: 6 } as any;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Broadsheet');
    XLSX.writeFile(wb, `${fileBase}.xlsx`);
  };

  const exportPdf = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const wide = subjects.length > 8 || detailed;
      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: wide ? 'a3' : 'a4' });
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-10000px';
      container.style.top = '0';
      container.style.width = wide ? '1580px' : '1120px';
      container.style.background = '#fff';
      container.innerHTML = buildPrintHtml()
        .replace(/^[\s\S]*?<body>/, '')
        .replace(/<\/body>[\s\S]*$/, '');
      const style = document.createElement('style');
      style.textContent = `
        .bs-pdf table { width:100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size:${wide ? '9px' : '10px'}; }
        .bs-pdf th, .bs-pdf td { border:1px solid #000; padding:2px 3px; text-align:center; color:#000; }
        .bs-pdf th { background:#e5e7eb; }
        .bs-pdf td.nm { text-align:left; white-space:nowrap; font-weight:600; }
        .bs-pdf .header { text-align:center; border-bottom:2px solid #000; padding-bottom:6px; margin-bottom:8px; font-family: Arial, sans-serif; color:#000; }
        .bs-pdf .school { font-size:20px; font-weight:800; }
        .bs-pdf .campus { font-size:13px; font-weight:700; }
        .bs-pdf .title { font-size:14px; font-weight:700; }
        .bs-pdf .meta, .bs-pdf .summary, .bs-pdf .sigs { font-size:11px; color:#000; font-family: Arial, sans-serif; }
        .bs-pdf .sigs { margin-top:28px; display:flex; justify-content:space-between; }
        .bs-pdf .sig { width:40%; border-top:1px solid #000; text-align:center; padding-top:4px; }
        .bs-pdf .logo { width:46px; height:46px; margin:0 auto 4px; }
        .bs-pdf .logo img { width:100%; height:100%; object-fit:contain; }
      `;
      container.className = 'bs-pdf';
      container.prepend(style);
      document.body.appendChild(container);

      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(container, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
      document.body.removeChild(container);

      const pw = doc.internal.pageSize.getWidth();
      const ph = doc.internal.pageSize.getHeight();
      const margin = 20;
      const imgW = pw - margin * 2;
      const imgH = (canvas.height * imgW) / canvas.width;
      const img = canvas.toDataURL('image/jpeg', 0.92);

      if (imgH <= ph - margin * 2) {
        doc.addImage(img, 'JPEG', margin, margin, imgW, imgH);
        doc.setFontSize(8);
        doc.text('Page 1 of 1', pw - margin - 40, ph - 10);
      } else {
        const pageContentH = ph - margin * 2;
        const pages = Math.ceil(imgH / pageContentH);
        for (let i = 0; i < pages; i++) {
          if (i > 0) doc.addPage();
          doc.addImage(img, 'JPEG', margin, margin - i * pageContentH, imgW, imgH);
          doc.setFillColor(255, 255, 255);
          doc.rect(0, 0, pw, margin, 'F');
          doc.rect(0, ph - margin, pw, margin, 'F');
          doc.setFontSize(8);
          doc.setTextColor(0, 0, 0);
          doc.text(`Page ${i + 1} of ${pages}`, pw - margin - 50, ph - 8);
        }
      }
      doc.save(`${fileBase}.pdf`);
    } catch (e: any) {
      toast({ title: t('Could not create PDF', 'تعذر إنشاء ملف PDF'), variant: 'destructive' });
    }
  };

  const incompleteCount = rows.filter(r => r.missingCount > 0).length;

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">{t('Class Broadsheet', 'كشف درجات الفصل')}</h1>
          <p className="text-muted-foreground">{t('Generate, print and export a full class result broadsheet', 'إنشاء وطباعة وتصدير كشف درجات الفصل')}</p>
        </div>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><Table2 className="h-4 w-4 text-accent" />{t('Filters', 'عوامل التصفية')}</CardTitle>
            <CardDescription>{t('Campus → Session → Term → Class → Arm', 'الفرع ← السنة ← الفصل ← الصف ← الشعبة')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className="space-y-1.5">
                <Label>{t('Campus', 'الفرع')}</Label>
                <CampusSwitcher className="w-full" />
              </div>
              <div className="space-y-1.5">
                <Label>{t('Session', 'السنة')}</Label>
                <Select value={sessionId} onValueChange={setSessionId}>
                  <SelectTrigger><SelectValue placeholder={t('Select', 'اختر')} /></SelectTrigger>
                  <SelectContent>{sessions.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t('Term', 'الفصل')}</Label>
                <Select value={termId} onValueChange={setTermId} disabled={!sessionId}>
                  <SelectTrigger><SelectValue placeholder={t('Select', 'اختر')} /></SelectTrigger>
                  <SelectContent>{terms.map(x => <SelectItem key={x.id} value={x.id}>{bilingualText(x.name_en, x.name_ar)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t('Class Level', 'المرحلة')}</Label>
                <Select value={levelId} onValueChange={setLevelId}>
                  <SelectTrigger><SelectValue placeholder={t('Select', 'اختر')} /></SelectTrigger>
                  <SelectContent>{classLevels.map(c => <SelectItem key={c.id} value={c.id}>{bilingualText(c.name_en, c.name_ar)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t('Class Arm', 'الشعبة')}</Label>
                <Select value={armId} onValueChange={setArmId} disabled={!levelId || arms.length === 0}>
                  <SelectTrigger><SelectValue placeholder={arms.length ? t('Select', 'اختر') : t('No arms', 'لا توجد شعب')} /></SelectTrigger>
                  <SelectContent>
                    {arms.map(a => <SelectItem key={a.id} value={a.id}>{campus?.name ? `${campus.name} — ` : ''}{a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={detailed} onCheckedChange={setDetailed} id="detailed" />
                <Label htmlFor="detailed" className="cursor-pointer">{t('Detailed mode (CA / Exam / Total)', 'الوضع التفصيلي')}</Label>
              </div>
              <Button onClick={generate} disabled={!canGenerate || loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Table2 className="mr-2 h-4 w-4" />}
                {t('Generate Broadsheet', 'إنشاء الكشف')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card className="border-destructive"><CardContent className="p-4 text-sm text-destructive">{error}</CardContent></Card>
        )}

        {generated && rows.length === 0 && !loading && (
          <Card><CardContent className="p-8 text-center text-muted-foreground">
            {t('No students found for this campus and class.', 'لا يوجد طلاب لهذا الفرع والصف.')}
          </CardContent></Card>
        )}

        {generated && rows.length > 0 && (
          <Card className="shadow-card">
            <CardHeader className="gap-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base">{campus?.name} — {className}</CardTitle>
                  <CardDescription>
                    {selectedSession?.name} · {selectedTerm?.name_en} · {rows.length} {t('students', 'طالب')}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => openPrintWindow(true)}><Printer className="mr-2 h-4 w-4" />{t('Print', 'طباعة')}</Button>
                  <Button variant="outline" size="sm" onClick={exportPdf}><Download className="mr-2 h-4 w-4" />{t('PDF', 'PDF')}</Button>
                  <Button variant="outline" size="sm" onClick={exportExcel}><FileSpreadsheet className="mr-2 h-4 w-4" />{t('Excel', 'إكسل')}</Button>
                </div>
              </div>

              {incompleteCount > 0 && (
                <div className="flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  {t(`${incompleteCount} student(s) have incomplete scores (shown as —).`, `${incompleteCount} طالب لديهم درجات ناقصة (تظهر كـ —).`)}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input className="pl-9" placeholder={t('Search name or admission number', 'ابحث بالاسم أو الرقم')} value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <Select value={sortKey} onValueChange={v => setSortKey(v as SortKey)}>
                  <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="position">{t('Sort: Position', 'الترتيب: المركز')}</SelectItem>
                    <SelectItem value="name">{t('Sort: Name', 'الترتيب: الاسم')}</SelectItem>
                    <SelectItem value="uid">{t('Sort: Adm. No', 'الترتيب: الرقم')}</SelectItem>
                    <SelectItem value="total">{t('Sort: Total', 'الترتيب: المجموع')}</SelectItem>
                    <SelectItem value="average">{t('Sort: Average', 'الترتيب: المعدل')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto" ref={printRef}>
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-muted">
                      <th className="sticky left-0 z-20 bg-muted border p-1.5 w-10">#</th>
                      <th className="sticky left-10 z-20 bg-muted border p-1.5 whitespace-nowrap">{t('Adm. No', 'الرقم')}</th>
                      <th className="sticky left-[7.5rem] z-20 bg-muted border p-1.5 text-left whitespace-nowrap">{t('Student Name', 'اسم الطالب')}</th>
                      {subjects.map(s => (
                        <th key={s.id} colSpan={detailed ? 3 : 1} className="border p-1.5 whitespace-nowrap">{s.name_en}</th>
                      ))}
                      <th className="border p-1.5">{t('Total', 'المجموع')}</th>
                      <th className="border p-1.5">{t('Obt.', 'الكلي')}</th>
                      <th className="border p-1.5">{t('Avg', 'المعدل')}</th>
                      <th className="border p-1.5">{t('Grade', 'التقدير')}</th>
                      <th className="border p-1.5">{t('Pos', 'المركز')}</th>
                      <th className="border p-1.5">{t('Status', 'الحالة')}</th>
                    </tr>
                    {detailed && (
                      <tr className="bg-muted/70">
                        <th className="sticky left-0 z-20 bg-muted/70 border p-1" />
                        <th className="sticky left-10 z-20 bg-muted/70 border p-1" />
                        <th className="sticky left-[7.5rem] z-20 bg-muted/70 border p-1" />
                        {subjects.map(s => (
                          <>
                            <th key={`${s.id}-ca`} className="border p-1">CA</th>
                            <th key={`${s.id}-ex`} className="border p-1">EX</th>
                            <th key={`${s.id}-t`} className="border p-1">T</th>
                          </>
                        ))}
                        <th className="border p-1" /><th className="border p-1" /><th className="border p-1" />
                        <th className="border p-1" /><th className="border p-1" /><th className="border p-1" />
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {visibleRows.map((r, i) => (
                      <tr key={r.student_id} className="odd:bg-background even:bg-muted/30">
                        <td className="sticky left-0 z-10 bg-inherit border p-1.5 text-center">{i + 1}</td>
                        <td className="sticky left-10 z-10 bg-inherit border p-1.5 text-center font-mono whitespace-nowrap">{r.student_uid || '—'}</td>
                        <td className="sticky left-[7.5rem] z-10 bg-inherit border p-1.5 font-medium whitespace-nowrap">{r.name_en}</td>
                        {subjects.map(s => {
                          const c = r.cells[s.id];
                          if (!c || c.missing) {
                            return detailed
                              ? <><td key={`${s.id}a`} className="border p-1.5 text-center text-amber-600">—</td><td key={`${s.id}b`} className="border p-1.5 text-center text-amber-600">—</td><td key={`${s.id}c`} className="border p-1.5 text-center text-amber-600">—</td></>
                              : <td key={s.id} className="border p-1.5 text-center text-amber-600 font-semibold">—</td>;
                          }
                          return detailed
                            ? <><td key={`${s.id}a`} className="border p-1.5 text-center">{(c.ca1 || 0) + (c.ca2 || 0)}</td><td key={`${s.id}b`} className="border p-1.5 text-center">{c.exam}</td><td key={`${s.id}c`} className="border p-1.5 text-center font-semibold">{c.total}</td></>
                            : <td key={s.id} className="border p-1.5 text-center">{c.total}</td>;
                        })}
                        <td className="border p-1.5 text-center font-semibold">{r.grandTotal}</td>
                        <td className="border p-1.5 text-center text-muted-foreground">{r.obtainable}</td>
                        <td className="border p-1.5 text-center font-semibold">{r.average}%</td>
                        <td className="border p-1.5 text-center">{r.grade}</td>
                        <td className="border p-1.5 text-center">{ordinal(r.position)}</td>
                        <td className="border p-1.5 text-center">
                          <Badge variant={r.status === 'PASS' ? 'default' : r.status === 'FAIL' ? 'destructive' : 'secondary'} className="text-[10px]">
                            {r.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {generated && summary && (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="shadow-card">
              <CardHeader className="pb-2"><CardTitle className="text-base">{t('Class Summary', 'ملخص الفصل')}</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-3 gap-3 text-sm">
                {[
                  [t('Students', 'الطلاب'), summary.count],
                  [t('Male', 'ذكور'), summary.male],
                  [t('Female', 'إناث'), summary.female],
                  [t('Class Average', 'معدل الفصل'), `${summary.classAverage}%`],
                  [t('Highest', 'الأعلى'), `${summary.highest}%`],
                  [t('Lowest', 'الأدنى'), `${summary.lowest}%`],
                  [t('Passed', 'ناجح'), summary.passed],
                  [t('Failed', 'راسب'), summary.failed],
                  [t('Incomplete', 'ناقص'), summary.incomplete],
                ].map(([label, value], i) => (
                  <div key={i} className="rounded-md bg-muted/50 p-2 text-center">
                    <div className="text-lg font-bold">{value as any}</div>
                    <div className="text-xs text-muted-foreground">{label as any}</div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader className="pb-2"><CardTitle className="text-base">{t('Subject Statistics', 'إحصائيات المواد')}</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-2 text-left">{t('Subject', 'المادة')}</th>
                        <th className="p-2">{t('Avg', 'المعدل')}</th>
                        <th className="p-2">{t('High', 'الأعلى')}</th>
                        <th className="p-2">{t('Low', 'الأدنى')}</th>
                        <th className="p-2">{t('Pass', 'ناجح')}</th>
                        <th className="p-2">{t('Fail', 'راسب')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.subjectStats.map(s => (
                        <tr key={s.id} className="border-t">
                          <td className="p-2 font-medium">{s.name}</td>
                          <td className="p-2 text-center">{s.average}</td>
                          <td className="p-2 text-center">{s.highest}</td>
                          <td className="p-2 text-center">{s.lowest}</td>
                          <td className="p-2 text-center">{s.passed}</td>
                          <td className="p-2 text-center">{s.failed}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminBroadsheet;
