import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import {
  LayoutDashboard, Users, BookOpen, Layers, FolderOpen,
  Calendar, Upload, TrendingUp, FileText, Lock, LogOut, Menu, X,
  UserCog, ChevronLeft, ChevronRight, Bell, MoreHorizontal
} from 'lucide-react';
import { useState } from 'react';
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

// Mobile bottom tab items
const mobileTabItems = [
  { to: '/admin', icon: LayoutDashboard, label_en: 'Home', label_ar: 'الرئيسية', exact: true },
  { to: '/admin/students', icon: Users, label_en: 'Students', label_ar: 'الطلاب' },
  { to: '/admin/results', icon: Upload, label_en: 'Results', label_ar: 'النتائج' },
  { to: '/admin/reports', icon: FileText, label_en: 'Reports', label_ar: 'التقارير' },
];

const mobileTabItemsAdmin = [
  { to: '/admin', icon: LayoutDashboard, label_en: 'Home', label_ar: 'الرئيسية', exact: true },
  { to: '/admin/students', icon: Users, label_en: 'Students', label_ar: 'الطلاب' },
  { to: '/admin/results', icon: Upload, label_en: 'Results', label_ar: 'النتائج' },
  { to: '/admin/subjects', icon: BookOpen, label_en: 'Subjects', label_ar: 'المواد' },
  { to: '/admin/reports', icon: FileText, label_en: 'Reports', label_ar: 'التقارير' },
];

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { t, isRTL } = useLanguage();
  const { signOut, isAdmin, role, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Filter nav groups based on role
  const filteredGroups = navGroups.map(group => ({
    ...group,
    items: isAdmin
      ? group.items
      : group.items.filter(item =>
          ['/admin', '/admin/results', '/admin/reports', '/admin/students'].includes(item.path)
        ),
  })).filter(group => group.items.length > 0);

  const userInitials = user?.email?.substring(0, 2).toUpperCase() || 'U';
  const userName = user?.email?.split('@')[0] || 'User';
  const tabs = isAdmin ? mobileTabItemsAdmin : mobileTabItems;

  // Get current page title for mobile header
  const allItems = navGroups.flatMap(g => g.items);
  const currentPage = allItems.find(i => i.path === location.pathname);
  const pageTitle = currentPage ? t(currentPage.label_en, currentPage.label_ar) : t('Dashboard', 'لوحة التحكم');

  return (
    <div className={cn("flex min-h-screen bg-background", isRTL && "flex-row-reverse")}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar — desktop + mobile drawer */}
      <aside className={cn(
        "fixed z-50 inset-y-0 flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 md:relative",
        collapsed ? "w-[68px]" : "w-64",
        isRTL ? "right-0" : "left-0",
        sidebarOpen ? "translate-x-0" : (isRTL ? "translate-x-full" : "-translate-x-full"),
        "md:translate-x-0"
      )}>
        {/* Logo */}
        <div className={cn("flex items-center gap-3 px-4 py-4 border-b border-sidebar-border", collapsed && "justify-center px-2")}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg">
            <img src="/images/school-logo.png" alt="Logo" className="h-full w-full object-contain" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-bold text-sidebar-foreground truncate">
                {t('Al-Bari Schools', 'مدارس البارئ')}
              </h1>
              <p className="text-[10px] text-sidebar-foreground/50 uppercase tracking-wider">
                {t('Result Portal', 'بوابة النتائج')}
              </p>
            </div>
          )}
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-sidebar-foreground/70 hover:text-sidebar-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav groups */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {filteredGroups.map((group, gi) => (
            <div key={gi}>
              {!collapsed && (
                <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
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
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150",
                        collapsed && "justify-center px-2",
                        isActive
                          ? "bg-sidebar-primary/15 text-sidebar-primary shadow-sm"
                          : "text-sidebar-foreground/60 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
                      )}
                    >
                      <item.icon className={cn("h-[18px] w-[18px] shrink-0", isActive && "text-sidebar-primary")} />
                      {!collapsed && t(item.label_en, item.label_ar)}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Collapse toggle (desktop only) */}
        <div className="hidden md:block border-t border-sidebar-border">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex w-full items-center justify-center py-2.5 text-sidebar-foreground/40 hover:text-sidebar-foreground/70 transition-colors"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Footer - User info + Logout */}
        <div className="border-t border-sidebar-border p-2">
          <div className={cn(
            "flex items-center gap-2.5 rounded-lg px-2 py-2",
            collapsed && "justify-center px-0"
          )}>
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-sidebar-primary/20 text-sidebar-primary text-xs font-bold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-sidebar-foreground truncate">{user?.email}</p>
                <Badge variant="outline" className="text-[9px] h-4 border-sidebar-primary/30 text-sidebar-primary/80">
                  {role || 'user'}
                </Badge>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Link
              to="/admin/settings/profile"
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-sidebar-foreground/60 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground",
                collapsed && "justify-center px-2"
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
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-sidebar-foreground/50 hover:bg-destructive/10 hover:text-destructive transition-colors",
                collapsed && "justify-center px-2"
              )}
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && t('Logout', 'تسجيل الخروج')}
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Mobile header — clean, modern with avatar */}
        <header className="md:hidden sticky top-0 z-30 bg-card border-b border-border/50 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="flex items-center justify-center h-10 w-10 rounded-xl bg-muted/60 text-foreground active:scale-95 transition-transform"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <p className="text-xs text-muted-foreground font-medium">
                  {t('Welcome back', 'مرحبًا بعودتك')} 👋
                </p>
                <h2 className="text-base font-bold text-foreground leading-tight capitalize">
                  {userName}
                </h2>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <LanguageToggle />
              <Link
                to="/admin/settings/profile"
                className="flex items-center justify-center"
              >
                <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </div>
          </div>
        </header>

        {/* Desktop header */}
        <header className="hidden md:flex sticky top-0 z-30 items-center justify-between border-b bg-card/80 backdrop-blur-md px-6 py-2.5">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-foreground/80">
              {t('Al-Bari Madrasah Portal', 'بوابة مدرسة البارئ')}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 pb-24 md:pb-0">
          {children}
        </main>

        {/* Mobile bottom tab bar — inspired by reference: clean, modern, no gradients */}
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-40"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {/* Floating tab bar container */}
          <div className="mx-3 mb-2 bg-card rounded-2xl border border-border/40 shadow-lg">
            <div className="flex items-center justify-around py-1.5">
              {tabs.map(item => {
                const active = item.exact
                  ? location.pathname === item.to
                  : location.pathname.startsWith(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    aria-label={t(item.label_en, item.label_ar)}
                    className={cn(
                      "relative flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-all duration-200",
                      active && "bg-primary/10"
                    )}
                  >
                    {/* Active top indicator bar */}
                    {active && (
                      <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 h-[3px] w-6 rounded-full bg-primary" />
                    )}
                    <item.icon
                      className={cn(
                        "h-5 w-5 transition-colors duration-200",
                        active ? "text-primary" : "text-muted-foreground"
                      )}
                      strokeWidth={active ? 2.4 : 1.8}
                    />
                    <span
                      className={cn(
                        "text-[10px] leading-none transition-colors duration-200",
                        active
                          ? "font-semibold text-primary"
                          : "font-medium text-muted-foreground"
                      )}
                    >
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
