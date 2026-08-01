import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useWebsiteSettings = <T extends Record<string, string>>(defaults: T) => {
  const [settings, setSettings] = useState<T>(defaults);

  useEffect(() => {
    supabase.from('school_settings').select('key,value').like('key', 'website.%').then(({ data }) => {
      const saved = Object.fromEntries((data || []).map(row => [row.key, row.value]));
      setSettings(current => ({ ...current, ...saved }));
    });
  }, []);

  return settings;
};