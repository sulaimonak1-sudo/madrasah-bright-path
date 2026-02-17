import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (en: string, ar?: string) => string;
  dir: 'ltr' | 'rtl';
  isRTL: boolean;
  bilingualText: (nameEn?: string, nameAr?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const dir = language === 'ar' ? 'rtl' : 'ltr';
  const isRTL = language === 'ar';

  useEffect(() => {
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', language);
  }, [dir, language]);

  const t = useCallback((en: string, ar?: string): string => {
    if (language === 'ar') return ar || en;
    return en;
  }, [language]);

  const bilingualText = useCallback((nameEn?: string, nameAr?: string): string => {
    if (language === 'ar') return nameAr || nameEn || '';
    return nameEn || nameAr || '';
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir, isRTL, bilingualText }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
};
