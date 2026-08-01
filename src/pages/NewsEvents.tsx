import { CalendarDays, ChevronRight, Megaphone } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { PublicLayout } from '@/components/PublicLayout';
import { PublicPageHeader } from '@/components/PublicPageHeader';
import { useWebsiteSettings } from '@/hooks/use-website-settings';
import { supabase } from '@/integrations/supabase/client';

const defaults = {
  'website.news_1': 'Students celebrate another term of learning and growth.',
  'website.news_2': 'Qur’an recitation and Islamic knowledge competition announced.',
  'website.news_3': 'Our learning community welcomes families to a new academic session.',
  'website.news_category_1': 'School News',
  'website.news_category_2': 'Competitions',
  'website.news_category_3': 'Announcements',
  'website.news_date_1': 'August 01, 2026',
  'website.news_date_2': 'July 24, 2026',
  'website.news_date_3': 'July 12, 2026',
  'website.events': 'Qur’an Competition|Ramadan Activities|End-of-year Graduation',
  'website.event_dates': 'Aug 12|Mar 05|Dec 18',
};

const NewsEvents = () => {
  const { t } = useLanguage();
  const settings = useWebsiteSettings(defaults);
  const [posts, setPosts] = useState<Array<{ id: string; type: string; title: string; category: string; excerpt: string; body: string; image_url: string | null; event_date: string | null; published_at: string | null }>>([]);
  useEffect(() => {
    supabase.from('website_posts').select('id,type,title,category,excerpt,body,image_url,event_date,published_at').order('published_at', { ascending: false }).then(({ data }) => {
      if (data) setPosts(data);
    });
  }, []);
  const fallbackArticles = [1, 2, 3].map(index => ({
    title: settings[`website.news_${index}`],
    category: settings[`website.news_category_${index}`],
    date: settings[`website.news_date_${index}`],
  }));
  const articles = posts.filter(post => post.type === 'news').length > 0 ? posts.filter(post => post.type === 'news') : fallbackArticles;
  const dates = settings['website.event_dates'].split('|');
  const fallbackEvents = settings['website.events'].split('|').filter(Boolean).map((title, index) => ({ title, event_date: dates[index] || null, excerpt: '' }));
  const events = posts.filter(post => post.type === 'event').length > 0 ? posts.filter(post => post.type === 'event') : fallbackEvents;

  return (
    <PublicLayout>
      <PublicPageHeader eyebrow="News & events" title={t('The life of our learning community.', 'أخبار وفعاليات مجتمعنا التعليمي')}>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">{t('News, announcements, achievements, and moments from the Institute for Islamic Sciences.', 'أخبار وإعلانات وإنجازات ولحظات من معهد العلوم الإسلامية.')}</p>
      </PublicPageHeader>
      <main className="container py-20">
        <section>
          <div className="flex items-end justify-between border-b border-border pb-5">
            <div><p className="eyebrow text-primary">{t('From the institute', 'من المعهد')}</p><h2 className="mt-2 font-display text-3xl font-extrabold">{t('Latest news', 'آخر الأخبار')}</h2></div>
            <span className="hidden text-xs font-semibold text-muted-foreground sm:block">{t('School news · Announcements · Achievements', 'أخبار المدرسة · إعلانات · إنجازات')}</span>
          </div>
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {articles.map((article, index) => <article key={article.id || article.title} className={`group flex min-h-[270px] flex-col justify-between border border-border bg-card p-6 shadow-card transition-transform hover:-translate-y-1 ${index === 0 ? 'lg:border-t-4 lg:border-t-accent' : ''}`}>
              <div>{'image_url' in article && article.image_url && <img src={article.image_url} alt="" className="mb-5 aspect-[16/9] w-full object-cover" />}<div className="flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-[0.15em] text-primary"><span>{article.category}</span><Megaphone className="h-4 w-4" /></div><h3 className="mt-6 font-display text-2xl font-extrabold leading-tight">{article.title}</h3>{article.excerpt && <p className="mt-3 text-sm leading-6 text-muted-foreground">{article.excerpt}</p>}</div>
              <div className="mt-8 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground"><time>{'date' in article ? article.date : article.published_at?.slice(0, 10)}</time>{'id' in article && <Link to={`/news/${article.id}`} className="inline-flex items-center gap-1 font-bold text-primary">{t('Read story', 'اقرأ الخبر')}<ChevronRight className="h-4 w-4" /></Link>}</div>
            </article>)}
          </div>
        </section>
        <section className="mt-24 grid gap-10 lg:grid-cols-[0.7fr_1.3fr]">
          <div><p className="eyebrow text-primary">{t('Mark your calendar', 'سجل في تقويمك')}</p><h2 className="mt-3 font-display text-4xl font-extrabold">{t('Upcoming events', 'الفعاليات القادمة')}</h2><p className="mt-5 text-sm leading-7 text-muted-foreground">{t('Moments for learning, worship, celebration, and community.', 'لحظات للتعلم والعبادة والاحتفال والمجتمع.')}</p></div>
          <div className="divide-y divide-border border-y border-border">{events.map((event, index) => <article key={event.id || event.title} className="flex items-center gap-5 py-5"><div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center bg-primary text-primary-foreground"><CalendarDays className="mb-1 h-4 w-4" /><span className="text-[10px] font-bold uppercase">{event.event_date || dates[index] || t('Soon', 'قريباً')}</span></div><div><p className="font-display text-xl font-bold">{event.title}</p>{event.excerpt && <p className="mt-1 text-sm text-muted-foreground">{event.excerpt}</p>}<p className="mt-1 text-xs text-muted-foreground">{t('Institute event', 'فعالية المعهد')}</p></div></article>)}</div>
        </section>
      </main>
    </PublicLayout>
  );
};

export default NewsEvents;