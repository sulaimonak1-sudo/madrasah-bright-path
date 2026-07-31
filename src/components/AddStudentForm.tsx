import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useCampus } from '@/contexts/CampusContext';

interface AddStudentFormProps {
  classLevels: any[];
  classArms: any[];
  assignedLevelId?: string | null;
  assignedArmId?: string | null;
}

export function AddStudentForm({ classLevels, classArms, assignedLevelId, assignedArmId }: AddStudentFormProps) {
  const { toast } = useToast();
  const { campusId } = useCampus();
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!fullName.trim()) {
      toast({ title: 'Error', description: 'Full name is required', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from('students').insert({
        full_name: fullName.trim(),
        gender: gender || null,
        status: 'active',
        class_level_id: assignedLevelId,
        class_arm_id: assignedArmId,
        guardian_name: guardianName.trim() || null,
        guardian_phone: guardianPhone.trim() || null,
        campus_id: campusId,
      });
      if (error) throw error;
      toast({ title: 'Student added', description: 'Student successfully added to your class.' });
      setFullName(''); setGender(''); setGuardianName(''); setGuardianPhone('');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-3" onSubmit={e => { e.preventDefault(); handleAdd(); }}>
      <div className="space-y-2">
        <Label>Full Name *</Label>
        <Input value={fullName} onChange={e => setFullName(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label>Gender</Label>
        <Select value={gender} onValueChange={setGender}>
          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Guardian Name</Label>
        <Input value={guardianName} onChange={e => setGuardianName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Guardian Phone</Label>
        <Input value={guardianPhone} onChange={e => setGuardianPhone(e.target.value)} />
      </div>
      <Button type="submit" disabled={loading || !fullName.trim()}>{loading ? 'Adding...' : 'Add Student'}</Button>
    </form>
  );
}
