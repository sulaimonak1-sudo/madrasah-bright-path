import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { PublicLayout } from '@/components/PublicLayout';
import { PublicPageHeader } from '@/components/PublicPageHeader';
import { supabase } from '@/integrations/supabase/client';

const NewsPost = () => {
  const { id } = useParams();
  const [post, setPost] = useState<{ title: string; category: string; excerpt: string; body: string; image_url: string | null; published_at: string | null } | null>(null);
  useEffect(() => { if (id) supabase.from('website_posts').select('title,category,excerpt,body,image_url,published_at').eq('id', id).single().then(({ data }) => setPost(data)); }, [id]);
  if (!post) return <PublicLayout><main className="container py-24 text-center">This story could not be found.</main></PublicLayout>;
  return <PublicLayout><PublicPageHeader eyebrow={post.category} title={post.title}><p className="mt-5 text-sm text-muted-foreground">{post.published_at?.slice(0, 10)}</p></PublicPageHeader><main className="container max-w-4xl py-16"><Link to="/news-events" className="inline-flex items-center gap-2 text-sm font-bold text-primary"><ArrowLeft className="h-4 w-4" />Back to news</Link>{post.image_url && <img src={post.image_url} alt="" className="mt-8 aspect-[16/8] w-full object-cover" />}<p className="mt-10 text-lg font-semibold leading-8">{post.excerpt}</p><div className="mt-8 whitespace-pre-wrap text-base leading-8 text-muted-foreground">{post.body}</div></main></PublicLayout>;
};
export default NewsPost;