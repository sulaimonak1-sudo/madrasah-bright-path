import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { PublicLayout } from '@/components/PublicLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

const AdminLogin = () => {
  const { t } = useLanguage();
  const { user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in with valid role
  useEffect(() => {
    if (!authLoading && user && (role === 'admin' || role === 'teacher')) {
      navigate('/admin', { replace: true });
    }
  }, [user, role, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast({
        variant: 'destructive',
        title: t('Login Failed', 'فشل تسجيل الدخول'),
        description: t(error.message, error.message),
      });
      setLoading(false);
      return;
    }

    // Role will be fetched by AuthContext, redirect handled by useEffect
    setLoading(false);
  };

  return (
    <PublicLayout>
      <div className="flex min-h-[60vh] items-center justify-center py-12">
        <Card className="w-full max-w-md shadow-card-lg animate-fade-in">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl overflow-hidden">
              <img src="/images/school-logo.png" alt="Al-Bari Logo" className="h-full w-full object-contain" />
            </div>
            <CardTitle className="text-xl">
              {t('Admin Login', 'تسجيل دخول المسؤول')}
            </CardTitle>
            <CardDescription>
              {t('Sign in to manage results', 'سجل الدخول لإدارة النتائج')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label>{t('Email', 'البريد الإلكتروني')}</Label>
                <Input
                  type="email"
                  placeholder="admin@albari.edu"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('Password', 'كلمة المرور')}</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {t('Sign In', 'تسجيل الدخول')}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                {t('Staff?', 'موظف?')}{' '}
                <button
                  type="button"
                  onClick={() => navigate('/staff/signup')}
                  className="text-primary hover:underline font-medium bg-transparent border-none cursor-pointer p-0"
                >
                  {t('Register here', 'سجل هنا')}
                </button>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  );
};

export default AdminLogin;
