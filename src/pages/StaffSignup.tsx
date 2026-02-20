import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GraduationCap, KeyRound, UserPlus, Loader2, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type Step = 'auth_key' | 'signup' | 'profile' | 'done';

const StaffSignup = () => {
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>('auth_key');
  const [loading, setLoading] = useState(false);

  const [authKey, setAuthKey] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [classArmId, setClassArmId] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [classLevels, setClassLevels] = useState<any[]>([]);
  const [classArms, setClassArms] = useState<any[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setClassesLoading(true);
      try {
        console.log('Fetching class_levels and class_arms...');
        const [clRes, armsRes] = await Promise.all([
          supabase.from('class_levels').select('*').order('display_order'),
          supabase.from('class_arms').select('*').order('name'),
        ]);
        
        if (clRes.error) {
          console.error('Error fetching class_levels:', clRes.error);
          toast({ title: t('Error', 'خطأ'), description: 'Failed to fetch class levels', variant: 'destructive' });
        } else {
          console.log('class_levels fetched:', clRes.data);
          setClassLevels(clRes.data || []);
        }
        
        if (armsRes.error) {
          console.error('Error fetching class_arms:', armsRes.error);
          toast({ title: t('Error', 'خطأ'), description: 'Failed to fetch class arms', variant: 'destructive' });
        } else {
          console.log('class_arms fetched:', armsRes.data);
          setClassArms(armsRes.data || []);
        }
      } catch (err) {
        console.error('Error loading classes:', err);
        toast({ title: t('Error', 'خطأ'), description: 'Failed to load classes', variant: 'destructive' });
      } finally {
        setClassesLoading(false);
      }
    })();
  }, [toast, t]);

  const validateAuthKey = async () => {
    if (!authKey.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('validate-auth-key', {
        body: { key: authKey.trim() },
      });
      if (error) throw error;
      if (data?.valid) {
        setStep('signup');
      } else {
        toast({ title: t('Invalid Key', 'مفتاح غير صالح'), description: t('The authorization key is incorrect.', 'مفتاح التفويض غير صحيح.'), variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: t('Error', 'خطأ'), description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (password !== confirmPassword) {
      toast({ title: t('Error', 'خطأ'), description: t('Passwords do not match', 'كلمات المرور غير متطابقة'), variant: 'destructive' });
      return;
    }
    if (password.length < 6) {
      toast({ title: t('Error', 'خطأ'), description: t('Password must be at least 6 characters', 'يجب أن تكون كلمة المرور 6 أحرف على الأقل'), variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      console.log('Attempting signup with email:', email);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      
      if (error) {
        console.error('Signup error details:', {
          message: error.message,
          status: error.status,
          code: error.code,
        });
        throw error;
      }
      
      if (data.user) {
        console.log('Signup successful. User ID:', data.user.id);
        setCurrentUserId(data.user.id);
        setStep('profile');
      }
    } catch (err: any) {
      console.error('Signup exception:', err);
      const errorMsg = err.message || 'Unknown error occurred';
      
      // Provide more helpful error messages
      let userMessage = errorMsg;
      if (errorMsg.includes('email limit exceeded') || errorMsg.includes('rate limit')) {
        userMessage = t(
          'Too many signup attempts. Please try again in a few minutes.',
          'عدد كبير جداً من محاولات التسجيل. يرجى المحاولة مرة أخرى بعد بضع دقائق.'
        );
      } else if (errorMsg.includes('already registered') || errorMsg.includes('duplicate')) {
        userMessage = t(
          'This email is already registered. Please try logging in instead.',
          'هذا البريد الإلكتروني مسجل بالفعل. يرجى محاولة تسجيل الدخول بدلاً من ذلك.'
        );
      }
      
      toast({ title: t('Error', 'خطأ'), description: userMessage, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSave = async () => {
    if (!fullName.trim() || !currentUserId) {
      toast({ title: t('Error', 'خطأ'), description: t('Please enter your full name', 'يرجى إدخال اسمك الكامل'), variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      console.log('Saving profile for user:', currentUserId);
      const { error: profileErr } = await supabase.from('profiles').upsert({
        user_id: currentUserId,
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        class_teacher_class_arm_id: classArmId || null,
      }, { onConflict: 'user_id' });
      
      if (profileErr) {
        console.error('Profile error:', profileErr);
        throw profileErr;
      }
      
      console.log('Profile saved successfully');

      const { error: roleErr } = await supabase.from('user_roles').insert({
        user_id: currentUserId,
        role: 'teacher',
      });
      
      if (roleErr) {
        console.error('Role assignment error:', roleErr);
        throw new Error(`Failed to assign role: ${roleErr.message}`);
      }

      setStep('done');
    } catch (err: any) {
      console.error('Error saving profile:', err);
      toast({ title: t('Error', 'خطأ'), description: err.message || 'Failed to save profile', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Build class options: "Level - Arm"
  const classOptions = classArms.map(arm => {
    const level = classLevels.find(l => l.id === arm.class_level_id);
    const label = `${level?.name_en || 'Unknown'} - ${arm.name}`;
    console.log(`Class option: ${label} (arm: ${arm.id}, level: ${arm.class_level_id})`);
    return { id: arm.id, label };
  });

  useEffect(() => {
    console.log('classArms updated:', classArms);
    console.log('classLevels updated:', classLevels);
    console.log('classOptions computed:', classOptions);
  }, [classArms, classLevels]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="absolute top-4 right-4">
        <LanguageToggle />
      </div>

      <Card className="w-full max-w-md shadow-card">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary mb-3">
            <GraduationCap className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle>{t('Staff Registration', 'تسجيل الموظفين')}</CardTitle>
          <CardDescription>
            {step === 'auth_key' && t('Enter the school authorization key to proceed', 'أدخل مفتاح تفويض المدرسة للمتابعة')}
            {step === 'signup' && t('Create your account', 'أنشئ حسابك')}
            {step === 'profile' && t('Complete your profile', 'أكمل ملفك الشخصي')}
            {step === 'done' && t('Registration complete!', 'اكتمل التسجيل!')}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="flex items-center justify-center gap-2 mb-4">
            {['auth_key', 'signup', 'profile'].map((s, i) => (
              <div key={s} className={`h-2 w-12 rounded-full transition-colors ${
                step === s ? 'bg-primary' : 
                ['auth_key', 'signup', 'profile'].indexOf(step) > i ? 'bg-primary/50' : 'bg-muted'
              }`} />
            ))}
          </div>

          {step === 'auth_key' && (
            <>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4" />
                  {t('Authorization Key', 'مفتاح التفويض')}
                </Label>
                <Input
                  type="password"
                  value={authKey}
                  onChange={e => setAuthKey(e.target.value)}
                  placeholder={t('Enter school authorization key', 'أدخل مفتاح تفويض المدرسة')}
                  onKeyDown={e => e.key === 'Enter' && validateAuthKey()}
                />
                <p className="text-xs text-muted-foreground">
                  {t('Contact the school admin to get the authorization key', 'تواصل مع مدير المدرسة للحصول على مفتاح التفويض')}
                </p>
              </div>
              <Button className="w-full" onClick={validateAuthKey} disabled={loading || !authKey.trim()}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                {t('Continue', 'متابعة')}
              </Button>
            </>
          )}

          {step === 'signup' && (
            <>
              <div className="space-y-2">
                <Label>{t('Email', 'البريد الإلكتروني')}</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="staff@example.com" />
              </div>
              <div className="space-y-2">
                <Label>{t('Password', 'كلمة المرور')}</Label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <div className="space-y-2">
                <Label>{t('Confirm Password', 'تأكيد كلمة المرور')}</Label>
                <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('auth_key')} className="flex-1">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t('Back', 'رجوع')}
                </Button>
                <Button onClick={handleSignup} disabled={loading || !email || !password} className="flex-1">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                  {t('Sign Up', 'إنشاء حساب')}
                </Button>
              </div>
            </>
          )}

          {step === 'profile' && (
            <>
              <div className="space-y-2">
                <Label>{t('Full Name', 'الاسم الكامل')}</Label>
                <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder={t('Enter your full name', 'أدخل اسمك الكامل')} />
              </div>
              <div className="space-y-2">
                <Label>{t('Phone Number', 'رقم الهاتف')}</Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="08012345678" />
              </div>
              <div className="space-y-2">
                <Label>{t('Class Teacher Of', 'معلم فصل')}</Label>
                {classesLoading ? (
                  <div className="p-3 text-sm text-muted-foreground text-center">
                    {t('Loading classes...', 'جاري تحميل الفصول...')}
                  </div>
                ) : classOptions.length === 0 ? (
                  <div className="p-3 text-sm text-amber-600 bg-amber-50 rounded border border-amber-200">
                    {t('No classes available. Please contact the admin to set up classes.', 'لا توجد فصول متاحة. يرجى التواصل مع المسؤول لإعداد الفصول.')}
                  </div>
                ) : (
                  <Select value={classArmId} onValueChange={setClassArmId}>
                    <SelectTrigger><SelectValue placeholder={t('Select class', 'اختر الفصل')} /></SelectTrigger>
                    <SelectContent>
                      {classOptions.map(opt => (
                        <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <p className="text-xs text-muted-foreground">
                  {t('Select the class you are class teacher of (optional)', 'اختر الفصل الذي أنت معلمه (اختياري)')}
                </p>
              </div>
              <Button className="w-full" onClick={handleProfileSave} disabled={loading || !fullName.trim()}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                {t('Complete Registration', 'إكمال التسجيل')}
              </Button>
            </>
          )}

          {step === 'done' && (
            <div className="text-center space-y-4">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
              <p className="text-sm text-muted-foreground">
                {t(
                  'Your account has been created. The admin will review and assign your classes/subjects.',
                  'تم إنشاء حسابك. سيقوم المدير بمراجعة وتعيين الفصول/المواد الخاصة بك.'
                )}
              </p>
              <Button onClick={() => navigate('/admin/login')} className="w-full">
                {t('Go to Login', 'انتقل لتسجيل الدخول')}
              </Button>
            </div>
          )}

          {step !== 'done' && (
            <p className="text-center text-xs text-muted-foreground">
              {t('Already have an account?', 'لديك حساب بالفعل?')}{' '}
              <button
                type="button"
                onClick={() => navigate('/admin/login')}
                className="text-primary hover:underline bg-transparent border-none cursor-pointer p-0"
              >
                {t('Login', 'تسجيل الدخول')}
              </button>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffSignup;
