import { useEffect, useRef, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Image as ImageIcon } from 'lucide-react';

const ProfileSettings = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingSig, setUploadingSig] = useState(false);

  const avatarRef = useRef<HTMLInputElement>(null);
  const sigRef = useRef<HTMLInputElement>(null);

  const fetchProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle();
      setProfile(data || { user_id: user.id, full_name: '', phone: '', avatar_url: null, signature_url: null });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await supabase.from('profiles').upsert({
        user_id: user.id,
        full_name: (profile.full_name || '').trim(),
        phone: (profile.phone || null),
      } as any, { onConflict: 'user_id' });
      toast({ title: t('Saved', 'تم الحفظ'), description: t('Profile updated', 'تم تحديث الملف الشخصي') });
      fetchProfile();
    } catch (err: any) {
      toast({ title: t('Error', 'خطأ'), description: err.message || String(err), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const uploadToBucket = async (file: File, bucket: string, destPath: string) => {
    const { error: upErr } = await supabase.storage.from(bucket).upload(destPath, file, { upsert: true });
    if (upErr) throw upErr;
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(destPath);
    return urlData.publicUrl + '?t=' + Date.now();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingAvatar(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/avatar.${ext}`;
      const url = await uploadToBucket(file, 'avatars', path);
      await supabase.from('profiles').upsert({ user_id: user.id, avatar_url: url } as any, { onConflict: 'user_id' });
      toast({ title: t('Uploaded', 'تم الرفع'), description: t('Avatar updated', 'تم تحديث صورة الملف الشخصي') });
      fetchProfile();
    } catch (err: any) {
      toast({ title: t('Error', 'خطأ'), description: err.message || String(err), variant: 'destructive' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSignatureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingSig(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/signature.${ext}`;
      const url = await uploadToBucket(file, 'signatures', path);
      await supabase.from('profiles').upsert({ user_id: user.id, signature_url: url } as any, { onConflict: 'user_id' });
      toast({ title: t('Uploaded', 'تم الرفع'), description: t('Signature updated', 'تم تحديث التوقيع') });
      fetchProfile();
    } catch (err: any) {
      toast({ title: t('Error', 'خطأ'), description: err.message || String(err), variant: 'destructive' });
    } finally {
      setUploadingSig(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t('Profile Settings', 'إعدادات الملف')}</h1>
          <p className="text-muted-foreground text-sm">{t('Update your name, phone, avatar, and signature', 'قم بتحديث الاسم، الهاتف، الصورة، والتوقيع')}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('Personal Info', 'المعلومات الشخصية')}</CardTitle>
            <CardDescription>{t('Your basic profile details', 'تفاصيل ملفك الأساسية')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="py-8 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                <div className="sm:col-span-1 flex flex-col items-center gap-3">
                  <Avatar className="h-24 w-24">
                    {profile?.avatar_url ? (
                      <AvatarImage src={profile.avatar_url} alt={profile.full_name || 'avatar'} />
                    ) : (
                      <AvatarFallback>{(profile?.full_name || user?.email || 'U').substring(0,2).toUpperCase()}</AvatarFallback>
                    )}
                  </Avatar>
                  <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  <Button variant="outline" onClick={() => avatarRef.current?.click()} disabled={uploadingAvatar}>
                    {uploadingAvatar ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Upload className="mr-2 h-3 w-3" />}
                    {t('Change Avatar', 'تغيير الصورة')}
                  </Button>
                </div>

                <div className="sm:col-span-2 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t('Full Name', 'الاسم الكامل')}</Label>
                      <Input value={profile?.full_name || ''} onChange={e => setProfile({ ...profile, full_name: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t('Phone', 'الهاتف')}</Label>
                      <Input value={profile?.phone || ''} onChange={e => setProfile({ ...profile, phone: e.target.value })} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">{t('My Signature', 'توقيعي')}</Label>
                    <div className="flex items-center gap-4">
                      {profile?.signature_url ? (
                        <div className="border rounded-lg p-2 bg-muted/50 w-40 h-20 flex items-center justify-center">
                          <img src={profile.signature_url} alt="Signature" className="max-h-full max-w-full object-contain" />
                        </div>
                      ) : (
                        <div className="border border-dashed rounded-lg p-4 bg-muted/30 w-40 h-20 flex items-center justify-center text-muted-foreground text-xs">
                          {t('No signature', 'لا يوجد توقيع')}
                        </div>
                      )}
                      <div>
                        <input ref={sigRef} type="file" accept="image/*" className="hidden" onChange={handleSignatureChange} />
                        <Button variant="outline" onClick={() => sigRef.current?.click()} disabled={uploadingSig}>
                          {uploadingSig ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <ImageIcon className="mr-2 h-3 w-3" />}
                          {profile?.signature_url ? t('Replace', 'استبدال') : t('Upload', 'رفع')}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button onClick={handleSave} disabled={saving}>
                      {saving ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
                      {t('Save Changes', 'حفظ التغييرات')}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default ProfileSettings;
