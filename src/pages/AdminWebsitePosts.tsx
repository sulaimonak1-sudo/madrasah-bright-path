import { useEffect, useState } from 'react';
import { Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { AdminLayout } from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

type Post = { id?: string; type: 'news' | 'event'; title: string; category: string; excerpt: string; body: string; image_url: string | null; event_date: string; published_at: string; sort_order: number };
  const emptyPost = (type: Post['type']): Post => ({ type, title: '', category: type === 'event' ? 'Institute Event' : 'School News', excerpt: '', body: '', image_url: null, event_date: '', published_at: '', sort_order: 0 });
  const inputClass = 'h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15';
  const statusOf = (post: Post) => !post.published_at ? 'Draft' : new Date(post.published_at) > new Date() ? 'Scheduled' : 'Published';
	
  const AdminWebsitePosts = () => {
    const { t } = useLanguage();
    const { toast } = useToast();
    const [posts, setPosts] = useState<Post[]>([]);
    const [selectedId, setSelectedId] = useState<string>();
    const [draft, setDraft] = useState<Post>();
    const [filter, setFilter] = useState<Filter>('all');
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [preview, setPreview] = useState(false);
	
    const loadPosts = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('website_posts').select('*').order('updated_at', { ascending: false });
      if (error) toast({ title: 'Could not load posts', description: error.message, variant: 'destructive' });
      const loaded = (data || []).map(post => ({ ...post, event_date: post.event_date || '', published_at: post.published_at?.slice(0, 16) || '' })) as Post[];
      setPosts(loaded);
      if (!draft && loaded[0]) { setSelectedId(loaded[0].id); setDraft(loaded[0]); }
      setLoading(false);
    };
	
    useEffect(() => { void loadPosts(); }, []);
	
    const visiblePosts = useMemo(() => posts.filter(post => {
      const matchesFilter = filter === 'all' || filter === post.type || (filter === 'draft' && statusOf(post) === 'Draft');
      const term = query.trim().toLowerCase();
      return matchesFilter && (!term || `${post.title} ${post.category} ${post.excerpt}`.toLowerCase().includes(term));
    }), [filter, posts, query]);
	
    const selectPost = (post: Post) => { setSelectedId(post.id); setDraft({ ...post }); setPreview(false); };
    const update = (field: keyof Post, value: string | null) => setDraft(current => current ? { ...current, [field]: value } : current);
    const addPost = (type: Post['type']) => { const next = emptyPost(type); setSelectedId(undefined); setDraft(next); setPreview(false); };
	
    const save = async () => {
      if (!draft?.title.trim()) return toast({ title: 'Title required', description: 'Add a title before saving this post.', variant: 'destructive' });
      setSaving(true);
      const payload = { ...draft, event_date: draft.type === 'event' ? draft.event_date || null : null, published_at: draft.published_at ? new Date(draft.published_at).toISOString() : null };
      const { data, error } = await supabase.from('website_posts').upsert(payload).select().single();
      if (error) toast({ title: 'Could not save post', description: error.message, variant: 'destructive' });
      else if (data) { const saved = { ...data, event_date: data.event_date || '', published_at: data.published_at?.slice(0, 16) || '' } as Post; setPosts(current => [saved, ...current.filter(post => post.id !== saved.id)]); setSelectedId(saved.id); setDraft(saved); toast({ title: 'Post saved', description: `${statusOf(saved)} content is ready.` }); }
      setSaving(false);
    };
	
    const remove = async () => {
      if (!draft) return;
      if (!draft.id) { setDraft(undefined); return; }
      const { error } = await supabase.from('website_posts').delete().eq('id', draft.id);
      if (error) return toast({ title: 'Could not delete post', description: error.message, variant: 'destructive' });
      const remaining = posts.filter(post => post.id !== draft.id);
      setPosts(remaining); setDraft(remaining[0]); setSelectedId(remaining[0]?.id); toast({ title: 'Post deleted' });
    };
	
    const uploadImage = async (file: File) => {
      if (!draft) return;
      const path = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`;
      const { error } = await supabase.storage.from('gallery').upload(path, file);
      if (error) return toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
      update('image_url', supabase.storage.from('gallery').getPublicUrl(path).data.publicUrl);
    };
	
    const setStatus = (status: 'draft' | 'publish') => update('published_at', status === 'draft' ? '' : new Date().toISOString().slice(0, 16));
	
    return <AdminLayout><div className="mx-auto max-w-7xl space-y-6 pb-20">
      <header className="flex flex-col justify-between gap-4 border-b border-border pb-6 lg:flex-row lg:items-end"><div><p className="eyebrow text-primary">{t('Website management', 'إدارة الموقع')}</p><h1 className="mt-2 font-display text-3xl font-extrabold">{t('News & Events', 'الأخبار والفعاليات')}</h1><p className="mt-2 text-sm text-muted-foreground">A focused publishing workspace for everything visitors read on your website.</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => addPost('event')}><Plus className="mr-2 h-4 w-4" />Add event</Button><Button onClick={() => addPost('news')}><Plus className="mr-2 h-4 w-4" />Write news</Button></div></header>
      <div className="grid min-h-[640px] gap-5 lg:grid-cols-[330px_1fr]">
        <aside className="flex flex-col rounded-xl border border-border bg-card"><div className="border-b border-border p-4"><div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search posts..." className={`${inputClass} pl-9`} /></div><div className="mt-3 flex gap-1 overflow-x-auto">{(['all', 'news', 'event', 'draft'] as Filter[]).map(item => <button key={item} onClick={() => setFilter(item)} className={`rounded-md px-2.5 py-1.5 text-xs font-bold capitalize ${filter === item ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>{item === 'all' ? 'All posts' : item}</button>)}</div></div><div className="flex-1 overflow-y-auto p-2">{loading ? <div className="flex justify-center py-16"><Loader2 className="animate-spin text-primary" /></div> : visiblePosts.length === 0 ? <div className="px-4 py-16 text-center"><Newspaper className="mx-auto h-8 w-8 text-muted-foreground/40" /><p className="mt-3 text-sm font-semibold">No posts found</p><p className="mt-1 text-xs text-muted-foreground">Create your first story to get started.</p></div> : visiblePosts.map(post => <button key={post.id} onClick={() => selectPost(post)} className={`w-full rounded-lg border p-3 text-left transition ${selectedId === post.id ? 'border-primary bg-primary/5' : 'border-transparent hover:border-border hover:bg-muted/50'}`}><div className="flex items-center justify-between gap-2"><Badge variant={statusOf(post) === 'Published' ? 'default' : 'secondary'} className="text-[10px]">{statusOf(post)}</Badge><span className="text-[10px] font-bold uppercase text-muted-foreground">{post.type}</span></div><p className="mt-2 line-clamp-2 text-sm font-bold">{post.title || 'Untitled post'}</p><p className="mt-1 truncate text-xs text-muted-foreground">{post.category} {post.updated_at ? `- ${new Date(post.updated_at).toLocaleDateString()}` : ''}</p></button>)}</div></aside>
        <section className="rounded-xl border border-border bg-card">{draft ? <><div className="flex flex-col justify-between gap-4 border-b border-border p-5 sm:flex-row sm:items-center"><div><div className="flex items-center gap-2"><Badge variant="outline">{draft.type}</Badge><span className="text-xs text-muted-foreground">{draft.id ? 'Editing existing content' : 'New draft'}</span></div><h2 className="mt-2 font-display text-xl font-extrabold">{draft.title || 'Untitled post'}</h2></div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setPreview(true)}><Eye className="mr-2 h-4 w-4" />Preview</Button><Button variant="ghost" onClick={remove} className="text-destructive hover:text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</Button></div></div><div className="space-y-6 p-5 md:p-8"><div className="grid gap-5 md:grid-cols-2"><div className="space-y-2 md:col-span-2"><Label>Headline</Label><input autoFocus value={draft.title} onChange={event => update('title', event.target.value)} placeholder="Write a clear, inviting headline" className={inputClass} /></div><div className="space-y-2"><Label>Content type</Label><select value={draft.type} onChange={event => update('type', event.target.value)} className={inputClass}><option value="news">News story</option><option value="event">Event</option></select></div><div className="space-y-2"><Label>Category</Label><input value={draft.category} onChange={event => update('category', event.target.value)} className={inputClass} /></div>{draft.type === 'event' && <div className="space-y-2"><Label>Event date</Label><input type="date" value={draft.event_date} onChange={event => update('event_date', event.target.value)} className={inputClass} /></div>}<div className="space-y-2"><Label>Publish date</Label><input type="datetime-local" value={draft.published_at} onChange={event => update('published_at', event.target.value)} className={inputClass} /><p className="text-xs text-muted-foreground">Leave empty to keep this in drafts. A future date schedules it.</p></div></div><div className="space-y-2"><Label>Summary</Label><Textarea value={draft.excerpt} onChange={event => update('excerpt', event.target.value)} placeholder="A short summary used on cards and social sharing" className="min-h-[90px]" /></div><div className="space-y-2"><Label>Story body</Label><Textarea value={draft.body} onChange={event => update('body', event.target.value)} placeholder="Write the full story here..." className="min-h-[240px] leading-7" /></div><div className="grid gap-5 md:grid-cols-[1fr_220px]"><div className="space-y-2"><Label>Featured image</Label><div className="flex gap-2"><input value={draft.image_url || ''} onChange={event => update('image_url', event.target.value)} placeholder="Image URL" className={inputClass} /><label className="inline-flex h-10 shrink-0 cursor-pointer items-center rounded-lg border border-border px-3 text-sm font-semibold hover:bg-muted"><ImagePlus className="mr-2 h-4 w-4" />Upload<input type="file" accept="image/*" className="hidden" onChange={event => { const file = event.target.files?.[0]; if (file) void uploadImage(file); }} /></label></div></div>{draft.image_url && <img src={draft.image_url} alt="Featured preview" className="h-24 w-full rounded-lg object-cover" />}</div><div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6"><div className="flex gap-2"><Button variant="outline" onClick={() => setStatus('draft')}>Save as draft</Button><Button variant="outline" onClick={() => setStatus('publish')}>Publish now</Button></div><Button onClick={() => void save()} disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save changes</Button></div></div></> : <div className="flex h-full min-h-[640px] items-center justify-center p-8 text-center"><div><Newspaper className="mx-auto h-10 w-10 text-muted-foreground/40" /><h2 className="mt-4 font-display text-xl font-bold">Choose a post to edit</h2><p className="mt-2 text-sm text-muted-foreground">Select a story or create new content from the buttons above.</p></div></div>}</section>
      </div>
      <Dialog open={preview} onOpenChange={setPreview}><DialogContent className="max-w-3xl"><DialogHeader><DialogTitle>{draft?.title || 'Post preview'}</DialogTitle><DialogDescription>This is how the story content will read on the public site.</DialogDescription></DialogHeader><div className="max-h-[65vh] overflow-y-auto">{draft?.image_url && <img src={draft.image_url} alt="" className="aspect-[16/7] w-full rounded-lg object-cover" />}<div className="mt-6 flex items-center gap-2 text-xs font-bold uppercase text-primary"><CalendarDays className="h-4 w-4" />{draft?.category} {draft?.published_at && `- ${new Date(draft.published_at).toLocaleDateString()}`}</div><h3 className="mt-3 font-display text-3xl font-extrabold">{draft?.title || 'Untitled post'}</h3><p className="mt-4 text-lg font-semibold leading-8">{draft?.excerpt}</p><div className="mt-5 whitespace-pre-wrap leading-8 text-muted-foreground">{draft?.body}</div></div></DialogContent></Dialog>
    </div></AdminLayout>;
  };
	
  export default AdminWebsitePosts;
