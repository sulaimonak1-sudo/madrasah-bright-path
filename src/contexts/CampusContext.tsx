import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Campus {
  id: string;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
}

interface CampusContextType {
  campuses: Campus[];
  activeCampuses: Campus[];
  campusId: string;
  setCampusId: (id: string) => void;
  campus: Campus | null;
  /** Campus the signed-in user is locked to (null = all campuses / super admin) */
  assignedCampusId: string | null;
  isSuperAdmin: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
  campusName: (id?: string | null) => string;
}

const CampusContext = createContext<CampusContextType | undefined>(undefined);

const STORAGE_KEY = 'albari.campus';

export const CampusProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [assignedCampusId, setAssignedCampusId] = useState<string | null>(null);
  const [campusId, setCampusIdState] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('campuses')
        .select('id, name, code, address, phone, email, is_active')
        .order('code');
      const list = (data as Campus[]) || [];
      setCampuses(list);

      let assigned: string | null = null;
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('campus_id')
          .eq('user_id', user.id)
          .maybeSingle();
        assigned = (profile as any)?.campus_id ?? null;
      }
      setAssignedCampusId(assigned);

      const stored = localStorage.getItem(STORAGE_KEY);
      const fallback =
        assigned ||
        (stored && list.some(c => c.id === stored) ? stored : '') ||
        list.find(c => c.code === 'MAIN')?.id ||
        list[0]?.id ||
        '';
      setCampusIdState(assigned || fallback);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    load();
  }, [authLoading, load]);

  const setCampusId = (id: string) => {
    if (assignedCampusId && id !== assignedCampusId) return; // locked users cannot switch
    setCampusIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
  };

  const campusName = (id?: string | null) =>
    campuses.find(c => c.id === id)?.name || '';

  return (
    <CampusContext.Provider
      value={{
        campuses,
        activeCampuses: campuses.filter(c => c.is_active),
        campusId,
        setCampusId,
        campus: campuses.find(c => c.id === campusId) || null,
        assignedCampusId,
        isSuperAdmin: isAdmin && !assignedCampusId,
        loading,
        refresh: load,
        campusName,
      }}
    >
      {children}
    </CampusContext.Provider>
  );
};

export const useCampus = () => {
  const ctx = useContext(CampusContext);
  if (!ctx) throw new Error('useCampus must be used within CampusProvider');
  return ctx;
};
