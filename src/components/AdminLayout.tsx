import { ReactNode, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import {
  LayoutGrid,
  GraduationCap,
  BookText,
  Rows3,
  Grid2x2,
  CalendarRange,
  ClipboardPen,
  ArrowUpRight,
  FileBarChart,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Home,
  BarChart3,
  Building2,
  Table2,
  Globe2,
  Newspaper,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CampusSwitcher } from '@/components/CampusSwitcher';

interface AdminLayoutProps {
  children: ReactNode;
}

const navGroups = [
  {
    label_en: 'Overview',
    label_ar: 'نظرة عامة',
    items: [
      { path: '/admin', icon: LayoutGrid, label_en: 'Dashboard', label_ar: 'لوحة التحكم' },
    ],
  },
  {
    label_en: 'Academic',
    label_ar: 'الشؤون الأكاديمية',
    items: [
      { path: '/admin/students', icon: GraduationCap, label_en: 'Students', label_ar: 'الطلاب' },
      { path: '/admin/class-levels', icon: Rows3, label_en: 'Class Levels', label_ar: 'المراحل الدراسية' },
      { path: '/admin/class-arms', icon: Grid2x2, label_en: 'Class Arms', label_ar: 'الشعب' },
      { path: '/admin/subjects', icon: BookText, label_en: 'Subjects', label_ar: 'المواد الدراسية' },
      { path: '/admin/sessions', icon: CalendarRange, label_en: 'Sessions & Terms', label_ar: 'السنوات الدراسية والفصول' },
    ],
  },
  {
    label_en: 'Assessment',
    label_ar: 'التقييم',
    items: [
      { path: '/admin/results', icon: ClipboardPen, label_en: 'Results Entry', label_ar: 'إدخال النتائج' },
      { path: '/admin/reports', icon: FileBarChart, label_en: 'Reports', label_ar: 'التقارير' },
      { path: '/admin/broadsheet', icon: Table2, label_en: 'Class Broadsheet', label_ar: 'كشف الدرجات' },
      { path: '/admin/promotion', icon: ArrowUpRight, label_en: 'Promotion', label_ar: 'الترقية' },
      { path: '/admin/locking', icon: ShieldCheck, label_en: 'Result Locking', label_ar: 'قفل النتائج' },
    ],
  },
  {
    label_en: 'Administration',
    label_ar: 'الإدارة',
    items: [
      { path: '/admin/campuses', icon: Building2, label_en: 'Campuses', label_ar: 'الفروع' },
      { path: '/admin/staff', icon: Settings, label_en: 'Staff Management', label_ar: 'إدارة الموظفين' },
      { path: '/admin/website', icon: Globe2, label_en: 'Website', label_ar: 'الموقع الإلكتروني' },
      { path: '/admin/website/posts', icon: Newspaper, label_en: 'Website Posts', label_ar: 'منشورات الموقع' },
    ],
  },
];

const mobileDockItems = [
  { type: 'link' as const, to: '/admin', icon: Home, label_en: 'Home', label_ar: 'الرئيسية', exact: true },
  { type: 'link' as const, to: '/admin/students', icon: GraduationCap, label_en: 'Students', label_ar: 'الطلاب' },
  { type: 'link' as const, to: '/admin/results', icon: ClipboardPen, label_en: 'Results', label_ar: 'النتائج' },
  { type: 'link' as const, to: '/admin/reports', icon: BarChart3, label_en: 'Reports', label_ar: 'التقارير' },
  { type: 'action' as const, to: '', icon: Menu, label_en: 'More', label_ar: 'المزيد', exact: false },
];

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { t, isRTL } = useLanguage();
  const { signOut, isAdmin, isSuperAdmin, role, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const filteredGroups = navGroups
    .map(group => ({
      ...group,
      items: isAdmin
        ? group.items.filter(item => isSuperAdmin || !['/admin/campuses', '/admin/website', '/admin/website/posts'].includes(item.path))
        : group.items.filter(item => ['/admin', '/admin/results', '/admin/reports', '/admin/broadsheet', '/admin/students'].includes(item.path)),
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
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-md md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ─── Sidebar ─── */}
      <aside
        className={cn(
          'fixed inset-y-0 z-50 flex flex-col bg-sidebar transition-all duration-300 ease-in-out md:relative',
          collapsed ? 'w-[72px]' : 'w-[260px]',
          isRTL ? 'right-0 border-l border-sidebar-border' : 'left-0 border-r border-sidebar-border',
          sidebarOpen ? 'translate-x-0' : isRTL ? 'translate-x-full' : '-translate-x-full',
          'md:translate-x-0',
          'md:shadow-none shadow-2xl'
        )}
      >
        {/* Sidebar header */}
        <div className={cn(
          'flex items-center gap-3 px-5 py-6',
          collapsed && 'justify-center px-3'
        )}>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-sidebar-primary shadow-lg shadow-black/10">
            <img src="/images/school-logo.png" alt="Logo" className="h-7 w-7 object-contain" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[15px] font-bold text-sidebar-foreground leading-tight">
                {t('Al-Bari Schools', 'مدارس البارئ')}
              </h1>
              <p className="mt-0.5 text-[11px] text-sidebar-foreground/45">
                {t('Academic operations', 'الإدارة الأكاديمية')}
              </p>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground md:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-sidebar-border px-4 pb-5">
          <CampusSwitcher className="w-full border-sidebar-border bg-sidebar-accent text-sidebar-foreground" />
        </div>

        {/* Sidebar nav */}
        <ScrollArea className="flex-1 px-3">
          <nav className="space-y-7 py-4">
            {filteredGroups.map((group, gi) => (
              <div key={gi}>
                {!collapsed && (
                  <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-sidebar-foreground/30">
                    {t(group.label_en, group.label_ar)}
                  </p>
                )}
                <div className="space-y-1">
                  {group.items.map(item => {
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setSidebarOpen(false)}
                        title={collapsed ? t(item.label_en, item.label_ar) : undefined}
                        className={cn(
                          'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all duration-200',
                          collapsed && 'justify-center px-0',
                          isActive
                            ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-black/10'
                            : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                        )}
                      >
                        <item.icon
                          className={cn(
                            'h-[18px] w-[18px] shrink-0 transition-colors',
                            isActive ? 'text-sidebar-primary-foreground' : 'text-sidebar-foreground/50 group-hover:text-sidebar-foreground'
                          )}
                          strokeWidth={isActive ? 2.2 : 1.8}
                        />
                        {!collapsed && t(item.label_en, item.label_ar)}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </ScrollArea>

        {/* Desktop collapse toggle */}
        <div className="hidden border-t border-sidebar-border md:block">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex w-full items-center justify-center py-3 text-sidebar-foreground/30 transition-colors hover:text-sidebar-foreground/60"
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>

        {/* Sidebar footer — user section */}
        <div className="border-t border-sidebar-border p-3">
          <div className={cn('flex items-center gap-3 rounded-xl px-3 py-2.5', collapsed && 'justify-center px-0')}>
            <Avatar className="h-9 w-9 shrink-0 ring-2 ring-sidebar-accent">
              <AvatarFallback className="bg-sidebar-primary/20 text-xs font-bold text-sidebar-primary">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-sidebar-foreground">{user?.email}</p>
                <Badge
                  variant="outline"
                  className="mt-0.5 h-[18px] border-sidebar-primary/30 px-1.5 text-[10px] font-medium text-sidebar-primary/80"
                >
                  {role || 'user'}
                </Badge>
              </div>
            )}
          </div>

          <div className="mt-1 space-y-0.5">
            <Link
              to="/admin/settings/profile"
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium text-sidebar-foreground/50 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground',
                collapsed && 'justify-center px-0'
              )}
            >
              <Settings className="h-4 w-4" strokeWidth={1.8} />
              {!collapsed && t('Settings', 'الإعدادات')}
            </Link>

            <button
              onClick={async () => {
                await signOut();
                navigate('/admin/login');
              }}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium text-sidebar-foreground/40 transition-colors hover:bg-destructive/10 hover:text-destructive',
                collapsed && 'justify-center px-0'
              )}
            >
              <LogOut className="h-4 w-4" strokeWidth={1.8} />
              {!collapsed && t('Logout', 'تسجيل الخروج')}
            </button>
          </div>
        </div>
      </aside>

      {/* ─── Main content ─── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 md:hidden">
          <div className="flex items-center justify-between bg-background/80 px-4 py-3 backdrop-blur-lg">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-card text-foreground shadow-sm transition-transform active:scale-95"
              aria-label={t('Open menu', 'فتح القائمة')}
            >
              <Menu className="h-5 w-5" strokeWidth={1.8} />
            </button>

            <div className="min-w-0 flex-1 text-center">
              <h2 className="truncate text-[15px] font-semibold text-foreground">{pageTitle}</h2>
            </div>

            <Link to="/admin/settings/profile" className="shrink-0">
              <Avatar className="h-10 w-10 shadow-sm">
                <AvatarFallback className="bg-primary text-[13px] font-semibold text-primary-foreground">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
          <div className="h-px bg-border/60" />
        </header>

        {/* Desktop top bar */}
        <header className="sticky top-0 z-30 hidden items-center justify-between border-b border-border/70 bg-background/85 px-8 py-4 backdrop-blur-md md:flex">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-accent" />
            <h2 className="text-[13px] font-bold tracking-wide text-foreground/75">{t('Al-Bari Madrasah Portal', 'بوابة مدرسة البارئ')}</h2>
            <span className="text-xs text-muted-foreground">/</span>
            <span className="text-xs text-muted-foreground">{pageTitle}</span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-4 pb-24 pt-4 md:p-8 md:pb-0 xl:px-10">
          <div className="mx-auto w-full max-w-[1440px]">
            <div className="relative mb-7 overflow-hidden rounded-2xl border border-border/60 surface-panel p-5 shadow-card sm:p-6">
              <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-accent/15 blur-2xl" />
              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                  <p className="mb-1.5 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary/75">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                    {t('Workspace', 'مساحة العمل')}
                  </p>
                  <h1 className="truncate font-display text-2xl font-extrabold tracking-tight text-foreground md:text-[28px]">{pageTitle}</h1>
                </div>
                <CampusSwitcher className="w-full border-border/70 bg-card shadow-sm sm:w-[240px]" />
              </div>
            </div>

            {children}
          </div>
        </main>

        {/* ─── Mobile bottom nav ─── */}
        <nav
          className="fixed bottom-0 left-0 right-0 z-40 px-3 md:hidden"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="mx-auto max-w-lg rounded-t-3xl border border-border/70 bg-card/95 px-2 pt-2 shadow-[0_-8px_30px_hsl(var(--foreground)/0.08)] backdrop-blur-lg">
            <div className="flex items-stretch justify-around gap-1">
              {mobileDockItems.map(item => {
                if (item.type === 'action') {
                  return (
                    <button
                      key="more"
                      type="button"
                      onClick={() => setSidebarOpen(true)}
                      className="flex min-h-[58px] min-w-[58px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-2 text-muted-foreground transition-colors active:bg-muted active:text-foreground"
                      aria-label={t(item.label_en, item.label_ar)}
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted/70">
                        <Menu className="h-[19px] w-[19px]" strokeWidth={1.8} />
                      </div>
                      <span className="text-[10px] font-semibold">{t(item.label_en, item.label_ar)}</span>
                    </button>
                  );
                }

                const active = item.exact
                  ? location.pathname === item.to
                  : location.pathname.startsWith(item.to);

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      'relative flex min-h-[58px] min-w-[58px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-2 transition-colors',
                      active ? 'bg-primary/10 text-primary' : 'text-muted-foreground active:bg-muted'
                    )}
                    aria-label={t(item.label_en, item.label_ar)}
                  >
                    <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg', active && 'bg-primary text-primary-foreground')}>
                      <item.icon
                        className="h-[18px] w-[18px]"
                        strokeWidth={active ? 2 : 1.8}
                      />
                    </div>
                    <span className={cn(
                      'text-[10px] leading-none',
                      active ? 'font-semibold' : 'font-medium'
                    )}>
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
