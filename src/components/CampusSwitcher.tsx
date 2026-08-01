import { useCampus } from '@/contexts/CampusContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const CampusSwitcher = ({ className }: { className?: string }) => {
  const { campuses, campusId, setCampusId, assignedCampusId, isSuperAdmin, loading } = useCampus();
  const { t } = useLanguage();

  if (loading || campuses.length === 0) return null;

  if (assignedCampusId && !isSuperAdmin) {
    const c = campuses.find(x => x.id === assignedCampusId);
    return (
      <div className={cn('flex items-center gap-2 rounded-md border px-3 py-2 text-sm', className)}>
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{c?.name || t('Campus', 'الفرع')}</span>
      </div>
    );
  }

  return (
    <Select value={campusId} onValueChange={setCampusId}>
      <SelectTrigger className={cn('w-[190px]', className)}>
        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
        <SelectValue placeholder={t('Select campus', 'اختر الفرع')} />
      </SelectTrigger>
      <SelectContent>
        {campuses.map(c => (
          <SelectItem key={c.id} value={c.id} disabled={!c.is_active}>
            {c.name}{!c.is_active ? ` (${t('inactive', 'غير نشط')})` : ''}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
