import { ArrowRight, ClipboardList, FileText, GraduationCap, MessageSquareText, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PublicLayout, ADMISSIONS_URL } from '@/components/PublicLayout';
import { PublicPageHeader } from '@/components/PublicPageHeader';
import { Button } from '@/components/ui/button';

const Admissions = () => {
  const { t } = useLanguage();

  const steps = [
    { icon: FileText, title: t('Submit an application', 'قدم طلب الالتحاق'), text: t('Complete the online application form with your child’s details and previous school records.', 'أكمل نموذج الطلب عبر الإنترنت مع بيانات طفلك وسجلات مدرسته السابقة.') },
    { icon: ClipboardList, title: t('Entrance assessment', 'اختبار القبول'), text: t('Applicants take a short age-appropriate assessment in Qur’an, Arabic, and core academics.', 'يخضع المتقدمون لتقييم قصير مناسب لأعمارهم في القرآن واللغة العربية والمواد الأساسية.') },
    { icon: MessageSquareText, title: t('Family interview', 'مقابلة عائلية'), text: t('We meet the family to understand goals, answer questions, and confirm placement.', 'نلتقي بالعائلة لفهم الأهداف والإجابة على الأسئلة وتأكيد القبول.') },
    { icon: GraduationCap, title: t('Enrollment', 'التسجيل'), text: t('Successful applicants receive an admission offer and complete enrollment at their campus.', 'يتلقى المقبولون عرض القبول ويكملون التسجيل في حرمهم الجامعي.') },
  ];

  const requirements = [
    t('Completed online application form', 'نموذج طلب مكتمل عبر الإنترنت'),
    t('Birth certificate or age declaration', 'شهادة الميلاد أو إقرار العمر'),
    t('Previous school report or transfer records', 'تقرير المدرسة السابقة أو سجلات النقل'),
    t('Two recent passport photographs', 'صورتان شخصيتان حديثتان'),
    t('Immunization record (nursery & primary)', 'سجل التطعيم (للحضانة والابتدائي)'),
  ];

  return (
    <PublicLayout>
      <PublicPageHeader eyebrow={t('Admissions', 'القبول')} title={t('Join the Al-Bari learning community.', 'انضم إلى مجتمع البارئ التعليمي.')}>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
          {t('We welcome families seeking a balanced Islamic education rooted in knowledge, character, and discipline. Applications are open for both the Main and Annex campuses.', 'نرحب بالعائلات الباحثة عن تعليم إسلامي متوازن قائم على العلم والأخلاق والانضباط. التقديم مفتوح لكل من الحرم الرئيسي والفرعي.')}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href={ADMISSIONS_URL} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center gap-2 bg-accent px-6 text-sm font-bold text-accent-foreground transition-colors hover:bg-accent/85">
            {t('Apply now', 'قدم الآن')} <ArrowRight className="h-4 w-4" />
          </a>
          <a href="#process" className="inline-flex h-12 items-center gap-2 border border-border px-6 text-sm font-bold text-foreground transition-colors hover:bg-muted">
            {t('See how it works', 'تعرف على الخطوات')}
          </a>
        </div>
      </PublicPageHeader>

      <main className="container py-20">
        <section id="process">
          <div className="max-w-xl">
            <p className="eyebrow text-primary">{t('Admission process', 'عملية القبول')}</p>
            <h2 className="mt-3 font-display text-4xl font-extrabold leading-tight">{t('Four simple steps to enrollment.', 'أربع خطوات بسيطة للتسجيل.')}</h2>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(({ icon: Icon, title, text }, index) => (
              <article key={title} className="border border-border bg-card p-6">
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
                  <span className="font-display text-2xl font-extrabold text-accent">0{index + 1}</span>
                </div>
                <h3 className="mt-6 font-display text-lg font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-20 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <p className="eyebrow text-primary">{t('Requirements', 'المتطلبات')}</p>
            <h2 className="mt-3 font-display text-4xl font-extrabold leading-tight">{t('What you’ll need to apply.', 'ما تحتاجه للتقديم.')}</h2>
            <ul className="mt-8 grid gap-3">
              {requirements.map((item) => (
                <li key={item} className="flex items-start gap-3 border border-border bg-card p-4 text-sm font-semibold">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="border border-primary/15 bg-[hsl(var(--accent-soft))] p-8 lg:sticky lg:top-24">
            <GraduationCap className="h-8 w-8 text-primary" />
            <h3 className="mt-6 font-display text-2xl font-extrabold">{t('Ready to apply?', 'هل أنت مستعد للتقديم؟')}</h3>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              {t('Start your application on our admissions portal. It takes only a few minutes, and our team will reach out to guide you through the rest.', 'ابدأ طلبك عبر بوابة القبول لدينا. يستغرق الأمر دقائق معدودة، وسيتواصل معك فريقنا لإرشادك خلال باقي الخطوات.')}
            </p>
            <a href={ADMISSIONS_URL} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 bg-primary text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90">
              {t('Go to the application portal', 'الانتقال إلى بوابة التقديم')} <ArrowRight className="h-4 w-4" />
            </a>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              {t('You’ll be redirected to albari.com.ng to complete the form.', 'سيتم تحويلك إلى albari.com.ng لإكمال النموذج.')}
            </p>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
};

export default Admissions;
