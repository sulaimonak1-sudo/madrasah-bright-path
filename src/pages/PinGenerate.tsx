import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PublicLayout } from '@/components/PublicLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const PinGenerate = () => {
  const { t } = useLanguage();
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedPin, setGeneratedPin] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  function randomPin() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setGeneratedPin('');
    if (!studentId && !studentName) {
      setError(t('Please enter Student Name or ID', 'يرجى إدخال اسم الطالب أو رقم الطالب'));
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setGeneratedPin(randomPin());
      setLoading(false);
    }, 800);
  };

  return (
    <PublicLayout>
      <div className="container py-8 flex justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>{t('Generate Result PIN', 'توليد الرقم السري للنتيجة')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-4">
              <Input
                placeholder={t('Student ID (optional)', 'رقم الطالب (اختياري)')}
                value={studentId}
                onChange={e => setStudentId(e.target.value)}
              />
              <Input
                placeholder={t('Student Name (optional)', 'اسم الطالب (اختياري)')}
                value={studentName}
                onChange={e => setStudentName(e.target.value)}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('Generating...', 'جاري التوليد...') : t('Generate PIN', 'توليد الرقم السري')}
              </Button>
            </form>
            {generatedPin && (
              <div className="mt-4 p-3 bg-muted rounded text-center">
                <span className="font-semibold text-lg">{t('Your PIN:', 'الرقم السري:')} {generatedPin}</span>
              </div>
            )}
            {error && (
              <div className="mt-2 text-destructive text-sm text-center">{error}</div>
            )}
            <Button variant="ghost" className="w-full mt-4" onClick={() => navigate(-1)}>
              {t('Back', 'رجوع')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  );
};

export default PinGenerate;
