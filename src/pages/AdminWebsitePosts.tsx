import { useEffect, useState } from 'react';
import { Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { AdminLayout } from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

type Post = { id?: string; type: 'news' | 'event'; title: string; category: string; excerpt: string; event_date: string; published_at: string; sort_order: number };
const emptyPost = (type: Post['type'] = 'news'): Post => ({ type, title: '', category: type === 'event' ? 'Institute Event' : 'School News', excerpt: '', event_date: '', published_at: '', sort_order: 0 });

const AdminWebsitePosts = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('website_posts').select('*').order('type').order('sort_order').order('published_at', { ascending: false });
    if (!error) setPosts((data || []).map(post => ({ ...post, event_date: post.event_date || '', published_at: post.published_at ? post.published_at.slice(0, 16) : '' })) as Post[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);
  const update = (index: number, field: keyof Post, value: string) => setPosts(current => current.map((post, itemIndex) => itemIndex === index ? { ...post, [field]: value } : post));
  const save = async (post: Post) => {
    setSaving(true);
    const payload = { ...post, event_date: post.type === 'event' ? post.event_date || null : null, published_at: post.published_at ? new Date(post.published_at).toISOString() : null };
    const { data, error } = await supabase.from('website_posts').upsert(payload).select().single();
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else if (data) setPosts(current => current.map(item => item.id === post.id ? { ...data, event_date: data.event_date || '', published_at: data.published_at ? data.published_at.slice(0, 16) : '' } as Post : item));
    setSaving(false);
  };
  const remove = async (post: Post) => { if (!post.id) { setPosts(current => current.filter(item => item !== post)); return; } const { error } = await supabase.from('website_posts').delete().eq('id', post.id); if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' }); else setPosts(current => current.filter(item => item.id !== post.id)); };
  return <AdminLayout><div className="mx-auto max-w-6xl space-y-6 pb-20"><header className="flex items-end justify-between border-b border-border pb-6"><div><p className="eyebrow text-primary">{t('Website management', 'إدارة الموقع')}</p><h1 className="mt-2 font-display text-3xl font-extrabold">{t('News & Events', 'الأخبار والفعاليات')}</h1><p className="mt-2 text-sm text-muted-foreground">{t('Create, publish, edit, and archive public website posts.', 'إنشاء ونشر وتعديل وأرشفة منشورات الموقع العام.')}</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => setPosts(current => [emptyPost('event'), ...current])}><Plus className="mr-2 h-4 w-4" />{t('Add event', 'إضافة فعالية')}</Button><Button onClick={() => setPosts(current => [emptyPost('news'), ...current])}><Plus className="mr-2 h-4 w-4" />{t('Add news', 'إضافة خبر')}</Button></div></header>{loading ? <div className="flex items-center justify-center py-20 text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" />{t('Loading posts...', 'جار تحميل المنشورات...')}</div> : <div className="space-y-5">{posts.map((post, index) => <article key={post.id || `new-${index}`} className="rounded-xl border border-border bg-card p-5 shadow-card"><div className="mb-4 flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-[0.15em] text-primary">{post.type}</span><button type="button" onClick={() => remove(post)} className="text-muted-foreground hover:text-destructive" aria-label={t('Delete post', 'حذف المنشور')}><Trash2 className="h-4 w-4" /></button></div><div className="grid gap-4 md:grid-cols-2"><div className="space-y-2 md:col-span-2"><Label>{t('Title', 'العنوان')}</Label><input value={post.title} onChange={event => update(index, 'title', event.target.value)} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" /></div><div className="space-y-2"><Label>{t('Category', 'التصنيف')}</Label><input value={post.category} onChange={event => update(index, 'category', event.target.value)} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" /></div><div className="space-y-2"><Label>{t('Publish date', 'تاريخ النشر')}</Label><input type="datetime-local" value={post.published_at} onChange={event => update(index, 'published_at', event.target.value)} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" /></div>{post.type === 'event' && <div className="space-y-2"><Label>{t('Event date', 'تاريخ الفعالية')}</Label><input type="date" value={post.event_date} onChange={event => update(index, 'event_date', event.target.value)} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" /></div>}<div className="space-y-2 md:col-span-2"><Label>{t('Excerpt', 'الملخص')}</Label><textarea value={post.excerpt} onChange={event => update(index, 'excerpt', event.target.value)} className="min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></div></div><div className="mt-4 flex justify-end"><Button size="sm" onClick={() => save(post)} disabled={saving || !post.title.trim()}><Save className="mr-2 h-4 w-4" />{t('Save post', 'حفظ المنشور')}</Button></div></article>)}{posts.length === 0 && <div className="border border-dashed border-border py-16 text-center text-sm text-muted-foreground">{t('No posts yet. Add the first news item or event.', 'لا توجد منشورات بعد. أضف أول خبر أو فعالية.')}</div>}</div>}</div></AdminLayout>;
};

export default AdminWebsitePosts;