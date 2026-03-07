import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { UserCheck, Search, FileText } from 'lucide-react';

const steps = [
  { icon: UserCheck, title_en: 'Enter Your Student ID', title_ar: 'أدخل رقم الطالب', desc_en: 'Use the unique ID provided by your school to identify your record.', desc_ar: 'استخدم الرقم الفريد الذي قدمته لك المدرسة.' },
  { icon: Search, title_en: 'Select Term & Enter PIN', title_ar: 'اختر الفصل وأدخل الرقم السري', desc_en: 'Choose the academic term and enter your PIN for secure access.', desc_ar: 'اختر الفصل الدراسي وأدخل الرقم السري للوصول الآمن.' },
  { icon: FileText, title_en: 'View & Download Report', title_ar: 'عرض وتحميل التقرير', desc_en: 'Instantly view your full result sheet and download it as PDF.', desc_ar: 'اعرض كشف نتيجتك الكامل وقم بتحميله كملف PDF.' },
];

export const HowItWorks = () => {
  const { t } = useLanguage();

  return (
    <section className="container py-16">
      <div className="text-center mb-10">
        <h2 className="text-2xl font-bold text-foreground md:text-3xl">
          {t('How It Works', 'كيف يعمل')}
        </h2>
        <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
          {t('Three simple steps to access your academic results.', 'ثلاث خطوات بسيطة للوصول إلى نتائجك الأكاديمية.')}
        </p>
      </div>
      <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ delay: i * 0.15, duration: 0.5 }}
            className="flex flex-col items-center text-center"
          >
            <div className="relative mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                <step.icon className="h-7 w-7" />
              </div>
              <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-accent text-accent-foreground text-sm font-bold">
                {i + 1}
              </span>
            </div>
            <h3 className="font-bold text-foreground text-lg mb-2">{t(step.title_en, step.title_ar)}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{t(step.desc_en, step.desc_ar)}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
