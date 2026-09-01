import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const WHATSAPP_NUMBER = '+2348101466977';

const options = [
  { en: 'I need support', ar: 'أحتاج إلى الدعم' },
  { en: 'I need my student ID', ar: 'أحتاج إلى معرف الطالب الخاص بي' },
  { en: 'I want to check a result', ar: 'أريد التحقق من نتيجة' },
  { en: 'I want to apply for admission', ar: 'أريد التقديم للقبول' },
  { en: 'I have a complaint', ar: 'لدي شكوى' },
  { en: 'I need general information', ar: 'أحتاج إلى معلومات عامة' },
];

export const WhatsAppButton = () => {
  const { t, isRTL } = useLanguage();
  const [open, setOpen] = useState(false);

  const openWhatsApp = (message: string) => {
    const text = encodeURIComponent(message);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, '_blank', 'noopener,noreferrer');
    setOpen(false);
  };

  return (
    <div className="fixed bottom-5 z-40 flex flex-col items-end gap-3" style={{ [isRTL ? 'left' : 'right']: '1.25rem' }}>
      {open && (
        <div className="mb-2 w-[280px] overflow-hidden rounded-2xl border border-border bg-background shadow-card-lg">
          <div className="flex items-center justify-between bg-[#25D366] px-4 py-3 text-white">
            <span className="text-sm font-bold">{t('How can we help?', 'كيف يمكننا المساعدة؟')}</span>
            <button type="button" onClick={() => setOpen(false)} className="rounded-md p-1 hover:bg-white/20" aria-label={t('Close', 'إغلاق')}>
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-1 p-3">
            {options.map((opt) => (
              <button
                key={opt.en}
                type="button"
                onClick={() => openWhatsApp(t(opt.en, opt.ar))}
                className="rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                {t(opt.en, opt.ar)}
              </button>
            ))}
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="group flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-bold text-white shadow-lg transition-transform hover:-translate-y-0.5"
        aria-label={t('I need assistance?', 'أحتاج إلى مساعدة؟')}
      >
        <MessageCircle className="h-5 w-5 fill-current" />
        <span>{t('I need assistance?', 'أحتاج إلى مساعدة؟')}</span>
      </button>
    </div>
  );
};
