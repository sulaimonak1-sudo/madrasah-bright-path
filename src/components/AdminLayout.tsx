import { ReactNode, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Layers,
  FolderOpen,
  Calendar,
  Upload,
  TrendingUp,
  FileText,
  Lock,
  LogOut,
  Menu,
  X,
  UserCog,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface AdminLayoutProps {
  children: ReactNode;
}

const navGroups = [
  {
    label_en: 'Overview',
    label_ar: 'نظرة عامة',
    items: [
      { path: '/admin', icon: LayoutDashboard, label_en: 'Dashboard', label_ar: 'لوحة التحكم' },
    ],
  },
  {
    label_en: 'Academic',
    label_ar: 'الأكاديمية',
    items: [
      { path: '/admin/students', icon: Users, label_en: 'Students', label_ar: 'الطلاب' },
      { path: '/admin/class-levels', icon: Layers, label_en: 'Class Levels', label_ar: 'المراحل الدراسية' },
      { path: '/admin/class-arms', icon: FolderOpen, label_en: 'Class Arms', label_ar: 'الشعب' },
      { path: '/admin/subjects', icon: BookOpen, label_en: 'Subjects', label_ar: 'المواد الدراسية' },
      { path: '/admin/sessions', icon: Calendar, label_en: 'Sessions & Terms', label_ar: 'السنوات والفصول' },
    ],
  },
  {
    label_en: 'Assessment',
    label_ar: 'التقييم',
    items: [
      { path: '/admin/results', icon: Upload, label_en: 'Results Entry', label_ar: 'إدخال النتائج' },
      { path: '/admin/reports', icon: FileText, label_en: 'Reports', label_ar: 'التقارير' },
      { path: '/admin/promotion', icon: TrendingUp, label_en: 'Promotion', label_ar: 'الترقية' },
      { path: '/admin/locking', icon: Lock, label_en: 'Result Locking', label_ar: 'قفل النتائج' },
    ],
  },
  {
    label_en: 'Administration',
    label_ar: 'الإدارة',
    items: [
      { path: '/admin/staff', icon: UserCog, label_en: 'Staff Management', label_ar: 'إدارة الموظفين' },
    ],
  },
];

const mobileDockItems = [
  { type: 'link', to: '/admin', icon: LayoutDashboard, label_en: 'Home', label_ar: 'الرئيسية', exact: true },
  { type: 'link', to: '/admin/students', icon: Users, label_en: 'Students', label_ar: 'الطلاب' },
  { type: 'link', to: '/admin/results', icon: Upload, label_en: 'Results', label_ar: 'النتائج' },
  { type: 'link', to: '/admin/reports', icon: FileText, label_en: 'Reports', label_ar: 'التقارير' },
  { type: 'action', icon: Menu, label_en: 'Menu', label_ar: 'القائمة' },
] as const;

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { t, isRTL } = useLanguage();
  const { signOut, isAdmin, role, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const filteredGroups = navGroups
    .map(group => ({
      ...group,
      items: isAdmin
        ? group.items
        : group.items.filter(item => ['/admin', '/admin/results', '/admin/reports', '/admin/students'].includes(item.path)),
    }))
    .filter(group => group.items.length > 0);

  const userInitials = user?.email?.substring(0, 2).toUpperCase() || 'U';

  const pageTitle = useMemo(() => {
    if (location.pathname.startsWith('/admin/settings')) {
      return t('Profile Settings', 'إعدادات الملف الشخصي');
    }

    const allItems = navGroups.flatMap(group => group.items);
    const match = allItems.find(item => location.pathname === item.path || location.pathname.startsWith(`${item.path}/`));
    return match ? t(match.label_en, match.label_ar) : t('Dashboard', 'لوحة التحكم');
  }, [location.pathname, t]);

  return (
    <div className={cn('flex min-h-screen bg-background', isRTL && 'flex-row-reverse')}>
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 z-50 flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 md:relative',
          collapsed ? 'w-[68px]' : 'w-64',
          isRTL ? 'right-0' : 'left-0',
          sidebarOpen ? 'translate-x-0' : isRTL ? 'translate-x-full' : '-translate-x-full',
          'md:translate-x-0'
        )}
      >
        <div className={cn('flex items-center gap-3 border-b border-sidebar-border px-4 py-4', collapsed && 'justify-center px-2')}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg">
            <img src="/images/school-logo.png" alt="Logo" className="h-full w-full object-contain" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-sm font-bold text-sidebar-foreground">{t('Al-Bari Schools', 'مدارس البارئ')}</h1>
              <p className="text-[10px] uppercase tracking-wider text-sidebar-foreground/50">
                {t('Result Portal', 'بوابة النتائج')}
              </p>
            </div>
          )}
          <button onClick={() => setSidebarOpen(false)} className="text-sidebar-foreground/70 hover:text-sidebar-foreground md:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto px-2 py-3">
          {filteredGroups.map((group, gi) => (
            <div key={gi}>
              {!collapsed && (
                <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                  {t(group.label_en, group.label_ar)}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map(item => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      title={collapsed ? t(item.label_en, item.label_ar) : undefined}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150',
                        collapsed && 'justify-center px-2',
                        isActive
                          ? 'bg-sidebar-primary/15 text-sidebar-primary shadow-sm'
                          : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground'
                      )}
                    >
                      <item.icon className={cn('h-[18px] w-[18px] shrink-0', isActive && 'text-sidebar-primary')} />
                      {!collapsed && t(item.label_en, item.label_ar)}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="hidden border-t border-sidebar-border md:block">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex w-full items-center justify-center py-2.5 text-sidebar-foreground/40 transition-colors hover:text-sidebar-foreground/70"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <div className="border-t border-sidebar-border p-2">
          <div className={cn('flex items-center gap-2.5 rounded-lg px-2 py-2', collapsed && 'justify-center px-0')}>
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-sidebar-primary/20 text-xs font-bold text-sidebar-primary">{userInitials}</AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-sidebar-foreground">{user?.email}</p>
                <Badge variant="outline" className="h-4 border-sidebar-primary/30 text-[9px] text-sidebar-primary/80">
                  {role || 'user'}
                </Badge>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Link
              to="/admin/settings/profile"
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-sidebar-foreground/60 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground',
                collapsed && 'justify-center px-2'
              )}
            >
              <UserCog className="h-4 w-4" />
              {!collapsed && t('Settings', 'الإعدادات')}
            </Link>

            <button
              onClick={async () => {
                await signOut();
                navigate('/admin/login');
              }}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-sidebar-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive',
                collapsed && 'justify-center px-2'
              )}
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && t('Logout', 'تسجيل الخروج')}
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 px-3 pt-3 md:hidden">
          <div className="rounded-[24px] border border-border/60 bg-card/95 px-3 py-3 shadow-card backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border/60 bg-background text-foreground transition-transform active:scale-95"
                aria-label={t('Open menu', 'فتح القائمة')}
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="min-w-0 flex-1 text-center">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  {t('Admin Portal', 'بوابة الإدارة')}
                </p>
                <h2 className="truncate text-base font-semibold text-foreground">{pageTitle}</h2>
              </div>

              <Link to="/admin/settings/profile" className="flex shrink-0 items-center justify-center">
                <Avatar className="h-11 w-11 border border-border/60 bg-background">
                  <AvatarFallback className="bg-muted text-sm font-semibold text-foreground">{userInitials}</AvatarFallback>
                </Avatar>
              </Link>
            </div>
          </div>
        </header>

        <header className="sticky top-0 z-30 hidden items-center justify-between border-b bg-card/80 px-6 py-2.5 backdrop-blur-md md:flex">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-foreground/80">{t('Al-Bari Madrasah Portal', 'بوابة مدرسة البارئ')}</h2>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
          </div>
        </header>

        <main className="flex-1 px-3 pb-28 pt-3 md:p-6 md:pb-0 lg:p-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>

        <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="mx-3 mb-3 rounded-[28px] border border-border/60 bg-card/95 p-2 shadow-card-lg backdrop-blur-xl">
            <div className="grid grid-cols-5 gap-1">
              {mobileDockItems.map(item => {
                const active = item.to === '/admin'
                  ? location.pathname === item.to
                  : location.pathname.startsWith(item.to);

                if (item.type === 'action') {
                  return (
                    <button
                      key={item.label_en}
                      type="button"
                      onClick={() => setSidebarOpen(true)}
                      className="flex flex-col items-center gap-1 rounded-[20px] px-2 py-2.5 text-muted-foreground transition-colors active:bg-muted"
                      aria-label={t(item.label_en, item.label_ar)}
                    >
                      <item.icon className="h-5 w-5" strokeWidth={1.9} />
                      <span className="text-[10px] font-medium leading-none">{t(item.label_en, item.label_ar)}</span>
                    </button>
                  );
                }

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-[20px] px-2 py-2.5 transition-all duration-200',
                      active ? 'bg-primary text-primary-foreground shadow-card' : 'text-muted-foreground'
                    )}
                    aria-label={t(item.label_en, item.label_ar)}
                  >
                    <item.icon className="h-5 w-5" strokeWidth={active ? 2.2 : 1.9} />
                    <span className={cn('text-[10px] leading-none', active ? 'font-semibold' : 'font-medium')}>
                      {t(item.label_en, item.label_ar)}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
};
