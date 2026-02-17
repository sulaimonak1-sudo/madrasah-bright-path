import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { PublicLayout } from '@/components/PublicLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Lock } from 'lucide-react';

const AdminLogin = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock login - will be replaced with Supabase auth
    navigate('/admin');
  };

  return (
    <PublicLayout>
      <div className="flex min-h-[60vh] items-center justify-center py-12">
        <Card className="w-full max-w-md shadow-card-lg animate-fade-in">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
              <Lock className="h-7 w-7 text-primary-foreground" />
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
                />
              </div>
              <Button type="submit" className="w-full" size="lg">
                {t('Sign In', 'تسجيل الدخول')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  );
};

export default AdminLogin;
