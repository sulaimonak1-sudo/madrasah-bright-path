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
    label_ar: 'الأكاديمية',
    items: [
      { path: '/admin/students', icon: GraduationCap, label_en: 'Students', label_ar: 'الطلاب' },
      { path: '/admin/class-levels', icon: Rows3, label_en: 'Class Levels', label_ar: 'المراحل الدراسية' },
      { path: '/admin/class-arms', icon: Grid2x2, label_en: 'Class Arms', label_ar: 'الشعب' },
      { path: '/admin/subjects', icon: BookText, label_en: 'Subjects', label_ar: 'المواد الدراسية' },
      { path: '/admin/sessions', icon: CalendarRange, label_en: 'Sessions & Terms', label_ar: 'السنوات والفصول' },
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
          collapsed ? 'w-[72px]' : 'w-72',
          isRTL ? 'right-0 border-l border-sidebar-border' : 'left-0 border-r border-sidebar-border',
          sidebarOpen ? 'translate-x-0' : isRTL ? 'translate-x-full' : '-translate-x-full',
          'md:translate-x-0',
          'md:shadow-none shadow-2xl'
        )}
      >
        {/* Sidebar header */}
        <div className={cn(
          'flex items-center gap-3 px-5 py-5',
          collapsed && 'justify-center px-3'
        )}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-sidebar-accent">
            <img src="/images/school-logo.png" alt="Logo" className="h-7 w-7 object-contain" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[15px] font-bold text-sidebar-foreground leading-tight">
                {t('Al-Bari Schools', 'مدارس البارئ')}
              </h1>
              <p className="text-[11px] text-sidebar-foreground/50">
                {t('Result Portal', 'بوابة النتائج')}
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

        <div className="border-b border-sidebar-border px-4 pb-4">
          <CampusSwitcher className="w-full border-sidebar-border bg-sidebar-accent text-sidebar-foreground" />
        </div>

        {/* Sidebar nav */}
        <ScrollArea className="flex-1 px-3">
          <nav className="space-y-6 py-2">
            {filteredGroups.map((group, gi) => (
              <div key={gi}>
                {!collapsed && (
                  <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-sidebar-foreground/30">
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
                          'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200',
                          collapsed && 'justify-center px-0',
                          isActive
                            ? 'bg-sidebar-primary text-sidebar-primary-foreground'
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
        <header className="sticky top-0 z-30 hidden items-center justify-between border-b bg-card/80 px-6 py-2.5 backdrop-blur-md md:flex">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-foreground/80">{t('Al-Bari Madrasah Portal', 'بوابة مدرسة البارئ')}</h2>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-4 pb-24 pt-4 md:p-6 md:pb-0 lg:p-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>

        {/* ─── Mobile bottom nav ─── */}
        <nav
          className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="border-t border-border/40 bg-card/95 backdrop-blur-lg">
            <div className="mx-auto flex max-w-md items-stretch justify-around px-2 py-1">
              {mobileDockItems.map(item => {
                if (item.type === 'action') {
                  return (
                    <button
                      key="more"
                      type="button"
                      onClick={() => setSidebarOpen(true)}
                      className="flex min-w-[56px] flex-col items-center justify-center gap-0.5 py-2 text-muted-foreground transition-colors active:text-foreground"
                      aria-label={t(item.label_en, item.label_ar)}
                    >
                      <div className="flex h-7 w-7 items-center justify-center">
                        <Menu className="h-[22px] w-[22px]" strokeWidth={1.6} />
                      </div>
                      <span className="text-[10px] font-medium">{t(item.label_en, item.label_ar)}</span>
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
                      'relative flex min-w-[56px] flex-col items-center justify-center gap-0.5 py-2 transition-colors',
                      active ? 'text-primary' : 'text-muted-foreground'
                    )}
                    aria-label={t(item.label_en, item.label_ar)}
                  >
                    {active && (
                      <span className="absolute top-0 left-1/2 h-[2.5px] w-8 -translate-x-1/2 rounded-full bg-primary" />
                    )}
                    <div className="flex h-7 w-7 items-center justify-center">
                      <item.icon
                        className="h-[22px] w-[22px]"
                        strokeWidth={active ? 2.2 : 1.6}
                      />
                    </div>
                    <span className={cn(
                      'text-[10px]',
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
